import axios from 'axios';
import { mockWeatherData } from '../utils/mockData';

// Исправляем способ получения API ключа для Vite
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Функция для проверки, является ли объект HTML-страницей
const isHtmlResponse = (data) => {
  if (typeof data === 'string' && (data.trim().startsWith('<!doctype html>') || data.trim().startsWith('<html'))) {
    return true;
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 0) return false;
    
    // Проверка на HTML-содержимое в объекте
    const firstKey = keys[0];
    const firstValue = data[firstKey];
    if (typeof firstValue === 'string' && firstValue.includes('<!doctype html>')) {
      return true;
    }
  }
  
  return false;
};

// Функция для проверки корректности данных о погоде
const isValidWeatherData = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  // Проверка на наличие обязательных полей
  const requiredFields = ['temp', 'humidity', 'wind_speed', 'wind_deg'];
  const altRequiredFields = ['temperature', 'humidity', 'windSpeed', 'windDeg'];
  
  // Проверка по основным полям
  const hasRequiredFields = requiredFields.every(field => data[field] !== undefined);
  // Проверка по альтернативным именам полей
  const hasAltRequiredFields = altRequiredFields.every(field => data[field] !== undefined);
  
  return hasRequiredFields || hasAltRequiredFields;
};

export const weatherService = {
  async getCurrentWeather(lat, lon) {
    try {
      // Проверка наличия ключа API
      if (!API_KEY) {
        console.error('API ключ OpenWeather не найден. Проверьте файл .env');
        // Возвращаем моковые данные при отсутствии ключа
        console.log('Используем моковые данные о погоде (нет API ключа)');
        return mockWeatherData;
      }

      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
          lang: 'ru'
        }
      });
      
      // Проверка ответа на формат HTML-страницы
      if (isHtmlResponse(response.data)) {
        console.error('Получен HTML-ответ вместо JSON с данными о погоде');
        console.log('Используем моковые данные о погоде (некорректный формат ответа)');
        return mockWeatherData;
      }

      const { main, wind } = response.data;
      
      const weatherData = {
        temp: Math.round(main.temp),
        humidity: main.humidity,
        wind_speed: wind.speed,
        wind_deg: wind.deg
      };
      
      // Проверка данных на корректность
      if (!isValidWeatherData(weatherData)) {
        console.error('Получены некорректные данные о погоде:', weatherData);
        console.log('Используем моковые данные о погоде (некорректные данные)');
        return mockWeatherData;
      }
      
      return weatherData;
    } catch (error) {
      console.error('Ошибка при получении данных о погоде:', error);
      // Возвращаем моковые данные при ошибке
      console.log('Используем моковые данные о погоде (ошибка запроса)');
      return mockWeatherData;
    }
  },

  // Получение последних сохраненных данных о погоде
  async getLatestWeather() {
    try {
      // Здесь можно добавить запрос к бэкенду для получения последних данных
      // Пока используем моковые данные
      console.log('Используем моковые данные о погоде (getLatestWeather)');
      return mockWeatherData;
    } catch (error) {
      console.error('Ошибка при получении последних данных о погоде:', error);
      return null;
    }
  },

  // Функция для расчета распространения пыльцы с учетом ветра
  calculatePollenSpread(centerPoint, windData, intensity) {
    // Убедимся что windData имеет нужные поля
    if (!windData || !windData.wind_speed && !windData.windSpeed || 
        !windData.wind_deg && !windData.windDeg) {
      console.error('Некорректные данные о ветре для расчета распространения');
      return [];
    }
    
    const wind_speed = windData.wind_speed !== undefined ? windData.wind_speed : windData.windSpeed;
    const wind_deg = windData.wind_deg !== undefined ? windData.wind_deg : windData.windDeg;
    
    // Константы для модели распространения
    const MAX_DISTANCE = wind_speed * 1000; // Максимальное расстояние распространения в метрах
    const SPREAD_ANGLE = 30; // Угол распространения в градусах
    
    // Рассчитываем направление распространения
    const direction = wind_deg;
    
    // Создаем точки распространения с учетом гауссовского распределения
    const spreadPoints = [];
    const steps = 10;
    
    for (let i = 0; i < steps; i++) {
      const distance = (MAX_DISTANCE / steps) * (i + 1);
      const factor = Math.exp(-Math.pow(distance / MAX_DISTANCE, 2));
      
      // Добавляем точки в секторе распространения
      for (let angle = -SPREAD_ANGLE; angle <= SPREAD_ANGLE; angle += 5) {
        const actualAngle = direction + angle;
        const rad = actualAngle * Math.PI / 180;
        
        const point = {
          lat: centerPoint.lat + (distance * Math.cos(rad)) / 111000,
          lng: centerPoint.lng + (distance * Math.sin(rad)) / (111000 * Math.cos(centerPoint.lat * Math.PI / 180)),
          intensity: intensity * factor
        };
        
        spreadPoints.push(point);
      }
    }
    
    return spreadPoints;
  }
}; 