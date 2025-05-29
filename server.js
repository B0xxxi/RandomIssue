const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'requests.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Чтение заявок из файла
function readRequests() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}
// Запись заявок в файл
function writeRequests(requests) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
}

// Получить все заявки
app.get('/requests', (req, res) => {
    res.json(readRequests());
});

// Добавить заявку
app.post('/requests', (req, res) => {
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
app.put('/requests/:id', (req, res) => {
    const requests = readRequests();
    const idx = requests.findIndex(r => r.id == req.params.id);
    if (idx === -1) return res.status(404).json({error: 'Not found'});
    requests[idx].text = req.body.text;
    writeRequests(requests);
    res.json(requests[idx]);
});

// Удалить заявку
app.delete('/requests/:id', (req, res) => {
    let requests = readRequests();
    const idx = requests.findIndex(r => r.id == req.params.id);
    if (idx === -1) return res.status(404).json({error: 'Not found'});
    const removed = requests.splice(idx, 1);
    writeRequests(requests);
    res.json(removed[0]);
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
}); 