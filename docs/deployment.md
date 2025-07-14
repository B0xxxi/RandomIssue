# 🌐 Деплой

## Способы деплоя

### 1. Локальный деплой (рекомендуется)

Используйте улучшенный скрипт деплоя:

```bash
./deploy.sh
```

**Что происходит:**
- ✅ Проверка версии Node.js и npm
- ✅ Создание резервной копии данных
- ✅ Остановка предыдущего сервера
- ✅ Установка зависимостей
- ✅ Проверка безопасности (`npm audit`)
- ✅ Сборка проекта с оптимизацией
- ✅ Валидация конфигурации
- ✅ Запуск в продакшн режиме

### 2. Docker деплой

#### Простой запуск:
```bash
docker build -t randomissue .
docker run -p 3000:3000 randomissue
```

#### С docker-compose:
```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f
```

#### Docker с nginx (для продакшна):
```bash
# Запуск с nginx proxy
docker-compose --profile nginx up -d
```

### 3. PM2 деплой (для высокой нагрузки)

```bash
# Сборка проекта
npm run build

# Запуск с PM2
pm2 start ecosystem.config.json

# Мониторинг
pm2 monit

# Перезапуск
pm2 restart randomissue

# Остановка
pm2 stop randomissue

# Удаление
pm2 delete randomissue
```

### 4. Облачные платформы

#### Heroku

1. Создайте `Procfile`:
```bash
echo "web: npm start" > Procfile
```

2. Деплой:
```bash
heroku create your-app-name
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

3. Настройка переменных окружения:
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=\$PORT
```

#### Vercel

1. Создайте `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

2. Деплой:
```bash
npm i -g vercel
vercel --prod
```

#### Railway

1. Создайте `railway.json`:
```json
{
  "deploy": {
    "restartPolicyType": "always",
    "startCommand": "npm start"
  }
}
```

2. Деплой через Railway CLI или GitHub integration.

#### DigitalOcean App Platform

1. Создайте `.do/app.yaml`:
```yaml
name: randomissue
services:
- name: web
  source_dir: /
  github:
    repo: B0xxxi/RandomIssue
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
```

### 5. VPS деплой

#### С systemd:

1. Создайте service файл `/etc/systemd/system/randomissue.service`:
```ini
[Unit]
Description=RandomIssue App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/randomissue
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

2. Запуск:
```bash
sudo systemctl enable randomissue
sudo systemctl start randomissue
sudo systemctl status randomissue
```

#### С nginx reverse proxy:

1. Конфигурация nginx (`/etc/nginx/sites-available/randomissue`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
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
```

2. Активация:
```bash
sudo ln -s /etc/nginx/sites-available/randomissue /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Мониторинг после деплоя

### Health Check
```bash
# Проверка состояния сервера
curl http://localhost:3000/health

# Автоматический мониторинг
./monitor.sh
```

### Логирование
- **Development**: подробные логи в консоли
- **Production**: структурированные логи в файлы
- **PM2**: централизованное управление логами

### Метрики
Эндпоинт `/health` возвращает:
- Статус сервера
- Время работы (uptime)
- Использование памяти
- Версию Node.js
- Переменные окружения

## Резервное копирование

### Автоматическое резервное копирование:
```bash
# Создание бэкапа
./backup.sh

# Настройка cron для ежедневного бэкапа в 2:00
crontab -e
# Добавить строку:
0 2 * * * /path/to/project/backup.sh
```

## SSL/HTTPS

### С Let's Encrypt:
```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Оптимизация для продакшна

### 1. Настройка Node.js:
```bash
# Увеличение лимита файлов
ulimit -n 65536

# Настройка памяти
export NODE_OPTIONS="--max-old-space-size=2048"
```

### 2. Настройка PM2:
```bash
# Оптимизация для production
pm2 start ecosystem.config.json --env production

# Настройка мониторинга
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Nginx оптимизация:
```nginx
# Кэширование статики
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}

# Gzip сжатие
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```
