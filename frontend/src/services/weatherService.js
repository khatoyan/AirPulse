import axios from 'axios';
import { mockWeatherData } from '../utils/mockData';
import { weatherService as backendWeatherService } from './api';

// API_URL для запросов к бэкенду
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  
  // Проверяем обязательные поля для объекта погоды
  const requiredFields = ['main', 'wind', 'weather'];
  return requiredFields.every(field => field in data);
};

// Генерация тестовых данных для прогноза на 24 часа
const generateMockForecast = () => {
  const forecast = [];
  const now = new Date();
  
  // Базовые метеоданные на текущий момент
  const baseTemp = 20 + Math.random() * 5 - 2.5;
  const baseHumidity = 65 + Math.random() * 20 - 10;
  const baseWindSpeed = 3 + Math.random() * 3;
  let baseWindDeg = 180 + Math.random() * 180;
  
  // Генерируем данные на 24 часа вперед с шагом 1 час
  for (let i = 0; i < 24; i++) {
    const hourTime = new Date(now);
    hourTime.setHours(now.getHours() + i);
    
    // Добавляем вариации к базовым значениям
    // Температура меняется в зависимости от времени суток
    const hourOfDay = hourTime.getHours();
    let tempVariation = 0;
    
    // Имитация суточного хода температуры
    if (hourOfDay >= 10 && hourOfDay <= 16) {
      // Дневное время - теплее
      tempVariation = 2 + Math.random() * 2;
    } else if (hourOfDay >= 0 && hourOfDay <= 6) {
      // Ночное время - холоднее
      tempVariation = -2 - Math.random() * 2;
    }
    
    // Постепенно меняем направление ветра
    baseWindDeg = (baseWindDeg + (Math.random() * 20 - 10)) % 360;
    if (baseWindDeg < 0) baseWindDeg += 360;
    
    // Форматирование времени для отображения
    const timeLabel = hourTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hourLabel = `${hourOfDay}:00`;
    
    forecast.push({
      temp: Math.round((baseTemp + tempVariation) * 10) / 10,
      humidity: Math.round(baseHumidity + Math.random() * 10 - 5),
      wind_speed: Math.round((baseWindSpeed + Math.random() - 0.5) * 10) / 10,
      wind_deg: Math.round(baseWindDeg),
      dt: Math.floor(hourTime.getTime() / 1000),
      timeLabel: timeLabel,
      hourLabel: hourLabel,
      hour: hourOfDay
    });
  }
  
  return forecast;
};

export const weatherService = {
  async getCurrentWeather(lat, lon) {
    try {
      // Используем бэкенд-сервис вместо прямого обращения к OpenWeather API
      const data = await backendWeatherService.getCurrentWeather(lat, lon);
      
      if (isValidWeatherData(data)) {
        return data;
      } else {
        console.error('Получены некорректные данные о погоде:', data);
        // В случае ошибки используем моковые данные
        return mockWeatherData;
      }
    } catch (error) {
      console.error('Ошибка при получении данных о погоде:', error);
      return mockWeatherData;
    }
  },

  async getForecast24h(lat, lon) {
    try {
      // Используем бэкенд-сервис вместо прямого обращения к OpenWeather API
      return await backendWeatherService.getHourlyForecast(lat, lon);
    } catch (error) {
      console.error('Ошибка при получении прогноза погоды:', error);
      // В случае ошибки генерируем моковые данные
      return this.generateMockForecast();
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