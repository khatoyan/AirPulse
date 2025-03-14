# AirPulse Frontend

Интерфейс приложения для мониторинга качества воздуха и аллергических рисков.

## Технологии

- React 18
- Vite
- Material UI 5
- Leaflet для карт
- Zustand для управления состоянием
- Axios для API запросов

## Установка и запуск

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Настройте переменные окружения:
   - Создайте файл `.env` и добавьте необходимые переменные:
     ```
     VITE_API_URL=http://localhost:3001/api
     VITE_OPENWEATHER_API_KEY=your_api_key
     ```

3. Запустите приложение в режиме разработки:
   ```bash
   npm run dev
   ```

4. Для сборки продакшн-версии:
   ```bash
   npm run build
   ```

## Основные возможности

- Интерактивная карта с отчетами о симптомах и растениях-аллергенах
- Тепловая карта распространения аллергенов на основе гауссовского распределения
- Создание и просмотр отчетов о симптомах
- Просмотр информации о растениях-аллергенах
- Просмотр текущих погодных условий
- Панель администратора для модерации контента

## Структура проекта

- `/src/components` - React компоненты
- `/src/services` - Сервисы для работы с API
- `/src/stores` - Хранилища состояния Zustand
- `/src/utils` - Вспомогательные функции
- `/src/hooks` - Пользовательские React хуки
- `/src/assets` - Статические ресурсы
