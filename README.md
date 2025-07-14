# 🎲 Рандомизатор заявок клиентов

> Минималистичный веб-сайт для случайного выбора и управления заявками клиентов

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Основные возможности

- 🎲 **Случайный выбор заявки** - рандомайзер с красивой анимацией
- 📊 **Загрузка из Excel** - поддержка .xlsx и .xls файлов
- ✏️ **Управление заявками** - добавление, редактирование, удаление
- 🔍 **Поиск и фильтрация** - быстрый поиск по заявкам
- 📈 **Статистика** - отслеживание выполненных заявок
- 🌙 **Современный дизайн** - тёмная тема с градиентами

## 🚀 Быстрый старт

```bash
# Клонируйте репозиторий
git clone https://github.com/B0xxxi/RandomIssue.git
cd RandomIssue

# Установите зависимости
npm install

# Запустите в режиме разработки
npm run dev

# Откройте браузер
open http://localhost:3000
```

## 🆕 Новые возможности после оптимизации

### 🔒 Безопасность
- Helmet.js для защиты заголовков
- Rate limiting для API (100 req/min)
- Валидация входных данных
- CSP политики

### ⚡ Производительность
- HTTP compression (gzip)
- Кэширование данных в памяти
- Минификация статических файлов
- Graceful shutdown

### 🛠️ DevOps
- 🐳 Docker поддержка
- 🔄 PM2 для production
- 📊 Health check эндпоинт
- 💾 Автоматическое резервное копирование

## � Документация

| Документ | Описание |
|----------|----------|
| [� Установка](docs/installation.md) | Детальная инструкция по установке и настройке |
| [🌐 Деплой](docs/deployment.md) | Все способы деплоя: Docker, PM2, облачные платформы |
| [� Конфигурация](docs/configuration.md) | Настройки сервера, переменные окружения, PM2 |
| [📖 API](docs/api.md) | Полная документация REST API |
| [� Мониторинг](docs/troubleshooting.md) | Мониторинг, логирование, устранение неполадок |

## 🎯 Команды

```bash
# Разработка
npm run dev          # Запуск с hot-reload
npm run build        # Сборка для production
npm run deploy       # Полный деплой

# Производство
npm start            # Запуск production сервера
./deploy.sh          # Деплой с проверками
./monitor.sh         # Мониторинг сервера
./backup.sh          # Резервное копирование

# Docker
docker-compose up -d # Запуск в контейнере
```

## 🔧 API Endpoints

- `GET /health` - Проверка состояния сервера
- `GET /api/requests` - Получить все заявки
- `POST /api/requests` - Создать заявку
- `PUT /api/requests/:id` - Обновить заявку
- `DELETE /api/requests/:id` - Удалить заявку

## 📊 Горячие клавиши

- `Ctrl + Enter` - Выбрать случайную заявку
- `Shift + Enter` - Отметить заявку как выполненную
- `Escape` - Закрыть модальное окно

## 🛡️ Безопасность

- Rate limiting (100 запросов/минуту)
- Валидация всех входных данных
- Helmet.js для безопасности заголовков
- CSP для предотвращения XSS

## � Деплой

### Локальный деплой
```bash
./deploy.sh
```

### Docker
```bash
docker-compose up -d
```

### PM2 (Production)
```bash
pm2 start ecosystem.config.json
```

### Облачные платформы
- **Heroku**: `git push heroku main`
- **Vercel**: `vercel --prod`
- **Railway**: Автоматический деплой через GitHub

## 📁 Структура проекта

```
RandomIssue/
├── docs/                    # 📚 Документация
├── src/                     # 💻 Исходный код (future)
├── public/                  # 🌐 Статические файлы
├── improved_request_randomizer.html  # 🎨 Главная страница
├── server.js                # 🚀 Express сервер
├── package.json             # 📦 Зависимости
├── deploy.sh                # 🚀 Скрипт деплоя
├── monitor.sh               # 🔍 Мониторинг
├── backup.sh                # 💾 Резервное копирование
├── Dockerfile               # 🐳 Docker конфигурация
├── docker-compose.yml       # 🐳 Docker Compose
├── ecosystem.config.json    # 🔄 PM2 конфигурация
└── .env.example             # ⚙️ Переменные окружения
```

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - подробности в файле [LICENSE](LICENSE)

## 👨‍💻 Автор

**B0xxxi** - [GitHub](https://github.com/B0xxxi)

---

⭐ Поставьте звездочку, если проект был полезен!
