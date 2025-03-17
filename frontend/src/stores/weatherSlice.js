import { calculatePollenDispersion } from '../utils/pollenDispersion';

// Слайс хранилища для погодных данных
export const createWeatherSlice = (set, get) => ({
  // Состояние
  weatherData: null,           // Данные о текущей погоде
  dispersedPoints: [],         // Точки распространения пыльцы
  updateHeatmap: 0,            // Триггер обновления тепловой карты
  
  // Установка данных о погоде
  setWeatherData: (data) => {
    console.log('Установка данных о погоде:', data);
    
    // Нормализуем данные о ветре
    const normalizedData = {
      ...data,
      windSpeed: data.windSpeed || data.wind_speed || 0,
      windDirection: data.windDirection || data.wind_deg || data.wind_direction || 0
    };
    
    // Проверяем наличие необходимых полей
    if (!normalizedData.windSpeed || typeof normalizedData.windDirection !== 'number') {
      console.error('Ошибка: некорректные данные о погоде', normalizedData);
      return;
    }
    
    set({ weatherData: normalizedData });
    
    // Если есть отчеты, генерируем точки распространения
    const { reports, timelineActive } = get();
    if (reports && reports.length > 0 && !timelineActive) {
      get().generateWindDispersionPoints(reports, normalizedData);
    }
  },
  
  // Генерация точек распространения пыльцы на основе данных о ветре
  generateWindDispersionPoints: (reports, weatherData) => {
    if (!reports || !weatherData) {
      console.log('Нет данных для генерации точек распространения');
      return;
    }
    
    console.log('Генерация точек распространения на основе данных о ветре');
    
    // Берем только одобренные отчеты для расчета
    const approvedReports = reports.filter(report => report.approved);
    
    if (approvedReports.length === 0) {
      console.log('Нет одобренных отчетов для генерации точек');
      set({ dispersedPoints: [] });
      return;
    }
    
    // Проверяем данные о ветре
    if (!weatherData.windSpeed || typeof weatherData.windDirection !== 'number') {
      console.error('Ошибка: некорректные данные о ветре', weatherData);
      return;
    }
    
    // Создаем новый массив точек распространения
    const dispersedPoints = calculatePollenDispersion(
      approvedReports,
      weatherData.windSpeed,
      weatherData.windDirection
    );
    
    console.log(`Сгенерировано ${dispersedPoints.length} точек распространения`);
    
    // Проверяем, активен ли режим прогноза
    const { timelineActive } = get();
    
    // Обновляем только если не активен режим прогноза
    if (!timelineActive) {
      set({ 
        dispersedPoints,
        updateHeatmap: Date.now() // Тригер обновления тепловой карты
      });
    }
  }
});