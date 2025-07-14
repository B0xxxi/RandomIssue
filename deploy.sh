#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Скрипт для деплоя проекта
log "🚀 Начинаем деплой проекта RandomIssue..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    error "❌ Node.js не найден. Установите Node.js для продолжения."
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    error "❌ npm не найден. Установите npm для продолжения."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    error "❌ Требуется Node.js версии $REQUIRED_VERSION или выше. Текущая версия: $NODE_VERSION"
    exit 1
fi

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "❌ Файл package.json не найден. Убедитесь, что вы запускаете скрипт из корневой директории проекта."
    exit 1
fi

# Создаем резервную копию данных
if [ -f "requests.json" ]; then
    log "📋 Создаем резервную копию данных..."
    cp requests.json "requests.json.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || warning "Не удалось создать резервную копию"
fi

# Останавливаем предыдущий сервер на порту 3000
log "🛑 Останавливаем предыдущий сервер..."
if lsof -ti:3000 &> /dev/null; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    success "Сервер остановлен"
else
    log "Сервер уже остановлен"
fi

# Очищаем предыдущую сборку
log "🧹 Очищаем предыдущую сборку..."
npm run clean

# Устанавливаем зависимости
log "📦 Устанавливаем зависимости..."
if npm install --production=false; then
    success "Зависимости установлены"
else
    error "❌ Ошибка установки зависимостей"
    exit 1
fi

# Проверяем безопасность
log "🔒 Проверяем безопасность зависимостей..."
npm audit --audit-level=moderate || warning "Найдены уязвимости безопасности"

# Собираем проект
log "🔨 Собираем проект..."
if npm run build; then
    success "Проект собран успешно"
else
    error "❌ Ошибка сборки проекта"
    exit 1
fi

# Проверяем, что файлы собрались
if [ ! -f "dist/index.html" ]; then
    error "❌ Ошибка сборки: файл index.html не найден в dist/"
    exit 1
fi

if [ ! -f "dist/server.js" ]; then
    error "❌ Ошибка сборки: файл server.js не найден в dist/"
    exit 1
fi

# Устанавливаем переменные окружения для продакшена
log "🌍 Настраиваем переменные окружения..."
if [ -f ".env.example" ]; then
    cp .env.example .env.production
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env.production 2>/dev/null || true
fi

# Проверяем конфигурацию сервера
log "🔧 Проверяем конфигурацию сервера..."
cd dist
if node -c server.js; then
    success "Конфигурация сервера корректна"
else
    error "❌ Ошибка в конфигурации сервера"
    exit 1
fi
cd ..

# Запускаем сервер
log "🌐 Запускаем сервер..."
success "🎉 Деплой завершен успешно!"
success "📍 Проект доступен на http://localhost:3000"
success "🔍 Проверьте здоровье сервера: http://localhost:3000/health"
log "📝 Логи сервера:"
log "Для остановки нажмите Ctrl+C"

# Запускаем сервер в продакшн режиме
NODE_ENV=production npm start
