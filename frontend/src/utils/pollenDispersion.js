// Функция для расчета распространения пыльцы с учетом ветра
export const calculatePollenDispersion = (reports, windSpeed, windDirection) => {
  // Константы для модели
  const DISPERSION_COEFFICIENT = 0.2; // Коэффициент рассеивания
  const MAX_DISTANCE = 5000; // Максимальное расстояние распространения в метрах
  const WIND_INFLUENCE = 0.3; // Влияние ветра на распространение

  // Преобразуем направление ветра из градусов в радианы
  const windRad = (windDirection * Math.PI) / 180;

  return reports.map(report => {
    const dispersedPoints = [];
    const baseIntensity = report.severity;

    // Создаем точки распространения в направлении ветра
    for (let distance = 100; distance <= MAX_DISTANCE; distance += 100) {
      // Рассчитываем смещение по направлению ветра
      const dx = distance * Math.sin(windRad) * WIND_INFLUENCE * windSpeed;
      const dy = distance * Math.cos(windRad) * WIND_INFLUENCE * windSpeed;

      // Рассчитываем новые координаты
      const newLat = report.latitude + (dy / 111111); // 111111 метров = 1 градус широты
      const newLng = report.longitude + (dx / (111111 * Math.cos(report.latitude * Math.PI / 180)));

      // Рассчитываем интенсивность с учетом расстояния (используем гауссовское распределение)
      const intensity = baseIntensity * Math.exp(
        -(distance * distance) / (2 * MAX_DISTANCE * DISPERSION_COEFFICIENT)
      );

      if (intensity > 1) { // Добавляем только значимые точки
        dispersedPoints.push({
          latitude: newLat,
          longitude: newLng,
          severity: intensity,
          // Копируем остальные свойства из исходного отчета
          type: report.type,
          plantType: report.plantType,
          description: report.description,
          createdAt: report.createdAt,
          // Помечаем как расчетную точку
          isCalculated: true
        });
      }
    }

    return dispersedPoints;
  }).flat();
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