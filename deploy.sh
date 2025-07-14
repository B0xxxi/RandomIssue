#!/bin/bash

# Скрипт для деплоя проекта
echo "🚀 Начинаем деплой проекта..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js для продолжения."
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Установите npm для продолжения."
    exit 1
fi

# Останавливаем предыдущий сервер на порту 3000
echo "🛑 Останавливаем предыдущий сервер..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Очищаем предыдущую сборку
echo "🧹 Очищаем предыдущую сборку..."
npm run clean

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Собираем проект
echo "🔨 Собираем проект..."
npm run build

# Проверяем, что файлы собрались
if [ ! -f "dist/index.html" ]; then
    echo "❌ Ошибка сборки: файл index.html не найден в dist/"
    exit 1
fi

# Запускаем сервер
echo "🌐 Запускаем сервер..."
echo "Проект будет доступен на http://localhost:3000"
echo "Для остановки нажмите Ctrl+C"
npm start
