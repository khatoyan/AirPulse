import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  jwtSecret: process.env.JWT_SECRET || 'airpulse-secret-key',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};

// Отладочная информация
console.log('JWT SECRET:', config.jwtSecret);
console.log('JWT SECRET вид:', typeof config.jwtSecret); 