# 🚀 Установка и запуск

## Требования

- Node.js >= 14.0.0
- npm >= 6.0.0

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/B0xxxi/RandomIssue.git
cd RandomIssue
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Открытие приложения

Перейдите в браузере на [http://localhost:3000](http://localhost:3000)

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

### Основные переменные:

- `NODE_ENV` - режим работы (development/production)
- `PORT` - порт сервера (по умолчанию 3000)
- `RATE_LIMIT_WINDOW_MS` - окно для rate limiting (60000ms)
- `RATE_LIMIT_MAX_REQUESTS` - максимум запросов в окне (100)
- `LOG_LEVEL` - уровень логирования (info)

## Структура проекта

```
RandomIssue/
├── docs/                             # Документация
├── src/                              # Исходный код (для будущих модификаций)
├── public/                           # Статические файлы
├── improved_request_randomizer.html  # Основной интерфейс
├── server.js                         # Express сервер
├── package.json                      # Зависимости и скрипты
├── requests.json                     # Файл для хранения заявок
├── deploy.sh                         # Скрипт деплоя
├── monitor.sh                        # Скрипт мониторинга
├── backup.sh                         # Скрипт резервного копирования
├── Dockerfile                        # Docker конфигурация
├── docker-compose.yml               # Docker Compose
├── ecosystem.config.json            # PM2 конфигурация
├── .env.example                     # Пример переменных окружения
└── dist/                            # Собранный проект
```

## Команды NPM

### Основные команды:
- `npm start` - запуск продакшн сервера
- `npm run dev` - запуск в режиме разработки (с nodemon)
- `npm run build` - сборка проекта с оптимизацией
- `npm run deploy` - полный деплой (очистка, сборка, запуск)
- `npm run clean` - очистка папки dist

### Дополнительные команды:
- `npm run lint` - проверка синтаксиса кода
- `npm run health` - проверка здоровья сервера
- `npm audit` - проверка уязвимостей
- `npm outdated` - проверка устаревших зависимостей

## Устранение неполадок

### Порт уже используется

```bash
# Найти процесс на порту 3000
lsof -ti:3000

# Остановить процесс
kill -9 $(lsof -ti:3000)
```

### Проблемы с зависимостями

```bash
# Очистка кэша npm
npm cache clean --force

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

### Проблемы с правами доступа

```bash
# Сделать скрипты исполняемыми
chmod +x deploy.sh monitor.sh backup.sh
```
