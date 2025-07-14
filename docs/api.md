# 📖 API Документация

## Базовый URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Аутентификация

В текущей версии аутентификация не требуется. Все эндпоинты доступны публично.

## Rate Limiting

- **Лимит**: 100 запросов в минуту на IP
- **Заголовки ответа**: 
  - `X-RateLimit-Limit`: максимум запросов
  - `X-RateLimit-Remaining`: оставшиеся запросы
  - `X-RateLimit-Reset`: время сброса лимита

## Эндпоинты

### Health Check

#### `GET /health`

Проверка состояния сервера.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-14T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 41943040,
    "heapTotal": 29388800,
    "heapUsed": 20137856,
    "external": 1089426
  },
  "env": "production"
}
```

### Заявки

#### `GET /api/requests`

Получить все заявки.

**Ответ:**
```json
[
  {
    "id": 1642156800000.123,
    "text": "Заявка от клиента #1",
    "createdAt": "2025-07-14T10:00:00.000Z",
    "updatedAt": "2025-07-14T10:30:00.000Z"
  },
  {
    "id": 1642156900000.456,
    "text": "Заявка от клиента #2",
    "createdAt": "2025-07-14T10:15:00.000Z"
  }
]
```

#### `POST /api/requests`

Создать новую заявку.

**Тело запроса:**
```json
{
  "text": "Новая заявка от клиента"
}
```

**Валидация:**
- `text` (обязательно): строка длиной от 1 до 1000 символов
- Пробелы в начале и конце обрезаются автоматически

**Ответ (201 Created):**
```json
{
  "id": 1642157000000.789,
  "text": "Новая заявка от клиента",
  "createdAt": "2025-07-14T10:30:00.000Z"
}
```

**Ошибки:**
- `400 Bad Request`: неверные данные
- `429 Too Many Requests`: превышен лимит запросов
- `500 Internal Server Error`: ошибка сервера

#### `PUT /api/requests/:id`

Обновить существующую заявку.

**Параметры:**
- `id` (path): ID заявки

**Тело запроса:**
```json
{
  "text": "Обновленный текст заявки"
}
```

**Ответ (200 OK):**
```json
{
  "id": 1642157000000.789,
  "text": "Обновленный текст заявки",
  "createdAt": "2025-07-14T10:30:00.000Z",
  "updatedAt": "2025-07-14T10:45:00.000Z"
}
```

**Ошибки:**
- `400 Bad Request`: неверные данные
- `404 Not Found`: заявка не найдена
- `500 Internal Server Error`: ошибка сервера

#### `DELETE /api/requests/:id`

Удалить заявку.

**Параметры:**
- `id` (path): ID заявки

**Ответ (200 OK):**
```json
{
  "id": 1642157000000.789,
  "text": "Удаленная заявка",
  "createdAt": "2025-07-14T10:30:00.000Z"
}
```

**Ошибки:**
- `404 Not Found`: заявка не найдена
- `500 Internal Server Error`: ошибка сервера

## Статические файлы

### `GET /`

Главная страница приложения.

### `GET /static/*`

Статические файлы (CSS, JS, изображения).

**Кэширование:**
- Development: без кэширования
- Production: кэширование на 1 день

## Коды ошибок

### 2xx Success
- `200 OK`: запрос выполнен успешно
- `201 Created`: ресурс создан успешно

### 4xx Client Error
- `400 Bad Request`: неверный запрос
- `404 Not Found`: ресурс не найден
- `429 Too Many Requests`: превышен лимит запросов

### 5xx Server Error
- `500 Internal Server Error`: внутренняя ошибка сервера

## Примеры использования

### JavaScript (fetch)

```javascript
// Получить все заявки
const requests = await fetch('/api/requests')
  .then(response => response.json());

// Создать заявку
const newRequest = await fetch('/api/requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Новая заявка'
  })
}).then(response => response.json());

// Обновить заявку
const updatedRequest = await fetch(`/api/requests/${requestId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Обновленный текст'
  })
}).then(response => response.json());

// Удалить заявку
await fetch(`/api/requests/${requestId}`, {
  method: 'DELETE'
});
```

### cURL

```bash
# Получить все заявки
curl -X GET http://localhost:3000/api/requests

# Создать заявку
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"text": "Новая заявка"}'

# Обновить заявку
curl -X PUT http://localhost:3000/api/requests/1642157000000.789 \
  -H "Content-Type: application/json" \
  -d '{"text": "Обновленный текст"}'

# Удалить заявку
curl -X DELETE http://localhost:3000/api/requests/1642157000000.789

# Проверить здоровье сервера
curl -X GET http://localhost:3000/health
```

### Python (requests)

```python
import requests
import json

base_url = "http://localhost:3000"

# Получить все заявки
response = requests.get(f"{base_url}/api/requests")
requests_data = response.json()

# Создать заявку
new_request = {
    "text": "Новая заявка"
}
response = requests.post(
    f"{base_url}/api/requests",
    json=new_request
)
created_request = response.json()

# Обновить заявку
updated_data = {
    "text": "Обновленный текст"
}
response = requests.put(
    f"{base_url}/api/requests/{request_id}",
    json=updated_data
)
updated_request = response.json()

# Удалить заявку
response = requests.delete(f"{base_url}/api/requests/{request_id}")
```

## Расширение API

### Будущие возможности

Планируется добавить:
- Аутентификацию и авторизацию
- Пагинацию для больших списков
- Фильтрацию и сортировку
- Webhooks для уведомлений
- Экспорт данных в различные форматы

### Кастомизация

Для добавления новых эндпоинтов:

1. Добавьте роуты в `server.js`
2. Реализуйте логику обработки
3. Добавьте валидацию данных
4. Обновите документацию

Пример добавления нового эндпоинта:

```javascript
// Получить статистику
app.get('/api/stats', (req, res) => {
    try {
        const requests = readRequests();
        const stats = {
            total: requests.length,
            today: requests.filter(r => 
                new Date(r.createdAt).toDateString() === new Date().toDateString()
            ).length,
            thisWeek: requests.filter(r => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(r.createdAt) > weekAgo;
            }).length
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});
```
