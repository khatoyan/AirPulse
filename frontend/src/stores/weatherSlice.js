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
    
    // Кэш для хранения результатов вычислений
    const state = get();
    const dispersionCache = state.dispersionCache || {};
    
    // Берем только одобренные отчеты для расчета
    const approvedReports = reports.filter(report => report.approved);
    
    if (approvedReports.length === 0) {
      console.log('Нет одобренных отчетов для генерации точек');
      set({ dispersedPoints: [] });
      return;
    }
    
    // Проверяем есть ли уже загруженные данные и нужно ли пересчитывать
    // Создаем хеш текущих параметров
    const hashParams = () => {
      const windParams = `${weatherData.windSpeed}_${weatherData.windDirection}`;
      const reportIds = approvedReports.map(r => r.id).sort().join('_');
      return `${windParams}_${reportIds.substring(0, 100)}`;
    };
    
    const currentParamsHash = hashParams();
    
    // Если уже есть кэшированный результат для этих параметров, используем его
    if (dispersionCache[currentParamsHash]) {
      console.log('Используем кэшированные точки распространения');
      set({ dispersedPoints: dispersionCache[currentParamsHash] });
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
        precipitation: weatherData.precipitation || 0,
        pressure: weatherData.pressure,
        description: weatherData.description,
      }
    );
    
    // Сохраняем результат в кэш и в состояние
    const newCache = { ...dispersionCache };
    
    // Ограничиваем размер кэша (максимум 5 разных состояний)
    const cacheKeys = Object.keys(newCache);
    if (cacheKeys.length >= 5) {
      // Удаляем самый старый ключ
      delete newCache[cacheKeys[0]];
    }
    
    // Добавляем новые данные в кэш
    newCache[currentParamsHash] = dispersedPoints;
    
    set({ 
      dispersedPoints,
      dispersionCache: newCache
    });
    
    console.log(`Сгенерировано и кэшировано ${dispersedPoints.length} точек`);
  }
});