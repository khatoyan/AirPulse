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
    console.log('Используется API ключ:', config.openWeatherApiKey ? 'Установлен' : 'Не установлен');

    if (!config.openWeatherApiKey) {
      throw new Error('API ключ OpenWeather не настроен');
    }

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

    // Сохраняем данные в базу
    const { main, wind, weather } = response.data;
    await prisma.weatherData.create({
      data: {
        temperature: main.temp,
        humidity: main.humidity,
        windSpeed: wind.speed,
        windDeg: wind.deg
      }
    });

    // Возвращаем ответ в формате, совместимом с фронтендом
    res.json(response.data);
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

// Получить прогноз погоды на 24 часа
router.get('/forecast', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    console.log('Запрос прогноза погоды для координат:', { lat, lon });

    // Получаем данные от OpenWeather API
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        lat,
        lon,
        appid: config.openWeatherApiKey,
        units: 'metric',
        lang: 'ru',
        cnt: 24 // запрашиваем 24 временных точки
      }
    });

    // Преобразуем данные в нужный формат
    const forecastData = response.data.list.map((item: any) => {
      const dt = new Date(item.dt * 1000);
      const hours = dt.getHours();
      const hourLabel = `${hours}:00`;
      
      return {
        time: dt,
        timeLabel: hourLabel,
        hourLabel,
        temp: item.main.temp,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg
      };
    });

    res.json(forecastData);
  } catch (error) {
    console.error('Ошибка при получении прогноза погоды:', error);
    if (error instanceof AxiosError && error.response) {
      console.error('Ответ от OpenWeather с ошибкой:', error.response.data);
    }
    
    // Возвращаем мок-данные в случае ошибки
    const mockForecast = generateMockForecast();
    console.log('Возвращаем мок-данные прогноза:', mockForecast.length);
    res.json(mockForecast);
  }
});

// Генерация мок-данных прогноза погоды
function generateMockForecast() {
  console.log("Генерация тестовых данных прогноза погоды");
  
  const now = new Date();
  const forecast = [];
  
  // Генерируем данные на 24 часа вперед
  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hours = time.getHours();
    const hourLabel = `${hours}:00`;
    
    // Генерируем случайные погодные условия
    const temp = 15 + Math.sin(i / 6 * Math.PI) * 7 + (Math.random() * 3 - 1.5);
    const humidity = 60 + Math.sin(i / 12 * Math.PI) * 20 + (Math.random() * 10 - 5);
    const wind_speed = 2 + Math.sin(i / 8 * Math.PI) * 3 + (Math.random() * 2);
    const wind_deg = (i * 15 + Math.random() * 30) % 360;
    
    forecast.push({
      time,
      timeLabel: `${hours}:00`,
      hourLabel,
      temp: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity),
      wind_speed: Math.round(wind_speed * 10) / 10,
      wind_deg: Math.round(wind_deg)
    });
  }
  
  console.log(`Сгенерировано ${forecast.length} записей прогноза погоды`);
  return forecast;
}

export const weatherRouter = router; 