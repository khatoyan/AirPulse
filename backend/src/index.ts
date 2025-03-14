import express from 'express';
import cors from 'cors';
import { config } from './config';
import { reportsRouter } from './routes/reports';
import { zonesRouter } from './routes/zones';
import { weatherRouter } from './routes/weather';
import { plantsRouter } from './routes/plants';
import { authRouter } from './routes/auth';
import { requestLogger } from './middleware/logging';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/reports', reportsRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/plants', plantsRouter);
app.use('/api/auth', authRouter);

// Базовый маршрут для проверки работы API
app.get('/api', (req, res) => {
  res.json({ message: 'AirPulse API работает!' });
});

// Кастомный интерфейс для ошибок с кодом статуса
interface CustomError extends Error {
  status?: number;
  code?: string;
}

// Расширенная обработка ошибок
app.use((err: CustomError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Глобальная ошибка:', err);
  console.error(err.stack);
  
  // Определение статуса ошибки (по умолчанию 500)
  const statusCode = err.status || 500;
  
  // Формирование ответа
  const errorResponse: Record<string, any> = {
    error: true,
    message: err.message || 'Что-то пошло не так!',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    path: req.path,
    timestamp: new Date().toISOString()
  };
  
  // В режиме разработки добавляем стек ошибки
  if (process.env.NODE_ENV !== 'production') {
    errorResponse['stack'] = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
});

app.listen(config.port, () => {
  console.log(`Сервер запущен на порту ${config.port}`);
}); 