const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_FILE = path.join(__dirname, 'app-data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для загрузки файлов
app.use(compression());

if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files from dist directory in production, or current directory in development
const staticDir = fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : __dirname;
app.use(express.static(staticDir, {
    maxAge: NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));

console.log(`Serving static files from: ${staticDir}`);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: NODE_ENV
    });
});

// Структура данных приложения
const defaultData = {
    requests: [],
    mapPoints: [],
    completedCount: 0,
    nextRequestId: 1,
    nextClubId: 1,
    lastUpdated: new Date().toISOString()
};

// Чтение данных из файла с кэшированием
let dataCache = null;
let lastModified = null;

function readAppData() {
    try {
        const stats = fs.statSync(DATA_FILE);
        const currentModified = stats.mtime.getTime();
        
        // Используем кэш, если файл не изменился
        if (dataCache && lastModified === currentModified) {
            return dataCache;
        }
        
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        dataCache = { ...defaultData, ...JSON.parse(data) };
        lastModified = currentModified;
        return dataCache;
    } catch (e) {
        console.log('No data file found, starting with default data');
        dataCache = { ...defaultData };
        lastModified = null;
        return dataCache;
    }
}

// Запись данных в файл с инвалидацией кэша
function writeAppData(data) {
    try {
        const dataToWrite = {
            ...data,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataToWrite, null, 2), 'utf8');
        dataCache = dataToWrite;
        lastModified = fs.statSync(DATA_FILE).mtime.getTime();
    } catch (e) {
        console.error('Error writing data file:', e);
        throw e;
    }
}

// API Routes

// Получить все данные приложения
app.get('/api/data', (req, res) => {
    try {
        const data = readAppData();
        res.json(data);
    } catch (error) {
        console.error('Error reading app data:', error);
        res.status(500).json({ error: 'Failed to read app data' });
    }
});

// Сохранить все данные приложения
app.post('/api/data', (req, res) => {
    try {
        const { requests, mapPoints, completedCount, nextRequestId, nextClubId } = req.body;
        
        // Валидация данных
        if (!Array.isArray(requests) || !Array.isArray(mapPoints)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        
        const data = {
            requests,
            mapPoints,
            completedCount: completedCount || 0,
            nextRequestId: nextRequestId || 1,
            nextClubId: nextClubId || 1
        };
        
        writeAppData(data);
        res.json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving app data:', error);
        res.status(500).json({ error: 'Failed to save app data' });
    }
});

// Получить только заявки
app.get('/api/requests', (req, res) => {
    try {
        const data = readAppData();
        res.json(data.requests);
    } catch (error) {
        console.error('Error reading requests:', error);
        res.status(500).json({ error: 'Failed to read requests' });
    }
});

// Добавить заявку
app.post('/api/requests', (req, res) => {
    try {
        const { text, clubId } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const data = readAppData();
        const newRequest = {
            id: data.nextRequestId++,
            text: text.trim(),
            clubId: clubId || null,
            createdAt: new Date().toISOString()
        };
        
        data.requests.push(newRequest);
        writeAppData(data);
        res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// Редактировать заявку
app.put('/api/requests/:id', (req, res) => {
    try {
        const { text, clubId } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const data = readAppData();
        const idx = data.requests.findIndex(r => r.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        data.requests[idx].text = text.trim();
        data.requests[idx].clubId = clubId || null;
        data.requests[idx].updatedAt = new Date().toISOString();
        writeAppData(data);
        res.json(data.requests[idx]);
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Удалить заявку
app.delete('/api/requests/:id', (req, res) => {
    try {
        const data = readAppData();
        const idx = data.requests.findIndex(r => r.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const removed = data.requests.splice(idx, 1);
        writeAppData(data);
        res.json(removed[0]);
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// Отметить заявку как выполненную
app.post('/api/requests/:id/complete', (req, res) => {
    try {
        const data = readAppData();
        const idx = data.requests.findIndex(r => r.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const completed = data.requests.splice(idx, 1)[0];
        data.completedCount++;
        writeAppData(data);
        res.json({ message: 'Request marked as completed', request: completed });
    } catch (error) {
        console.error('Error completing request:', error);
        res.status(500).json({ error: 'Failed to complete request' });
    }
});

// API для работы с клубами/точками на карте
app.get('/api/clubs', (req, res) => {
    try {
        const data = readAppData();
        res.json(data.mapPoints);
    } catch (error) {
        console.error('Error reading clubs:', error);
        res.status(500).json({ error: 'Failed to read clubs' });
    }
});

// Добавить клуб
app.post('/api/clubs', (req, res) => {
    try {
        const { name, address, lat, lng } = req.body;
        
        if (!name || !lat || !lng) {
            return res.status(400).json({ error: 'Name, lat, and lng are required' });
        }
        
        const data = readAppData();
        const newClub = {
            id: data.nextClubId++,
            name: name.trim(),
            address: address ? address.trim() : '',
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            createdAt: new Date().toISOString()
        };
        
        data.mapPoints.push(newClub);
        writeAppData(data);
        res.status(201).json(newClub);
    } catch (error) {
        console.error('Error creating club:', error);
        res.status(500).json({ error: 'Failed to create club' });
    }
});

// Удалить клуб
app.delete('/api/clubs/:id', (req, res) => {
    try {
        const data = readAppData();
        const idx = data.mapPoints.findIndex(p => p.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Club not found' });
        }
        
        const removed = data.mapPoints.splice(idx, 1);
        
        // Удаляем связи с заявками
        data.requests.forEach(request => {
            if (request.clubId == req.params.id) {
                request.clubId = null;
            }
        });
        
        writeAppData(data);
        res.json(removed[0]);
    } catch (error) {
        console.error('Error deleting club:', error);
        res.status(500).json({ error: 'Failed to delete club' });
    }
});

// Массовый импорт данных
app.post('/api/import', (req, res) => {
    try {
        const { requests, mapPoints, type } = req.body;
        
        if (!Array.isArray(requests) && !Array.isArray(mapPoints)) {
            return res.status(400).json({ error: 'Invalid import data' });
        }
        
        const data = readAppData();
        let importedRequests = 0;
        let importedClubs = 0;
        
        // Импорт заявок
        if (Array.isArray(requests)) {
            requests.forEach(reqData => {
                if (reqData.text && !data.requests.find(r => r.text === reqData.text)) {
                    data.requests.push({
                        id: data.nextRequestId++,
                        text: reqData.text,
                        clubId: reqData.clubId || null,
                        createdAt: new Date().toISOString()
                    });
                    importedRequests++;
                }
            });
        }
        
        // Импорт клубов
        if (Array.isArray(mapPoints)) {
            mapPoints.forEach(clubData => {
                if (clubData.name && !data.mapPoints.find(p => p.name === clubData.name)) {
                    data.mapPoints.push({
                        id: data.nextClubId++,
                        name: clubData.name,
                        address: clubData.address || '',
                        lat: clubData.lat,
                        lng: clubData.lng,
                        createdAt: new Date().toISOString()
                    });
                    importedClubs++;
                }
            });
        }
        
        writeAppData(data);
        res.json({ 
            success: true, 
            imported: { requests: importedRequests, clubs: importedClubs } 
        });
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

// Serve the main app for all other routes (SPA support)
app.get('*', (req, res) => {
    // Проверяем, есть ли собранная версия
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Если нет собранной версии, используем оригинальный файл
        const originalPath = path.join(__dirname, 'improved_request_randomizer.html');
        if (fs.existsSync(originalPath)) {
            res.sendFile(originalPath);
        } else {
            res.status(404).json({error: 'Application not found'});
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
    console.log(`📁 Static files: ${staticDir}`);
    console.log(`📄 Data file: ${DATA_FILE}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
}); 