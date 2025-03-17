// Функция для нормализации интенсивности
export const normalizeIntensity = (intensity, maxIntensity = 10) => {
  return Math.min(intensity / maxIntensity, 1);
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
  if (!timestamp) return 0;
  
  const pointDate = new Date(timestamp);
  const now = new Date();
  const ageHours = (now - pointDate) / (1000 * 60 * 60);
  
  // Если точка старше максимального возраста, она неактуальна
  if (ageHours > maxAgeHours) return 0;
  
  // Экспоненциальное затухание: чем старше точка, тем меньше её актуальность
  return Math.exp(-ageHours / maxAgeHours);
};

// Функция для нормализации интенсивности с учетом времени
export const normalizeIntensityWithTime = (intensity, timestamp, maxAgeHours = 24) => {
  const relevance = calculatePointRelevance(timestamp, maxAgeHours);
  return normalizeIntensity(intensity) * relevance;
}; 