#!/bin/bash

# Скрипт для создания резервных копий
BACKUP_DIR="./backups"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="backup_$DATE.tar.gz"

# Создаем директорию для бэкапов
mkdir -p "$BACKUP_DIR"

echo "🔄 Создаем резервную копию..."

# Создаем архив с данными
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=logs \
    --exclude=backups \
    --exclude=.git \
    .

if [ $? -eq 0 ]; then
    echo "✅ Резервная копия создана: $BACKUP_DIR/$BACKUP_FILE"
    
    # Показываем размер бэкапа
    size=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "📦 Размер бэкапа: $size"
    
    # Удаляем старые бэкапы (оставляем только последние 5)
    ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +6 | xargs -r rm
    echo "🧹 Старые бэкапы очищены"
else
    echo "❌ Ошибка при создании резервной копии"
    exit 1
fi
