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
    
    if (!data) {
      console.error('Ошибка: данные о погоде отсутствуют');
      return;
    }
    
    // Нормализуем данные о ветре
    const normalizedData = {
      ...data,
      windSpeed: data.windSpeed || data.wind_speed || 0,
      windDirection: data.windDirection || data.wind_deg || data.windDeg || 0
    };
    
    // Явно устанавливаем значения по умолчанию для ветра
    if (normalizedData.windSpeed === undefined || normalizedData.windSpeed === null) {
      console.warn('Отсутствует скорость ветра, устанавливаем 0');
      normalizedData.windSpeed = 0;
    }
    
    if (normalizedData.windDirection === undefined || normalizedData.windDirection === null) {
      console.warn('Отсутствует направление ветра, устанавливаем 0');
      normalizedData.windDirection = 0;
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
    
    // Используем нормализованные данные или значения по умолчанию
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0;
    const windDirection = typeof weatherData.windDirection === 'number' ? weatherData.windDirection : 0;
    
    // Создаем новый массив точек распространения с учетом всех погодных факторов
    const dispersedPoints = calculatePollenDispersion(
      approvedReports,
      windSpeed,
      windDirection,
      null, // timeIndex не используется для текущих данных
      {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        precipitation: weatherData.precipitation || 0, // Добавляем 0, если нет данных об осадках
        // Другие погодные данные, если они доступны
        pressure: weatherData.pressure,
        description: weatherData.description,
      }
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