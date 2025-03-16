// Функция для расчета распространения пыльцы с учетом ветра
// Используется модифицированное гауссовское распределение для моделирования распространения пыльцы
export const calculatePollenDispersion = (reports, windSpeed, windDirection) => {
  // Константы для модели Гауссовского рассеивания
  const DISPERSION_COEFFICIENT_X = 0.2; // Горизонтальный коэффициент рассеивания
  const DISPERSION_COEFFICIENT_Y = 0.15; // Вертикальный коэффициент рассеивания (обычно меньше горизонтального)
  const MAX_DISTANCE = Math.min(5000 + (windSpeed * 500), 10000); // Максимальное расстояние распространения в метрах, увеличивается с силой ветра
  const WIND_INFLUENCE = 0.3; // Влияние ветра на распространение
  const STEP_SIZE = 200; // Шаг для создания точек (в метрах)

  // Преобразуем направление ветра из градусов в радианы (и меняем на противоположное, т.к. направление ветра - откуда дует)
  const windRad = ((windDirection + 180) % 360) * Math.PI / 180;

  // Фильтруем только отчеты с растениями, так как именно они являются источниками пыльцы
  const plantReports = reports.filter(report => report.type === 'plant');
  
  if (plantReports.length === 0) {
    console.log('Нет источников пыльцы (растений) для моделирования распространения');
    return [];
  }
  
  console.log(`Моделирование распространения пыльцы для ${plantReports.length} источников с учетом ветра ${windSpeed} м/с, направление ${windDirection}°`);

  const allDispersedPoints = plantReports.flatMap(report => {
    const dispersedPoints = [];
    const baseIntensity = report.severity;
    
    // Учитываем силу ветра в расчете максимальной дистанции
    const actualMaxDistance = MAX_DISTANCE * (0.5 + (windSpeed * 0.1));
    
    // Создаем точки распространения в направлении ветра
    for (let distance = STEP_SIZE; distance <= actualMaxDistance; distance += STEP_SIZE) {
      // Рассчитываем смещение по направлению ветра с учетом гауссовского распределения
      for (let angle = -Math.PI/4; angle <= Math.PI/4; angle += Math.PI/12) {  // Создаем конус рассеивания
        // Модификация угла с учетом основного направления ветра
        const modifiedAngle = windRad + angle * (1 - (windSpeed * 0.05));
        
        // Модификация расстояния для учета гауссовского распределения
        const spreadFactor = Math.exp(-(angle * angle) / 0.5);
        
        // Боковое отклонение увеличивается с расстоянием
        const lateralSpread = distance * Math.tan(angle) * (1 - WIND_INFLUENCE);
        
        // Рассчитываем смещение с учетом направления ветра
        const dx = (distance * Math.sin(modifiedAngle) * WIND_INFLUENCE * windSpeed) + lateralSpread * Math.cos(modifiedAngle + Math.PI/2);
        const dy = (distance * Math.cos(modifiedAngle) * WIND_INFLUENCE * windSpeed) + lateralSpread * Math.sin(modifiedAngle + Math.PI/2);

        // Рассчитываем новые координаты (преобразуем метры в градусы)
        const newLat = report.latitude + (dy / 111111); // 111111 метров = 1 градус широты
        const newLng = report.longitude + (dx / (111111 * Math.cos(report.latitude * Math.PI / 180)));

        // Рассчитываем интенсивность с учетом расстояния и угла (гауссовское распределение)
        // Интенсивность уменьшается с расстоянием и с отклонением от основного направления
        const intensity = baseIntensity * 
          Math.exp(-(distance * distance) / (2 * actualMaxDistance * DISPERSION_COEFFICIENT_X)) *
          spreadFactor;

        if (intensity > 0.5) { // Добавляем только значимые точки
          dispersedPoints.push({
            latitude: newLat,
            longitude: newLng,
            severity: intensity,
            // Копируем остальные свойства из исходного отчета
            type: report.type,
            plantType: report.plantType,
            description: `Рассчитанное распространение пыльцы от ${report.plantType || "растения"}`,
            createdAt: report.createdAt,
            // Помечаем как расчетную точку
            isCalculated: true,
            // Добавляем ссылку на исходный отчет
            sourceReportId: report.id,
            // Добавляем метку о расстоянии от источника
            distance: (distance / 1000).toFixed(2) // в км
          });
        }
      }
    }

    return dispersedPoints;
  });

  // Ограничиваем количество точек для производительности
  const MAX_POINTS = 1000;
  if (allDispersedPoints.length > MAX_POINTS) {
    console.log(`Ограничиваем количество точек распространения до ${MAX_POINTS} (из ${allDispersedPoints.length})`);
    // Сортируем по интенсивности и берем только самые интенсивные
    return allDispersedPoints
      .sort((a, b) => b.severity - a.severity)
      .slice(0, MAX_POINTS);
  }

  return allDispersedPoints;
};

// Функция для объединения перекрывающихся зон
export const mergeOverlappingZones = (points, radius = 100) => {
  const merged = [];
  const processed = new Set();

  points.forEach((point, i) => {
    if (processed.has(i)) return;

    let mergedPoint = { ...point };
    let overlapping = points.filter((p, j) => {
      if (i === j || processed.has(j)) return false;
      
      const distance = getDistance(point, p);
      return distance <= radius;
    });

    if (overlapping.length > 0) {
      // Усредняем координаты и суммируем severity
      const allPoints = [point, ...overlapping];
      mergedPoint.latitude = allPoints.reduce((sum, p) => sum + p.latitude, 0) / allPoints.length;
      mergedPoint.longitude = allPoints.reduce((sum, p) => sum + p.longitude, 0) / allPoints.length;
      mergedPoint.severity = Math.min(
        100,
        allPoints.reduce((sum, p) => sum + p.severity, 0) / allPoints.length
      );

      overlapping.forEach((_, j) => processed.add(j));
    }

    merged.push(mergedPoint);
  });

  return merged;
};

// Вспомогательная функция для расчета расстояния между точками
const getDistance = (point1, point2) => {
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