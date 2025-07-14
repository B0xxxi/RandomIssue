# 🔍 Мониторинг и устранение неполадок

## Мониторинг сервера

### Автоматический мониторинг

```bash
# Запуск скрипта мониторинга
./monitor.sh

# Добавление в cron для регулярной проверки
crontab -e
# Добавить строку для проверки каждые 5 минут:
*/5 * * * * /path/to/project/monitor.sh
```

### Health Check

```bash
# Проверка состояния сервера
curl http://localhost:3000/health

# Проверка с детальной информацией
curl -s http://localhost:3000/health | jq .

# Проверка доступности API
curl -s http://localhost:3000/api/requests | jq length
```

### Метрики производительности

#### Использование памяти
```bash
# Проверка использования памяти процессом Node.js
ps aux | grep node

# Подробная информация о памяти
cat /proc/$(pgrep -f "node.*server.js")/status | grep -i mem
```

#### Использование CPU
```bash
# Мониторинг CPU в реальном времени
top -p $(pgrep -f "node.*server.js")

# Статистика CPU
mpstat 1 5
```

#### Дисковое пространство
```bash
# Проверка свободного места
df -h

# Размер директории проекта
du -sh /path/to/project

# Размер логов
du -sh logs/
```

## Логирование

### Просмотр логов

```bash
# Логи приложения
tail -f logs/app.log

# Логи ошибок
tail -f logs/error.log

# Логи HTTP запросов
tail -f logs/access.log

# Поиск в логах
grep -i "error" logs/app.log
grep -E "5[0-9]{2}" logs/access.log  # HTTP 5xx ошибки
```

### PM2 логи

```bash
# Все логи
pm2 logs

# Логи конкретного приложения
pm2 logs randomissue

# Логи ошибок
pm2 logs randomissue --err

# Очистка логов
pm2 flush
```

### Анализ логов

```bash
# Топ IP адресов
awk '{print $1}' logs/access.log | sort | uniq -c | sort -nr | head -10

# Топ запросов
awk '{print $7}' logs/access.log | sort | uniq -c | sort -nr | head -10

# Ошибки по времени
grep "$(date '+%Y-%m-%d')" logs/error.log | wc -l

# Медленные запросы (>1000ms)
awk '$NF > 1000' logs/access.log
```

## Диагностика проблем

### Сервер не запускается

#### Проверка порта
```bash
# Проверка, не занят ли порт
lsof -i :3000

# Принудительное освобождение порта
kill -9 $(lsof -ti:3000)
```

#### Проверка зависимостей
```bash
# Проверка установки зависимостей
npm list --depth=0

# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

#### Проверка конфигурации
```bash
# Проверка синтаксиса
node -c server.js

# Проверка переменных окружения
printenv | grep -E "(NODE_ENV|PORT)"

# Проверка прав доступа
ls -la server.js
```

### Медленная работа

#### Профилирование Node.js
```bash
# Запуск с профилированием
node --prof server.js

# Анализ профиля
node --prof-process isolate-*.log > profile.txt
```

#### Мониторинг производительности
```bash
# Установка clinic.js
npm install -g clinic

# Диагностика производительности
clinic doctor -- node server.js
```

#### Проверка базы данных
```bash
# Размер файла данных
ls -lh requests.json

# Проверка структуры данных
jq length requests.json
jq 'map(length)' requests.json
```

### Ошибки 500

#### Проверка логов ошибок
```bash
# Последние ошибки
tail -20 logs/error.log

# Ошибки за сегодня
grep "$(date '+%Y-%m-%d')" logs/error.log
```

#### Проверка файла данных
```bash
# Проверка корректности JSON
jq . requests.json > /dev/null && echo "JSON валиден" || echo "JSON поврежден"

# Восстановление из бэкапа
cp backups/backup_latest.tar.gz ./
tar -xzf backup_latest.tar.gz
```

### Проблемы с памятью

#### Утечки памяти
```bash
# Мониторинг использования памяти
watch -n 5 'ps aux | grep node'

# Детальная информация о памяти
node --expose-gc --inspect server.js
```

#### Оптимизация памяти
```bash
# Увеличение лимита памяти
export NODE_OPTIONS="--max-old-space-size=2048"

# Принудительная сборка мусора
kill -USR1 $(pgrep -f "node.*server.js")
```

### Проблемы с сетью

#### Проверка подключения
```bash
# Проверка локального подключения
curl -I http://localhost:3000

# Проверка внешнего подключения
curl -I http://your-domain.com

# Проверка DNS
nslookup your-domain.com
```

#### Проверка брандмауэра
```bash
# Проверка правил iptables
sudo iptables -L

# Проверка UFW
sudo ufw status

# Проверка открытых портов
netstat -tlnp | grep :3000
```

## Алерты и уведомления

### Настройка email уведомлений

```bash
# Установка mailutils
sudo apt install mailutils

# Скрипт для отправки уведомлений
#!/bin/bash
EMAIL="admin@example.com"
SUBJECT="RandomIssue Alert"

send_alert() {
    echo "$1" | mail -s "$SUBJECT" "$EMAIL"
}

# Проверка и отправка алерта
if ! curl -f -s http://localhost:3000/health > /dev/null; then
    send_alert "Server is down!"
fi
```

### Slack уведомления

```bash
# Webhook URL для Slack
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_slack_alert() {
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"'"$1"'"}' \
        "$SLACK_WEBHOOK"
}

# Отправка уведомления
send_slack_alert "RandomIssue server is down!"
```

### Telegram уведомления

```bash
# Telegram Bot API
BOT_TOKEN="YOUR_BOT_TOKEN"
CHAT_ID="YOUR_CHAT_ID"

send_telegram_alert() {
    curl -s -X POST \
        "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d text="$1"
}

# Отправка уведомления
send_telegram_alert "RandomIssue server is down!"
```

## Инструменты мониторинга

### Prometheus + Grafana

#### Prometheus конфигурация
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'randomissue'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

#### Grafana дашборд
```json
{
  "dashboard": {
    "title": "RandomIssue Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{handler}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

### Uptime Robot

```bash
# Настройка мониторинга через API
curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -H "Cache-Control: no-cache" \
    -d "api_key=YOUR_API_KEY&format=json&type=1&url=http://your-domain.com&friendly_name=RandomIssue"
```

## Резервное копирование и восстановление

### Автоматическое резервное копирование

```bash
# Скрипт для автоматического бэкапа
#!/bin/bash
BACKUP_DIR="/var/backups/randomissue"
DATE=$(date '+%Y%m%d_%H%M%S')

# Создание бэкапа
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=logs \
    .

# Загрузка в облако
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" s3://your-bucket/randomissue/

# Очистка старых бэкапов
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
```

### Восстановление из бэкапа

```bash
# Остановка сервера
pm2 stop randomissue

# Создание резервной копии текущего состояния
cp -r /var/www/randomissue /var/www/randomissue.backup

# Восстановление из бэкапа
cd /var/www/randomissue
tar -xzf /var/backups/randomissue/backup_latest.tar.gz

# Восстановление зависимостей
npm install

# Запуск сервера
pm2 start randomissue
```

## Производительность

### Нагрузочное тестирование

```bash
# Установка Apache Bench
sudo apt install apache2-utils

# Тест производительности
ab -n 1000 -c 10 http://localhost:3000/

# Тест API
ab -n 1000 -c 10 -H "Content-Type: application/json" -p post_data.json http://localhost:3000/api/requests
```

### Оптимизация

#### Кэширование
```javascript
// Добавление кэша в память
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 минут

app.get('/api/requests', (req, res) => {
    const cacheKey = 'requests';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        return res.json(cachedData);
    }
    
    const requests = readRequests();
    cache.set(cacheKey, requests);
    res.json(requests);
});
```

#### Компрессия
```javascript
// Настройка компрессии
const compression = require('compression');

app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        return compression.filter(req, res);
    }
}));
```

### Масштабирование

#### Горизонтальное масштабирование
```bash
# Запуск нескольких инстансов с PM2
pm2 start ecosystem.config.json -i max

# Настройка load balancer (nginx)
upstream randomissue {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

#### Вертикальное масштабирование
```bash
# Увеличение ресурсов
export NODE_OPTIONS="--max-old-space-size=4096"

# Настройка системных лимитов
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

## Безопасность

### Мониторинг безопасности

```bash
# Проверка неудачных попыток входа
grep "failed" /var/log/auth.log

# Проверка подозрительных запросов
grep -E "(SELECT|UNION|DROP|DELETE)" logs/access.log

# Мониторинг rate limiting
grep "Too many requests" logs/app.log
```

### Обновление безопасности

```bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix

# Обновление зависимостей
npm update

# Проверка устаревших пакетов
npm outdated
```
