import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import axios, { AxiosError } from 'axios';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

// Получить текущие погодные данные
router.get('/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    console.log('Запрос погоды для координат:', { lat, lon });
    console.log('Используется API ключ:', config.openWeatherApiKey);

    // Получаем данные от OpenWeather API
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat,
        lon,
        appid: config.openWeatherApiKey,
        units: 'metric',
        lang: 'ru'
      }
    });

    console.log('Ответ от OpenWeather:', response.data);

    const { main, wind } = response.data;
    
    // Сохраняем данные в базу
    const weatherData = await prisma.weatherData.create({
      data: {
        temperature: main.temp,
        humidity: main.humidity,
        windSpeed: wind.speed,
        windDeg: wind.deg
      }
    });

    res.json(weatherData);
  } catch (error) {
    console.error('Подробная ошибка:', error);
    if (error instanceof AxiosError && error.response) {
      console.error('Ответ от OpenWeather с ошибкой:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Ошибка при получении погодных данных', 
      details: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    });
  }
});

// Получить последние погодные данные из базы
router.get('/latest', async (req, res) => {
  try {
    const weatherData = await prisma.weatherData.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении погодных данных' });
  }
});

export const weatherRouter = router; 