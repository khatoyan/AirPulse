import { useState, useEffect } from 'react';

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
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

        // Получаем данные о погоде
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const weatherResult = await weatherResponse.json();

        // Получаем данные о качестве воздуха
        const airQualityResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const airQualityResult = await airQualityResponse.json();

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