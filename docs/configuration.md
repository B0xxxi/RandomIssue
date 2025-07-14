# 🔧 Конфигурация

## Переменные окружения

### Создание .env файла

```bash
cp .env.example .env
```

### Основные переменные

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `NODE_ENV` | `development` | Режим работы приложения |
| `PORT` | `3000` | Порт для запуска сервера |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Окно для rate limiting (мс) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Максимум запросов в окне |
| `LOG_LEVEL` | `info` | Уровень логирования |

### Пример .env файла

```env
# Режим работы
NODE_ENV=production

# Сервер
PORT=3000

# Безопасность
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Логирование
LOG_LEVEL=info

# Дополнительные настройки
MAX_FILE_SIZE=10485760  # 10MB
ENABLE_CORS=true
CORS_ORIGIN=*
```

## Конфигурация сервера

### Основные настройки

```javascript
// server.js
const config = {
    // Порт
    port: process.env.PORT || 3000,
    
    // Режим работы
    environment: process.env.NODE_ENV || 'development',
    
    // Лимиты
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Размер запроса
    maxRequestSize: process.env.MAX_FILE_SIZE || '10mb',
    
    // CORS
    corsEnabled: process.env.ENABLE_CORS === 'true',
    corsOrigin: process.env.CORS_ORIGIN || false
};
```

### Настройка безопасности

#### Helmet.js настройки

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
    referrerPolicy: { policy: "no-referrer" }
}));
```

#### CORS настройки

```javascript
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN || false 
        : true,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
};

app.use(cors(corsOptions));
```

## PM2 конфигурация

### ecosystem.config.json

```json
{
  "apps": [
    {
      "name": "randomissue",
      "script": "server.js",
      "cwd": "./dist",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000,
        "RATE_LIMIT_WINDOW_MS": 60000,
        "RATE_LIMIT_MAX_REQUESTS": 100
      },
      "env_development": {
        "NODE_ENV": "development",
        "PORT": 3000,
        "LOG_LEVEL": "debug"
      },
      "log_file": "./logs/app.log",
      "out_file": "./logs/out.log",
      "error_file": "./logs/error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "max_memory_restart": "1G",
      "node_args": "--max-old-space-size=1024",
      "restart_delay": 4000,
      "max_restarts": 10,
      "min_uptime": "10s",
      "watch": false,
      "ignore_watch": ["node_modules", "logs", "data"],
      "kill_timeout": 5000,
      "listen_timeout": 3000,
      "autorestart": true,
      "vizion": false
    }
  ]
}
```

### Команды PM2

```bash
# Запуск
pm2 start ecosystem.config.json

# Запуск в режиме разработки
pm2 start ecosystem.config.json --env development

# Мониторинг
pm2 monit

# Логи
pm2 logs

# Перезапуск
pm2 restart randomissue

# Остановка
pm2 stop randomissue

# Удаление
pm2 delete randomissue
```

## Docker конфигурация

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копирование приложения
COPY --from=builder --chown=nextjs:nodejs /app/dist ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Создание директорий
RUN mkdir -p /app/data /app/logs && chown -R nextjs:nodejs /app/data /app/logs

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  randomissue:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - RATE_LIMIT_WINDOW_MS=60000
      - RATE_LIMIT_MAX_REQUESTS=100
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Nginx для production
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - randomissue
    restart: unless-stopped
    profiles:
      - nginx
```

## Nginx конфигурация

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream randomissue {
        server randomissue:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types 
            text/plain
            text/css
            application/json
            application/javascript
            text/xml
            application/xml
            application/xml+rss
            text/javascript;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }

        # API routes
        location /api/ {
            proxy_pass http://randomissue;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Main app
        location / {
            proxy_pass http://randomissue;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## Логирование

### Конфигурация логов

```javascript
// Morgan для HTTP логов
const morgan = require('morgan');

const logFormat = process.env.NODE_ENV === 'production' 
    ? 'combined' 
    : 'dev';

app.use(morgan(logFormat));

// Кастомный формат логов
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
```

### Ротация логов

```bash
# Установка logrotate
sudo apt install logrotate

# Конфигурация /etc/logrotate.d/randomissue
/var/www/randomissue/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Мониторинг

### Health Check конфигурация

```javascript
// Расширенный health check
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        node_version: process.version
    };
    
    res.status(200).json(healthCheck);
});
```

### Prometheus метрики (опционально)

```javascript
const promClient = require('prom-client');

// Создание реестра метрик
const register = new promClient.Registry();

// Метрики по умолчанию
promClient.collectDefaultMetrics({ register });

// Кастомные метрики
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 5, 15, 50, 100, 500]
});

register.registerMetric(httpRequestDuration);

// Эндпоинт для метрик
app.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});
```

## Резервное копирование

### Конфигурация backup.sh

```bash
#!/bin/bash

# Настройки бэкапа
BACKUP_DIR="./backups"
RETENTION_DAYS=30
S3_BUCKET="your-backup-bucket"
NOTIFY_EMAIL="admin@example.com"

# Создание бэкапа
create_backup() {
    local DATE=$(date '+%Y%m%d_%H%M%S')
    local BACKUP_FILE="backup_$DATE.tar.gz"
    
    tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=logs \
        --exclude=backups \
        --exclude=.git \
        .
    
    echo "$BACKUP_FILE"
}

# Загрузка в S3 (опционально)
upload_to_s3() {
    local file=$1
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_DIR/$file" "s3://$S3_BUCKET/randomissue/"
    fi
}

# Очистка старых бэкапов
cleanup_old_backups() {
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
}
```

## Оптимизация производительности

### Node.js оптимизации

```bash
# Переменные окружения для production
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
export UV_THREADPOOL_SIZE=16

# Увеличение лимитов системы
ulimit -n 65536
```

### Кэширование

```javascript
// Redis для кэширования (опционально)
const redis = require('redis');
const client = redis.createClient();

// Кэш для заявок
const getCachedRequests = async () => {
    const cached = await client.get('requests');
    return cached ? JSON.parse(cached) : null;
};

const setCachedRequests = async (requests) => {
    await client.setex('requests', 300, JSON.stringify(requests)); // 5 минут
};
```
