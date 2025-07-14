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
const DATA_FILE = path.join(__dirname, 'requests.json');

// Middleware
app.use(cors());
app.use(express.json());

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

// Чтение заявок из файла с кэшированием
let requestsCache = null;
let lastModified = null;

function readRequests() {
    try {
        const stats = fs.statSync(DATA_FILE);
        const currentModified = stats.mtime.getTime();
        
        // Используем кэш, если файл не изменился
        if (requestsCache && lastModified === currentModified) {
            return requestsCache;
        }
        
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        requestsCache = JSON.parse(data);
        lastModified = currentModified;
        return requestsCache;
    } catch (e) {
        console.log('No requests file found, starting with empty array');
        requestsCache = [];
        lastModified = null;
        return [];
    }
}

// Запись заявок в файл с инвалидацией кэша
function writeRequests(requests) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
        requestsCache = requests;
        lastModified = fs.statSync(DATA_FILE).mtime.getTime();
    } catch (e) {
        console.error('Error writing requests file:', e);
        throw e;
    }
}

// API Routes

// Получить все заявки
app.get('/api/requests', (req, res) => {
    try {
        const requests = readRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read requests' });
    }
});

// Добавить заявку
app.post('/api/requests', (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const requests = readRequests();
        const newRequest = {
            id: Date.now() + Math.random(), // Улучшенная генерация ID
            text: text.trim(),
            createdAt: new Date().toISOString()
        };
        
        requests.push(newRequest);
        writeRequests(requests);
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// Редактировать заявку
app.put('/api/requests/:id', (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const requests = readRequests();
        const idx = requests.findIndex(r => r.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        requests[idx].text = text.trim();
        requests[idx].updatedAt = new Date().toISOString();
        writeRequests(requests);
        res.json(requests[idx]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Удалить заявку
app.delete('/api/requests/:id', (req, res) => {
    try {
        let requests = readRequests();
        const idx = requests.findIndex(r => r.id == req.params.id);
        
        if (idx === -1) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        const removed = requests.splice(idx, 1);
        writeRequests(requests);
        res.json(removed[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete request' });
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