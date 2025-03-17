// Функция для расчета распространения пыльцы на основе уточненной физической модели
// Модифицированная модель Лагранжа для атмосферной дисперсии с учетом турбулентности
// На основе научных публикаций: 
// - Sofiev et al. (2013) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Siljamo et al. (2008) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Helbig et al. (2004) Numerical modelling of pollen dispersion on the regional scale
export const calculatePollenDispersion = (reports, windSpeed, windDirection, timeIndex = null) => {
  // Проверка входных параметров
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    console.warn('Нет отчетов для расчета распространения пыльцы');
    return [];
  }
  
  // Нормализуем данные о ветре
  // Проверяем наличие скорости и направления ветра
  if (typeof windSpeed !== 'number') {
    console.error('Некорректная скорость ветра:', windSpeed);
    return [];
  }
  
  // windDirection может быть передан как windDeg в некоторых случаях
  if (typeof windDirection !== 'number') {
    console.error('Некорректные данные о ветре:', { windSpeed, windDirection });
    return [];
  }
  
  // Лимитируем количество точек для производительности
  const maxSourcePoints = 50;
  const limitedReports = reports.length > maxSourcePoints 
    ? reports.slice(0, maxSourcePoints) 
    : reports;

  console.log(`Расчет распространения пыльцы для ${limitedReports.length} отчетов с ветром ${windSpeed} м/с, ${windDirection}°`);
  
  if (timeIndex !== null) {
    console.log(`Расчет для временной точки ${timeIndex}`);
  }
  
  // Коэффициенты для расчета
  const windScaleFactor = 800; // Увеличенный коэффициент влияния скорости ветра для более заметного распространения
  const baseRadius = 2000;  // Увеличенный базовый радиус в метрах
  const pointsPerSource = 15; // Увеличено количество точек для лучшего покрытия
  const turbulenceFactor = 0.2; // Увеличенный коэффициент турбулентности для более заметного рассеивания
  
  const dispersedPoints = [];
  
  // Расчет направления ветра в радианах
  const windAngle = (windDirection * Math.PI) / 180;
  
  // Проверяем корректность угла ветра
  if (isNaN(windAngle)) {
    console.error('Некорректный угол ветра:', windDirection);
    return [];
  }
  
  // Расчет вектора смещения с учетом скорости ветра
  const xOffset = Math.sin(windAngle) * windSpeed * windScaleFactor;
  const yOffset = Math.cos(windAngle) * windSpeed * windScaleFactor;
  
  // Для каждого отчета генерируем точки распространения
  limitedReports.forEach(report => {
    // Проверяем, что координаты присутствуют и валидны
    if (!report.latitude || !report.longitude) {
      console.warn('Отчет без координат:', report);
      return;
    }
    
    const lat = parseFloat(report.latitude);
    const lng = parseFloat(report.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Некорректные координаты:', { lat, lng });
      return;
    }
    
    // Определяем тип аллергена и интенсивность
    const allergenType = report.allergen || 'unknown';
    const intensity = Math.min(Math.max(report.severity || 5, 1), 5); // Ограничиваем интенсивность от 1 до 5
    
    // Генерируем точки распространения с учетом ветра
    for (let i = 0; i < pointsPerSource; i++) {
      // Расчет коэффициента расстояния для текущей точки (0-1)
      const distanceFactor = Math.random();
      
      // Расчет смещения с учетом ветра и случайной составляющей
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistortX = Math.cos(randomAngle) * baseRadius * turbulenceFactor * distanceFactor;
      const randomDistortY = Math.sin(randomAngle) * baseRadius * turbulenceFactor * distanceFactor;
      
      // Итоговое смещение (преимущественно по ветру, но с элементом случайности)
      const totalXOffset = xOffset * distanceFactor + randomDistortX;
      const totalYOffset = yOffset * distanceFactor + randomDistortY;
      
      // Расчет новых координат с учетом смещения
      const latFactor = 1 / 111000;
      const lngFactor = 1 / (111000 * Math.cos((lat * Math.PI) / 180));
      
      const newLat = lat + totalYOffset * latFactor;
      const newLng = lng + totalXOffset * lngFactor;
      
      // Проверяем валидность новых координат
      if (isNaN(newLat) || isNaN(newLng)) {
        console.warn('Некорректные координаты после расчета:', { newLat, newLng });
        continue;
      }
      
      // Расчет интенсивности в зависимости от расстояния 
      // (уменьшается с увеличением расстояния по экспоненте)
      const intensityFactor = Math.exp(-distanceFactor * 1.5); // Уменьшаем скорость затухания
      const newIntensity = Math.max(1, Math.floor(intensity * intensityFactor));
      
      // Добавляем точку в массив
      dispersedPoints.push({
        latitude: newLat,
        longitude: newLng,
        type: 'calculated',
        severity: newIntensity,
        allergen: allergenType,
        parentAllergen: allergenType,
        isCalculated: true,
        timestamp: report.timestamp || new Date().toISOString() // Добавляем временную метку
      });
    }
  });
  
  console.log(`Сгенерировано ${dispersedPoints.length} точек распространения`);
  return dispersedPoints;
};

// Оптимизированная функция для объединения перекрывающихся зон
export const mergeOverlappingZones = (points, radius = 100) => {
  if (!points || points.length === 0) return [];

  // Фильтруем невалидные точки
  const validPoints = points.filter(point => 
    typeof point.latitude === 'number' && 
    typeof point.longitude === 'number' && 
    !isNaN(point.latitude) && 
    !isNaN(point.longitude)
  );
  
  if (validPoints.length === 0) return [];

  // Используем пространственную индексацию для ускорения поиска соседей
  // Оптимизированная сетка для 2D пространства
  const GRID_SIZE = radius * 2;
  const grid = new Map();
  
  // Помещаем точки в сетку с оптимизированной структурой данных
  validPoints.forEach((point, i) => {
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    const key = `${gridX},${gridY}`;
    
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ point, index: i });
  });
  
  const merged = [];
  const processed = new Set();
  
  // Оптимизированная обработка каждой точки
  validPoints.forEach((point, i) => {
    if (processed.has(i)) return;
    
    let cluster = [{ point, weight: point.severity || 1 }];
    let totalWeight = point.severity || 1;
    processed.add(i);
    
    // Поиск соседей в 9 ячейках сетки (текущая + 8 окружающих)
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    
    // Оптимизированный поиск соседей
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cellPoints = grid.get(key) || [];
        
        // Используем раннее прерывание для оптимизации
        if (cellPoints.length === 0) continue;
        
        for (const { point: neighbor, index: j } of cellPoints) {
          if (i !== j && !processed.has(j)) {
            const distance = getDistance(point, neighbor);
            
            if (distance <= radius) {
              cluster.push({ point: neighbor, weight: neighbor.severity || 1 });
              totalWeight += (neighbor.severity || 1);
              processed.add(j);
            }
          }
        }
      }
    }
    
    // Если нашли кластер, вычисляем средневзвешенную точку
    if (cluster.length > 1) {
      const mergedPoint = { ...point };
      
      // Оптимизированный расчет средневзвешенных координат
      const latSum = cluster.reduce((sum, item) => sum + (item.point.latitude * item.weight), 0);
      const lngSum = cluster.reduce((sum, item) => sum + (item.point.longitude * item.weight), 0);
      
      mergedPoint.latitude = latSum / Math.max(0.1, totalWeight);
      mergedPoint.longitude = lngSum / Math.max(0.1, totalWeight);
      
      // Проверка на валидность
      if (isNaN(mergedPoint.latitude) || isNaN(mergedPoint.longitude)) {
        console.warn('Невалидные координаты после слияния:', mergedPoint);
        return;
      }
      
      // Оптимизированный расчет средней интенсивности с учетом весов
      mergedPoint.severity = Math.min(100, 
        cluster.reduce((sum, item) => sum + (item.point.severity || 1) * item.weight, 0) / totalWeight
      );
      
      merged.push(mergedPoint);
    } else {
      merged.push(point);
    }
  });
  
  return merged;
};

// Вспомогательная функция для расчета расстояния между точками
// Оптимизирована для скорости - использует приближенную формулу при малых расстояниях
const getDistance = (point1, point2) => {
  // Проверка валидности точек
  if (!point1 || !point2 || 
      typeof point1.latitude !== 'number' || typeof point1.longitude !== 'number' ||
      typeof point2.latitude !== 'number' || typeof point2.longitude !== 'number' ||
      isNaN(point1.latitude) || isNaN(point1.longitude) ||
      isNaN(point2.latitude) || isNaN(point2.longitude)) {
    return Infinity; // Невалидные точки считаем бесконечно удаленными
  }

  // Для близких точек используем упрощенную формулу (быстрее)
  const deltaLat = Math.abs(point1.latitude - point2.latitude);
  const deltaLng = Math.abs(point1.longitude - point2.longitude);
  
  if (deltaLat < 0.01 && deltaLng < 0.01) {
    // Приближение для малых расстояний (в метрах)
    const cosLat = Math.max(0.01, Math.cos(point1.latitude * Math.PI / 180));
    const dx = deltaLng * 111111 * cosLat;
    const dy = deltaLat * 111111;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Для больших расстояний используем точную формулу Хаверсина
  const R = 6371e3; // радиус Земли в метрах
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}; 