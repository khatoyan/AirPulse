import { useState, useEffect } from 'react';
import axios from 'axios';

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: null,
    humidity: null,
    airQuality: null,
    windSpeed: null,
    windDirection: null
  });

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Координаты центра Новосибирска
        const lat = 55.0084;
        const lon = 82.9357;
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

        // Получаем данные о погоде через наш бэкенд
        const weatherResponse = await axios.get(`${API_URL}/weather/current`, {
          params: { lat, lon }
        });

        // Получаем данные о качестве воздуха через наш бэкенд
        const airQualityResponse = await axios.get(`${API_URL}/weather/air-quality`, {
          params: { lat, lon }
        });

        const weatherResult = weatherResponse.data;
        const airQualityResult = airQualityResponse.data;

        setWeatherData({
          temperature: Math.round(weatherResult.main.temp),
          humidity: weatherResult.main.humidity,
          windSpeed: weatherResult.wind.speed,
          windDirection: weatherResult.wind.deg,
          airQuality: getAirQualityDescription(airQualityResult.list[0].main.aqi)
        });
      } catch (error) {
        console.error('Ошибка при получении данных о погоде:', error);
      }
    };

    fetchWeatherData();
    // Обновляем данные каждые 30 минут
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getAirQualityDescription = (aqi) => {
    const descriptions = {
      1: 'Отличное',
      2: 'Хорошее',
      3: 'Умеренное',
      4: 'Плохое',
      5: 'Очень плохое'
    };
    return descriptions[aqi] || 'Нет данных';
  };

  return weatherData;
}; 