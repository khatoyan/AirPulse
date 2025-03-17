import { calculatePollenDispersion } from '../utils/pollenDispersion';

// Слайс хранилища для работы с временной шкалой и прогнозом
export const createTimelineSlice = (set, get) => ({
  // Состояние
  forecastData: [],            // Массив прогнозов погоды на 24 часа
  selectedTimeIndex: 0,        // Индекс выбранного времени
  timelineActive: false,       // Флаг активности временной шкалы
  timeDispersionPoints: [],    // Точки распространения для выбранного времени
  
  // Устанавливаем данные прогноза
  setForecastData: (data) => {
    if (!data || !Array.isArray(data)) {
      console.error('Ошибка при установке данных прогноза: данные отсутствуют или имеют неверный формат', data);
      return;
    }
    
    if (data.length === 0) {
      console.warn('Установка пустого массива данных прогноза');
      set({ forecastData: [] });
      return;
    }
    
    console.log(`Установка данных прогноза: ${data.length} временных точек`);
    console.log('Пример данных прогноза:', data[0]);
    
    // Нормализуем формат данных, если необходимо
    const normalizedData = data.map(item => ({
      ...item,
      wind_speed: item.wind_speed || 0,
      wind_deg: item.wind_deg || 0,
      hourLabel: item.hourLabel || 'N/A',
      timeLabel: item.timeLabel || 'N/A',
      temp: item.temp || 0,
      humidity: item.humidity || 0
    }));
    
    set({ forecastData: normalizedData });
    
    // Если есть прогноз и отчеты, сразу генерируем временные точки для текущего времени
    if (normalizedData.length > 0 && get().reports && get().reports.length > 0) {
      // Устанавливаем индекс в 0 при загрузке новых данных
      set({ selectedTimeIndex: 0 });
      get().generateTimeDispersionPoints(get().reports, normalizedData[0], 0);
    }
  },
  
  // Выбор временной точки на ползунке
  setSelectedTimeIndex: (indexOrUpdater) => {
    const { forecastData } = get();
    
    if (!forecastData || forecastData.length === 0) {
      console.warn('Попытка установить индекс времени без данных прогноза');
      return;
    }

    let newIndex;
    
    // Проверяем, это число или функция
    if (typeof indexOrUpdater === 'function') {
      // Если функция, вызываем ее с текущим индексом
      const currentIndex = get().selectedTimeIndex;
      newIndex = indexOrUpdater(currentIndex);
    } else {
      // Иначе используем напрямую как индекс
      newIndex = indexOrUpdater;
    }
    
    if (newIndex >= 0 && newIndex < forecastData.length) {
      console.log(`Установка индекса времени: ${newIndex} (${forecastData[newIndex]?.hourLabel || 'N/A'})`);
      set({ selectedTimeIndex: newIndex });
      
      // Обновляем точки распространения для выбранного времени
      const { reports } = get();
      if (reports && reports.length > 0 && forecastData.length > 0) {
        get().generateTimeDispersionPoints(reports, forecastData[newIndex], newIndex);
      }
    } else {
      console.error(`Невалидный индекс времени: ${newIndex}. Доступно ${forecastData.length} точек.`);
    }
  },
  
  // Включение/выключение временной шкалы
  toggleTimeline: (active) => {
    const newState = active !== undefined ? active : !get().timelineActive;
    console.log(`Переключение шкалы времени: ${newState ? 'включена' : 'выключена'}`);
    set({ timelineActive: newState });
    
    if (newState) {
      if (!get().forecastData || get().forecastData.length === 0) {
        // Если включаем шкалу, а прогноза нет, нужно его загрузить
        console.log('Временная шкала активирована, но нет прогноза. Загружаем...');
        const coords = get().getMapCoordinates();
        if (coords && coords.lat && coords.lng) {
          get().loadForecast(coords.lat, coords.lng);
        } else {
          console.error('Не удалось получить координаты карты для загрузки прогноза');
        }
      } else {
        // Если прогноз уже есть, генерируем точки для текущего времени
        const { reports, selectedTimeIndex, forecastData } = get();
        if (reports && reports.length > 0 && forecastData && forecastData.length > 0) {
          get().generateTimeDispersionPoints(reports, forecastData[selectedTimeIndex], selectedTimeIndex);
        }
      }
    } else {
      // Если выключаем шкалу, возвращаемся к обычному отображению данных о ветре
      const { reports, weatherData } = get();
      if (reports && weatherData) {
        get().generateWindDispersionPoints(reports, weatherData);
      }
    }
  },
  
  // Генерация точек распространения пыльцы на основе прогноза погоды для выбранного времени
  generateTimeDispersionPoints: (reports, weatherData, timeIndex) => {
    if (!reports || !weatherData) {
      console.log('Нет данных для генерации временных точек распространения');
      set({ timeDispersionPoints: [] });
      return;
    }
    
    console.log(`Генерация точек распространения для времени: ${weatherData.timeLabel || 'N/A'}`);
    console.log('Данные о погоде:', weatherData);
    
    // Берем только одобренные отчеты
    const approvedReports = reports.filter(report => report.approved);
    
    if (approvedReports.length === 0) {
      console.log('Нет одобренных отчетов для генерации точек');
      set({ timeDispersionPoints: [] });
      return;
    }
    
    // Проверяем наличие данных о скорости ветра
    if (typeof weatherData.wind_speed !== 'number') {
      console.error('Некорректные данные о скорости ветра в прогнозе:', weatherData);
      set({ timeDispersionPoints: [] });
      return;
    }
    
    // Проверяем наличие данных о направлении ветра (может быть в wind_deg или в wind_direction)
    const windDirection = 
      typeof weatherData.wind_deg === 'number' ? weatherData.wind_deg : 
      typeof weatherData.wind_direction === 'number' ? weatherData.wind_direction : undefined;
    
    if (typeof windDirection !== 'number') {
      console.error('Некорректные данные о направлении ветра в прогнозе:', weatherData);
      set({ timeDispersionPoints: [] });
      return;
    }
    
    // Создаем новый массив точек распространения на основе прогноза ветра
    const dispersedPoints = calculatePollenDispersion(
      approvedReports,
      weatherData.wind_speed,
      windDirection,
      timeIndex // передаем индекс времени для отладки
    );
    
    console.log(`Сгенерировано ${dispersedPoints.length} точек распространения для прогноза времени`);
    
    // Сохраняем оригинальные точки, чтобы не терять тепловые метки
    const { dispersedPoints: currentPoints } = get();
    
    // Обновляем состояние
    set({ 
      timeDispersionPoints: dispersedPoints,
      // Сохраняем существующие точки и добавляем новые для прогноза
      // Не заменяем полностью dispersedPoints
      updateHeatmap: Date.now() // Тригер обновления тепловой карты
    });
  },
  
  // Функция загрузки прогноза погоды
  loadForecast: async (lat, lng) => {
    try {
      console.log(`Загрузка прогноза погоды для координат: ${lat}, ${lng}`);
      
      // Проверяем координаты
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error('Невалидные координаты для загрузки прогноза:', { lat, lng });
        return;
      }
      
      // Отправляем запрос на загрузку прогноза через API-сервис
      // Примечание: эта функция должна быть реализована в соответствующем сервисе
      const apiService = get().getApiService();
      if (!apiService || !apiService.weather || !apiService.weather.getForecast) {
        console.error('API-сервис для прогноза погоды недоступен');
        return;
      }
      
      const forecastData = await apiService.weather.getForecast(lat, lng);
      
      if (!forecastData || !Array.isArray(forecastData)) {
        console.error('Получены некорректные данные прогноза:', forecastData);
        return;
      }
      
      console.log(`Получен прогноз на ${forecastData.length} часов`);
      get().setForecastData(forecastData);
    } catch (error) {
      console.error('Ошибка при загрузке прогноза погоды:', error);
    }
  }
}); 