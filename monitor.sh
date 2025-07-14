#!/bin/bash

# Скрипт для мониторинга состояния сервера
HEALTH_URL="http://localhost:3000/health"
LOG_FILE="./logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Создаем директорию для логов
mkdir -p logs

# Функция для логирования
log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

# Проверка здоровья сервера
check_health() {
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        log "✅ Сервер работает нормально"
        return 0
    else
        log "❌ Сервер не отвечает"
        return 1
    fi
}

# Проверка использования памяти
check_memory() {
    local pid=$(pgrep -f "node.*server.js")
    if [ -n "$pid" ]; then
        local mem_usage=$(ps -p "$pid" -o pid,%mem,rss --no-headers)
        log "📊 Использование памяти: $mem_usage"
    else
        log "⚠️ Процесс сервера не найден"
    fi
}

# Проверка дискового пространства
check_disk() {
    local disk_usage=$(df -h . | tail -1 | awk '{print $5}')
    log "💾 Использование диска: $disk_usage"
}

# Проверка размера файла данных
check_data_size() {
    if [ -f "requests.json" ]; then
        local size=$(du -h requests.json | cut -f1)
        log "📄 Размер файла данных: $size"
    else
        log "📄 Файл данных не найден"
    fi
}

# Основная функция мониторинга
monitor() {
    log "🔍 Начинаем мониторинг сервера..."
    
    check_health
    check_memory
    check_disk
    check_data_size
    
    log "✅ Мониторинг завершен"
}

# Запуск мониторинга
monitor
