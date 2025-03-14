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

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Глобальная ошибка:', err);
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!', message: err.message });
});

app.listen(config.port, () => {
  console.log(`Сервер запущен на порту ${config.port}`);
}); 