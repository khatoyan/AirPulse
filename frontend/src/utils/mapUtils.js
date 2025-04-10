// Функция для нормализации интенсивности с усилением низких значений
export const normalizeIntensity = (intensity, maxIntensity = 10) => {
  // Применяем нелинейную функцию для усиления низких значений
  // Используем квадратный корень для более плавного увеличения низких значений
  const normalizedValue = Math.min(intensity / maxIntensity, 1);
  return Math.sqrt(normalizedValue); // Квадратный корень делает низкие значения более заметными
};

// Функция для определения радиуса точки на основе интенсивности
export const getPointRadius = (intensity) => {
  const baseRadius = 12;
  const minRadius = 8;
  
  if (!intensity || intensity < 1) return minRadius;
  
  return Math.min(baseRadius + (intensity / 10), 25);
};

// Функция для получения цвета в зависимости от интенсивности
export const getColorForSeverity = (severity) => {
  switch (severity) {
    case 1: return '#3388ff'; // синий
    case 2: return '#33ff88'; // зеленый
    case 3: return '#ffff33'; // желтый
    case 4: return '#ff8833'; // оранжевый
    case 5: return '#ff3333'; // красный
    default: return '#3388ff'; // по умолчанию синий
  }
};

// Функция для расчета актуальности точки на основе времени
export const calculatePointRelevance = (timestamp, maxAgeHours = 24) => {
  if (!timestamp) return 0.7; // Увеличиваем минимальное значение по умолчанию
  
  const pointDate = new Date(timestamp);
  const now = new Date();
  const ageHours = (now - pointDate) / (1000 * 60 * 60);
  
  // Если точка старше максимального возраста, она все равно имеет минимальную видимость
  if (ageHours > maxAgeHours) return 0.4;
  
  // Менее крутое экспоненциальное затухание для сохранения лучшей видимости старых точек
  return 0.4 + 0.6 * Math.exp(-ageHours / (maxAgeHours * 1.5));
};

// Функция для нормализации интенсивности с учетом времени
export const normalizeIntensityWithTime = (intensity, timestamp, maxAgeHours = 48) => { // Увеличил maxAgeHours до 48
  const relevance = calculatePointRelevance(timestamp, maxAgeHours);
  const normalizedIntensity = normalizeIntensity(intensity);
  // Добавляем минимальное значение для гарантии видимости
  return Math.max(0.3, normalizedIntensity * relevance);
}; 