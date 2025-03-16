import dotenv from 'dotenv';

dotenv.config();

// Проверка наличия критически важных переменных окружения
if (!process.env.JWT_SECRET) {
  console.error('КРИТИЧЕСКАЯ ОШИБКА: JWT_SECRET не определен в переменных окружения');
  console.error('Для безопасности приложения необходимо установить секретный ключ JWT');
  // В продакшн-режиме лучше завершить процесс приложения
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  // Используем случайную строку как запасной вариант только для разработки
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 
    require('crypto').randomBytes(64).toString('hex') : 
    (() => {
      console.error('JWT_SECRET не определен в продакшн-режиме!');
      process.exit(1);
    })()),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
};

// Вывод только в режиме разработки и без раскрытия самого секрета
if (process.env.NODE_ENV === 'development') {
  console.log('Конфигурация загружена. Режим разработки.');
  // Проверяем наличие всех необходимых переменных окружения
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'OPENWEATHER_API_KEY'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.warn(`Внимание: Следующие переменные окружения не определены: ${missingEnvVars.join(', ')}`);
  }
} 