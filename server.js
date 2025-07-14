const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'requests.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory in production, or current directory in development
const staticDir = fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : __dirname;
app.use(express.static(staticDir));

console.log(`Serving static files from: ${staticDir}`);

// Чтение заявок из файла
function readRequests() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.log('No requests file found, starting with empty array');
        return [];
    }
}

// Запись заявок в файл
function writeRequests(requests) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing requests file:', e);
    }
}

// API Routes

// Получить все заявки
app.get('/api/requests', (req, res) => {
    res.json(readRequests());
});

// Добавить заявку
app.post('/api/requests', (req, res) => {
    const requests = readRequests();
    const newRequest = {
        id: Date.now(),
        text: req.body.text
    };
    requests.push(newRequest);
    writeRequests(requests);
    res.status(201).json(newRequest);
});

// Редактировать заявку
app.put('/api/requests/:id', (req, res) => {
    const requests = readRequests();
    const idx = requests.findIndex(r => r.id == req.params.id);
    if (idx === -1) return res.status(404).json({error: 'Not found'});
    requests[idx].text = req.body.text;
    writeRequests(requests);
    res.json(requests[idx]);
});

// Удалить заявку
app.delete('/api/requests/:id', (req, res) => {
    let requests = readRequests();
    const idx = requests.findIndex(r => r.id == req.params.id);
    if (idx === -1) return res.status(404).json({error: 'Not found'});
    const removed = requests.splice(idx, 1);
    writeRequests(requests);
    res.json(removed[0]);
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

app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
    console.log(`📁 Static files: ${staticDir}`);
    console.log(`📄 Data file: ${DATA_FILE}`);
}); 