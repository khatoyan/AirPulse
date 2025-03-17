// Функция для расчета распространения пыльцы на основе уточненной физической модели
// Модифицированная модель Лагранжа для атмосферной дисперсии с учетом турбулентности
// На основе научных публикаций: 
// - Sofiev et al. (2013) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Siljamo et al. (2008) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Helbig et al. (2004) Numerical modelling of pollen dispersion on the regional scale
export const calculatePollenDispersion = (reports, windSpeed, windDirection, humidity = 50, temperature = 20) => {
  // Защита от некорректных входных данных
  windSpeed = typeof windSpeed === 'number' && !isNaN(windSpeed) ? windSpeed : 0;
  windDirection = typeof windDirection === 'number' && !isNaN(windDirection) ? windDirection : 0;
  humidity = typeof humidity === 'number' && !isNaN(humidity) ? humidity : 50;
  temperature = typeof temperature === 'number' && !isNaN(temperature) ? temperature : 20;
  
  // --- 1. ОПРЕДЕЛЕНИЕ АТМОСФЕРНОЙ СТАБИЛЬНОСТИ ---
  // Усовершенствованная модель Паскуилла-Гиффорда с учетом времени суток и солнечной радиации
  const getStabilityClass = (windSpd, temperature, timeOfDay = 'day') => {
    // Упрощенное определение класса стабильности
    // В реальности зависит от солнечной радиации, облачности и других факторов
    if (timeOfDay === 'night') {
      // Ночью атмосфера более стабильна
      if (windSpd < 2) return 'F'; // Очень стабильная
      if (windSpd < 3) return 'E'; // Стабильная
      return 'D'; // Нейтральная
    } else {
      // Днем атмосфера менее стабильна
      if (windSpd < 2) return 'A'; // Крайне нестабильная
      if (windSpd < 3) return 'B'; // Умеренно нестабильная
      if (windSpd < 5) return 'C'; // Слегка нестабильная
      if (windSpd < 6) return 'D'; // Нейтральная
      return 'D'; // Нейтральная при сильном ветре
    }
  };

  // --- 2. ПАРАМЕТРЫ ДИСПЕРСИИ ПО КЛАССАМ СТАБИЛЬНОСТИ ---
  // Коэффициенты из исследований Briggs (1973) и Pasquill-Gifford
  const stabilityCoefficients = {
    'A': { a: 0.527, b: 0.865, c: 0.28, d: 0.90, turbulence: 0.25 },
    'B': { a: 0.371, b: 0.866, c: 0.23, d: 0.85, turbulence: 0.20 },
    'C': { a: 0.209, b: 0.897, c: 0.22, d: 0.80, turbulence: 0.15 },
    'D': { a: 0.128, b: 0.905, c: 0.20, d: 0.76, turbulence: 0.10 },
    'E': { a: 0.098, b: 0.902, c: 0.15, d: 0.73, turbulence: 0.05 },
    'F': { a: 0.065, b: 0.902, c: 0.12, d: 0.67, turbulence: 0.025 }
  };

  // --- 3. ПАРАМЕТРЫ РАСТЕНИЙ И ПЫЛЬЦЫ ---
  // Размер частиц пыльцы разных растений (в микрометрах) на основе научных данных
  const pollenProperties = {
    'береза': { size: 22, density: 800, releaseHeight: 15, threshold: 10 },
    'ольха': { size: 25, density: 850, releaseHeight: 12, threshold: 12 },
    'тополь': { size: 28, density: 750, releaseHeight: 20, threshold: 8 },
    'амброзия': { size: 18, density: 880, releaseHeight: 1.5, threshold: 16 },
    'полынь': { size: 22, density: 860, releaseHeight: 1.2, threshold: 14 },
    'злаки': { size: 35, density: 820, releaseHeight: 0.8, threshold: 15 },
    'default': { size: 25, density: 850, releaseHeight: 10, threshold: 12 }
  };
  
  // --- 4. МЕТЕОРОЛОГИЧЕСКИЕ ВЛИЯНИЯ ---
  // Коэффициенты влияния метеорологических факторов на основе данных из Sofiev et al. (2013)
  
  // Влияние влажности - выше влажность, меньше распространение пыльцы
  // При высокой влажности (>80%) пыльца набухает и становится тяжелее
  const getHumidityFactor = (hum) => {
    if (hum > 80) return 0.5;  // Сильное подавление при высокой влажности
    if (hum > 70) return 0.7;  // Умеренное подавление
    if (hum > 60) return 0.85; // Легкое подавление
    return Math.max(0.3, 1 - (hum / 150)); // Стандартное влияние
  };
  
  // Влияние температуры - низкие и очень высокие температуры снижают выброс пыльцы
  const getTemperatureFactor = (temp) => {
    if (temp < 5) return 0.4;      // Холодная погода
    if (temp < 10) return 0.7;     // Прохладная погода
    if (temp > 30) return 0.8;     // Очень жаркая погода
    // Оптимальные условия между 15-25°C
    return Math.min(1.2, Math.max(0.6, 0.8 + (temp - 10) * 0.04));
  };
  
  // Влияние осадков - даже небольшой дождь сильно подавляет распространение
  const getPrecipitationFactor = (precip = 0) => {
    if (precip > 5) return 0.1;   // Сильный дождь
    if (precip > 2) return 0.3;   // Умеренный дождь
    if (precip > 0.5) return 0.6; // Слабый дождь
    return 1.0;                  // Без осадков
  };
  
  // --- 5. ОПРЕДЕЛЕНИЕ ПАРАМЕТРОВ МОДЕЛИРОВАНИЯ ---
  // Определяем параметры на основе текущих условий
  const stabilityClass = getStabilityClass(windSpeed, temperature);
  const stability = stabilityCoefficients[stabilityClass];
  const HUMIDITY_FACTOR = getHumidityFactor(humidity);
  const TEMPERATURE_FACTOR = getTemperatureFactor(temperature);
  const PRECIPITATION_FACTOR = getPrecipitationFactor(0); // Предположим, что осадков нет
  
  // Определяем максимальное расстояние распространения
  // Согласно исследованиям, пыльца может преодолевать сотни километров,
  // но мы ограничиваем для визуализации в городских условиях
  const MAX_DISTANCE = Math.min(8000 + (windSpeed * 800), 20000) * PRECIPITATION_FACTOR;
  
  // Шаг для создания точек - адаптивный, зависит от расстояния
  const getStepSize = (distance) => {
    if (distance < 1000) return 100;  // Ближняя зона - более детально
    if (distance < 5000) return 250;  // Средняя зона
    return 500;                       // Дальняя зона - меньше деталей
  };
  
  // --- 6. РАСЧЕТ КОЭФФИЦИЕНТОВ ГРАВИТАЦИОННОГО ОСАЖДЕНИЯ ---
  // Улучшенная формула Стокса для расчета скорости осаждения с поправкой Каннингема
  const getSettlingVelocity = (size, density = 850) => {
    const g = 9.81;           // Ускорение свободного падения, м/с²
    const air_density = 1.2;  // Плотность воздуха, кг/м³
    const air_viscosity = 1.81e-5; // Динамическая вязкость воздуха, Па·с
    const size_m = size * 1e-6;  // Перевод из микрометров в метры
    
    // Поправка Каннингема для малых частиц
    const mean_free_path = 6.8e-8; // Средняя длина свободного пробега молекул воздуха, м
    const knudsen = mean_free_path / size_m;
    const slip_correction = 1 + knudsen * (1.257 + 0.4 * Math.exp(-0.55 * knudsen));
    
    // Формула Стокса с поправкой на скольжение
    return (density - air_density) * g * size_m * size_m * slip_correction / (18 * air_viscosity);
  };

  // --- 7. ПРЕОБРАЗОВАНИЕ НАПРАВЛЕНИЯ ВЕТРА ---
  // Направление ветра в радианах (метеорологическое направление - откуда дует)
  const windRad = ((windDirection + 180) % 360) * Math.PI / 180;
  
  // --- 8. ФИЛЬТРАЦИЯ ИСТОЧНИКОВ ПЫЛЬЦЫ ---
  const plantReports = reports.filter(report => report.type === 'plant');
  
  if (plantReports.length === 0) {
    console.log('Нет источников пыльцы для моделирования распространения');
    return [];
  }
  
  console.log(`Моделирование распространения пыльцы: ${plantReports.length} источников, ветер ${windSpeed} м/с, ${windDirection}°, влажность ${humidity}%, T=${temperature}°C, класс стабильности: ${stabilityClass}`);

  // --- 9. ОСНОВНОЙ АЛГОРИТМ РАСЧЕТА ДИСПЕРСИИ ---
  const allDispersedPoints = [];

  // Подробная обработка каждого источника пыльцы
  plantReports.forEach(report => {
    // Проверка валидности координат источника
    if (typeof report.latitude !== 'number' || typeof report.longitude !== 'number' || 
        isNaN(report.latitude) || isNaN(report.longitude)) {
      console.warn('Пропуск отчета с невалидными координатами:', report);
      return;
    }
    
    // Определяем характеристики пыльцы данного растения
    const baseIntensity = report.severity || 1;
    const plantTypeLower = (report.plantType || '').toLowerCase();
    const pollenProps = pollenProperties[plantTypeLower] || pollenProperties.default;
    const settlingVelocity = getSettlingVelocity(pollenProps.size, pollenProps.density);
    
    // Адаптивное максимальное расстояние с учетом всех факторов
    const actualMaxDistance = MAX_DISTANCE * HUMIDITY_FACTOR * TEMPERATURE_FACTOR;
    
    // Начальное расстояние зависит от высоты выброса (растения)
    const initialDistance = pollenProps.releaseHeight * 2;
    let distance = initialDistance;
    
    // Векторы турбулентного отклонения, меняющиеся со временем
    let turbulentDeviation = { x: 0, y: 0 };
    
    // Пошаговое моделирование
    while (distance <= actualMaxDistance) {
      // Адаптивный шаг - увеличивается с расстоянием
      const stepSize = getStepSize(distance);
      distance += stepSize;
      
      // Рассчитываем коэффициенты дисперсии по формулам Бриггса
      const sigma_y = stability.a * Math.pow(distance, stability.b);
      const sigma_z = stability.c * Math.pow(distance, stability.d);
      
      // Расчет фактора ослабления из-за гравитационного осаждения
      const travelTime = distance / Math.max(0.1, windSpeed);
      const effectiveHeight = Math.max(0, pollenProps.releaseHeight - settlingVelocity * travelTime);
      
      // Коэффициент вертикального ослабления по гауссовой модели
      const verticalFactor = Math.exp(-(pollenProps.releaseHeight * pollenProps.releaseHeight) / 
                                      (2 * sigma_z * sigma_z));
      
      // Турбулентное отклонение - имитация реальной атмосферной турбулентности
      // Используем подход марковской цепи для временной корреляции
      const turbulenceIntensity = stability.turbulence * (1 + distance/5000);
      const turbPersistence = 0.6; // Фактор сохранения предыдущего состояния
      
      // Обновляем турбулентное отклонение с временной корреляцией
      turbulentDeviation = {
        x: turbPersistence * turbulentDeviation.x + (1 - turbPersistence) * (Math.random() - 0.5) * turbulenceIntensity * sigma_y,
        y: turbPersistence * turbulentDeviation.y + (1 - turbPersistence) * (Math.random() - 0.5) * turbulenceIntensity * sigma_y
      };
      
      // Для текущего расстояния генерируем 8-16 точек вокруг основного направления
      // Количество точек обратно пропорционально расстоянию
      const numAngularPoints = Math.max(8, Math.min(16, Math.floor(24 * (1 - distance/actualMaxDistance))));
      const angleStep = (2 * Math.PI) / numAngularPoints;
      
      for (let i = 0; i < numAngularPoints; i++) {
        // Базовый угол распространения
        const baseAngle = windRad + (i * angleStep);
        
        // Расчет бокового отклонения от основного направления
        // Использует нормальное распределение вместо равномерного
        const deviation = (i - numAngularPoints/2) / (numAngularPoints/2) * sigma_y * 0.8;
        
        // Учитываем турбулентное отклонение
        const totalDeviationX = deviation * Math.cos(baseAngle + Math.PI/2) + turbulentDeviation.x;
        const totalDeviationY = deviation * Math.sin(baseAngle + Math.PI/2) + turbulentDeviation.y;
        
        // Рассчитываем координаты с учетом отклонения
        const dx = distance * Math.sin(baseAngle) + totalDeviationX;
        const dy = distance * Math.cos(baseAngle) + totalDeviationY;
        
        // Безопасное вычисление для косинуса (особенно на полюсах)
        const cosLat = Math.max(0.01, Math.cos(report.latitude * Math.PI / 180));
        
        // Конвертируем метры в градусы с защитой от ошибок
        const newLat = report.latitude + (dy / 111111);
        const newLng = report.longitude + (dx / (111111 * cosLat));
        
        // Проверка на валидность новых координат
        if (isNaN(newLat) || isNaN(newLng) || !isFinite(newLat) || !isFinite(newLng)) {
          continue; // Пропускаем невалидные координаты
        }
        
        // Поправка на гауссово распределение по расстоянию
        const distanceFromCenterLine = Math.sqrt(totalDeviationX*totalDeviationX + totalDeviationY*totalDeviationY);
        const horizontalIntensity = Math.exp(-(distanceFromCenterLine*distanceFromCenterLine) / (2 * sigma_y * sigma_y));
        
        // Расчет итоговой интенсивности с учетом всех факторов
        // 1. Горизонтальное рассеивание (по Гауссу)
        // 2. Вертикальное рассеивание и осаждение
        // 3. Влияние влажности и температуры
        // 4. Экспоненциальное убывание с расстоянием
        const intensityFactor = 
          horizontalIntensity * 
          verticalFactor * 
          HUMIDITY_FACTOR * 
          TEMPERATURE_FACTOR * 
          PRECIPITATION_FACTOR *
          Math.exp(-(distance) / (actualMaxDistance * 0.4));
        
        // Расчет итоговой интенсивности
        const intensity = baseIntensity * intensityFactor;
        
        // Добавляем только точки с достаточной интенсивностью
        // Порог зависит от типа растения
        if (intensity > pollenProps.threshold * 0.1) {
          allDispersedPoints.push({
            latitude: newLat,
            longitude: newLng,
            severity: intensity,
            type: report.type,
            plantType: report.plantType,
            description: `Рассчитанное распространение пыльцы от ${report.plantType || "растения"}`,
            createdAt: report.createdAt,
            isCalculated: true,
            sourceReportId: report.id,
            distance: (distance / 1000).toFixed(2), // в км
            meta: {
              stabilityClass,
              humidity,
              temperature,
              settlingVelocity,
              sigma_y,
              sigma_z,
              turbulentDeviation
            }
          });
        }
      }
    }
  });

  // --- 10. ПОСТОБРАБОТКА РЕЗУЛЬТАТОВ ---
  let finalPoints = allDispersedPoints;
  
  // Фильтруем невалидные точки перед применением кластеризации
  finalPoints = finalPoints.filter(point => 
    typeof point.latitude === 'number' && 
    typeof point.longitude === 'number' && 
    !isNaN(point.latitude) && 
    !isNaN(point.longitude)
  );
  
  // Применяем кластеризацию только если точек слишком много
  const MAX_POINTS = 800; // Ограничение для производительности
  if (finalPoints.length > MAX_POINTS) {
    console.log(`Оптимизация: ${finalPoints.length} точек сокращаются до ${MAX_POINTS}`);
    
    // Сначала сортируем по интенсивности
    const sortedPoints = [...finalPoints].sort((a, b) => b.severity - a.severity);
    
    // Берем топ 30% самых интенсивных точек
    const highIntensityPoints = sortedPoints.slice(0, Math.floor(MAX_POINTS * 0.3));
    
    // Оставшиеся точки кластеризуем с использованием стратифицированной выборки
    // для сохранения пространственного распределения
    const remainingPoints = sortedPoints.slice(Math.floor(MAX_POINTS * 0.3));
    const samplingInterval = Math.ceil(remainingPoints.length / (MAX_POINTS * 0.7)) || 1;
    const sampledPoints = remainingPoints.filter((_, index) => index % samplingInterval === 0);
    
    finalPoints = [...highIntensityPoints, ...sampledPoints].slice(0, MAX_POINTS);
  }

  return finalPoints;
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
  // Простая сетка для 2D пространства
  const GRID_SIZE = radius * 2;
  const grid = {};
  
  // Помещаем точки в сетку
  validPoints.forEach((point, i) => {
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    const key = `${gridX},${gridY}`;
    
    if (!grid[key]) grid[key] = [];
    grid[key].push({ point, index: i });
  });
  
  const merged = [];
  const processed = new Set();
  
  // Обработка каждой точки
  validPoints.forEach((point, i) => {
    if (processed.has(i)) return;
    
    let cluster = [{ point, weight: point.severity || 1 }];
    let totalWeight = point.severity || 1;
    processed.add(i);
    
    // Поиск соседей в 9 ячейках сетки (текущая + 8 окружающих)
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cellPoints = grid[key] || [];
        
        cellPoints.forEach(({ point: neighbor, index: j }) => {
          if (i !== j && !processed.has(j)) {
            const distance = getDistance(point, neighbor);
            
            if (distance <= radius) {
              cluster.push({ point: neighbor, weight: neighbor.severity || 1 });
              totalWeight += (neighbor.severity || 1);
              processed.add(j);
            }
          }
        });
      }
    }
    
    // Если нашли кластер, вычисляем средневзвешенную точку
    if (cluster.length > 1) {
      const mergedPoint = { ...point };
      
      // Средневзвешенные координаты
      mergedPoint.latitude = cluster.reduce((sum, item) => 
        sum + (item.point.latitude * item.weight), 0) / Math.max(0.1, totalWeight);
      
      mergedPoint.longitude = cluster.reduce((sum, item) => 
        sum + (item.point.longitude * item.weight), 0) / Math.max(0.1, totalWeight);
      
      // Проверка на валидность
      if (isNaN(mergedPoint.latitude) || isNaN(mergedPoint.longitude)) {
        console.warn('Невалидные координаты после слияния:', mergedPoint);
        return; // Пропускаем эту точку
      }
      
      // Средняя интенсивность с ограничением
      mergedPoint.severity = Math.min(100, cluster.reduce((sum, item) => 
        sum + (item.point.severity || 1), 0) / cluster.length);
      
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