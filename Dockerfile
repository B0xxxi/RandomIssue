# Multi-stage build для оптимизации размера образа
FROM node:18-alpine AS builder

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Сборка проекта
RUN npm run build

# Продакшен образ
FROM node:18-alpine AS production

# Установка рабочей директории
WORKDIR /app

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копирование собранного приложения
COPY --from=builder --chown=nextjs:nodejs /app/dist ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Создание директории для данных
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Переключение на пользователя без привилегий
USER nextjs

# Открытие порта
EXPOSE 3000

# Команда запуска
CMD ["node", "server.js"]
