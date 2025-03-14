import axios from 'axios';

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const weatherService = {
  async getCurrentWeather(lat, lon) {
    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
          lang: 'ru'
        }
      });

      const { main, wind } = response.data;
      
      return {
        temp: Math.round(main.temp),
        humidity: main.humidity,
        wind_speed: wind.speed,
        wind_deg: wind.deg
      };
    } catch (error) {
      console.error('Ошибка при получении данных о погоде:', error);
      return null;
    }
  },

  // Функция для расчета распространения пыльцы с учетом ветра
  calculatePollenSpread(centerPoint, windData, intensity) {
    const { wind_speed, wind_deg } = windData;
    
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