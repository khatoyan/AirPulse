import { create } from 'zustand';
import { weatherService } from '../services/api';
import { allergenTypes } from './mapConfig';
import { createTimelineSlice } from './timelineSlice';
import { createReportsSlice } from './reportsSlice';
import { createLocationSlice } from './locationSlice';
import { createWeatherSlice } from './weatherSlice';

/**
 * Хранилище данных карты и связанных состояний
 * Здесь хранятся данные о:
 * - отчетах о концентрации пыльцы
 * - погодных данных
 * - выбранных зонах на карте
 * - точках распространения пыльцы
 * - прогнозе погоды
 * - местоположении пользователя
 */
export const useMapStore = create((set, get) => ({
  // Список типов аллергенов
  allergenTypes,
  
  // Добавляем слайсы состояний из отдельных модулей
  ...createReportsSlice(set, get),
  ...createTimelineSlice(set, get),
  ...createLocationSlice(set, get),
  ...createWeatherSlice(set, get),
  
  // Загрузка прогноза погоды
  loadForecast: async (lat, lon) => {
    try {
      console.log('Загрузка прогноза погоды...');
      const data = await weatherService.getHourlyForecast(lat, lon);
      get().setForecastData(data);
    } catch (error) {
      console.error('Ошибка при загрузке прогноза погоды:', error);
    }
  },
  
  // Получить текущие координаты центра карты или координаты пользователя
  // или координаты по умолчанию
  getMapCoordinates: () => {
    const { userLocation } = get();
    
    // Если есть местоположение пользователя, используем его
    if (userLocation) {
      return userLocation;
    }
    
    // Иначе используем координаты Новосибирска по умолчанию
    return { lat: 55.0084, lng: 82.9357 };
  }
})); 