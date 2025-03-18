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
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airpulse',
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  // Используем случайную строку как запасной вариант только для разработки
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cors: {
    origin: [
      'http://localhost:4173',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://192.168.1.66:4173',
      'http://192.168.1.66:3000',
      'http://192.168.1.66:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean),
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