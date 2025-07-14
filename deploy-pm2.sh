#!/bin/bash

# Простой PM2 деплой для доступа из интернета
# Использование: ./deploy-pm2.sh [port]

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }
success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Получение порта из аргументов
PORT=${1:-3000}

log "🚀 PM2 деплой для доступа из интернета"
log "📡 Порт: $PORT"

# Проверка PM2
if ! command -v pm2 &> /dev/null; then
    log "📦 Установка PM2..."
    sudo npm install -g pm2
fi

# Остановка предыдущих процессов
log "🛑 Остановка предыдущих процессов..."
pm2 stop randomissue 2>/dev/null || true
pm2 delete randomissue 2>/dev/null || true

# Установка зависимостей и сборка
log "📦 Установка зависимостей..."
npm install

log "🔨 Сборка проекта..."
npm run build

# Настройка порта в ecosystem.config.json
log "⚙️ Настройка порта $PORT..."
if [ "$PORT" = "80" ]; then
    # Для порта 80 нужны права
    sudo setcap 'cap_net_bind_service=+ep' $(which node)
    warning "Запуск на порту 80. Приложение будет доступно напрямую."
fi

# Временное изменение порта в конфигурации
cp ecosystem.config.json ecosystem.config.json.backup
sed -i "s/\"PORT\": [0-9]*/\"PORT\": $PORT/" ecosystem.config.json

# Запуск с PM2
log "🔄 Запуск с PM2..."
pm2 start ecosystem.config.json --env production

# Автозапуск
log "⚡ Настройка автозапуска..."
pm2 startup | grep -E '^sudo' | bash 2>/dev/null || warning "Не удалось настроить автозапуск"
pm2 save

# Восстановление оригинального файла
mv ecosystem.config.json.backup ecosystem.config.json

# Настройка брандмауэра
log "🛡️ Настройка брандмауэра..."
if command -v ufw &> /dev/null; then
    sudo ufw allow $PORT
    sudo ufw allow ssh
    sudo ufw --force enable
    success "Брандмауэр настроен (порт $PORT открыт)"
else
    warning "UFW не найден. Откройте порт $PORT вручную"
fi

# Проверка работы
log "🔍 Проверка работы..."
sleep 3

if curl -f -s "http://localhost:$PORT/health" > /dev/null; then
    success "✅ Приложение работает на порту $PORT"
else
    error "❌ Приложение не отвечает на порту $PORT"
    exit 1
fi

# Получение внешнего IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")

# Финальная информация
success "🎉 Деплой завершен!"
success "📍 Приложение доступно на:"
success "   - Локально: http://localhost:$PORT"
if [ "$EXTERNAL_IP" != "unknown" ]; then
    success "   - Внешний IP: http://$EXTERNAL_IP:$PORT"
fi
success "🔍 Health check: http://localhost:$PORT/health"

log "📝 Полезные команды:"
echo "  pm2 logs randomissue     - Логи приложения"
echo "  pm2 monit                - Мониторинг"
echo "  pm2 restart randomissue  - Перезапуск"
echo "  pm2 stop randomissue     - Остановка"

if [ "$PORT" != "80" ]; then
    log "💡 Для доступа без указания порта установите Nginx:"
    echo "  sudo apt install nginx -y"
    echo "  # Затем настройте reverse proxy на порт $PORT"
fi

log "✅ Готово! Приложение доступно из интернета на порту $PORT"
