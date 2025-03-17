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

  // Получение прогноза погоды на 24 часа
  async getForecast24h(lat, lon) {
    try {
      // Проверка наличия ключа API
      if (!API_KEY) {
        console.error('API ключ OpenWeather не найден для прогноза. Используем моковые данные.');
        return generateMockForecast();
      }

      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
          lang: 'ru',
          cnt: 8 // Ограничиваем получение данных до 8 точек (покрывает примерно 24 часа)
        }
      });
      
      // Проверка ответа на формат HTML-страницы
      if (isHtmlResponse(response.data)) {
        console.error('Получен HTML-ответ вместо JSON с прогнозом погоды');
        return generateMockForecast();
      }

      // Проверка на правильность структуры ответа
      if (!response.data.list || !Array.isArray(response.data.list)) {
        console.error('Некорректная структура данных прогноза погоды');
        return generateMockForecast();
      }
      
      // Обрабатываем данные и форматируем их
      const forecastData = response.data.list.map(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        
        return {
          temp: Math.round(item.main.temp),
          humidity: item.main.humidity,
          wind_speed: item.wind.speed,
          wind_deg: item.wind.deg,
          dt: item.dt,
          timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hourLabel: `${hour}:00`,
          hour: hour
        };
      });
      
      // Если в результате API-запроса получено меньше 24 точек, дополняем данными
      if (forecastData.length < 24) {
        // Вычисляем, сколько точек нужно добавить
        const additionalPoints = 24 - forecastData.length;
        const lastPoint = forecastData[forecastData.length - 1];
        const lastDt = lastPoint ? lastPoint.dt : Math.floor(Date.now() / 1000);
        
        // Добавляем дополнительные точки с интервалом в 1 час
        for (let i = 1; i <= additionalPoints; i++) {
          const newDt = lastDt + (i * 3600); // +1 час в секундах
          const date = new Date(newDt * 1000);
          const hour = date.getHours();
          
          // Рассчитываем новые параметры на основе последней точки с небольшими вариациями
          const tempVar = Math.random() * 2 - 1; // ±1 градус
          const humidityVar = Math.round(Math.random() * 10 - 5); // ±5%
          const windSpeedVar = (Math.random() * 1 - 0.5).toFixed(1); // ±0.5 м/с
          const windDegVar = Math.round(Math.random() * 40 - 20); // ±20 градусов
          
          forecastData.push({
            temp: Math.round((lastPoint ? lastPoint.temp : 20) + tempVar),
            humidity: Math.min(100, Math.max(0, (lastPoint ? lastPoint.humidity : 70) + humidityVar)),
            wind_speed: Math.max(0, (lastPoint ? lastPoint.wind_speed : 3) + parseFloat(windSpeedVar)),
            wind_deg: (((lastPoint ? lastPoint.wind_deg : 180) + windDegVar) % 360 + 360) % 360,
            dt: newDt,
            timeLabel: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hourLabel: `${hour}:00`,
            hour: hour
          });
        }
      }
      
      // Возвращаем 24 точки прогноза
      return forecastData.slice(0, 24);
    } catch (error) {
      console.error('Ошибка при получении прогноза погоды:', error);
      // Генерируем моковые данные при ошибке
      return generateMockForecast();
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