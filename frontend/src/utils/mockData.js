/**
 * Файл с моковыми данными для использования при проблемах с сервером
 */

// Центр карты для генерации моковых данных
const CENTER_LAT = 55.0084;
const CENTER_LNG = 82.9357;

// Функция для генерации случайных точек рассеивания вокруг центра
/* 
export const generateMockDispersionPoints = (count = 30) => {
  const points = [];
  
  for (let i = 0; i < count; i++) {
    // Генерируем случайное смещение от центра (до 5км)
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    
    // Генерируем случайную интенсивность (от 10 до 70)
    const severity = Math.round(10 + Math.random() * 60);
    
    // Типы растений для генерации
    const plantTypes = ['Береза', 'Ольха', 'Клен', 'Амброзия', 'Полынь', 'Лебеда'];
    const plantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    
    points.push({
      latitude: CENTER_LAT + latOffset,
      longitude: CENTER_LNG + lngOffset,
      severity,
      plantType,
      isCalculated: true
    });
  }
  
  return points;
};
*/

// Моковые данные о погоде
export const mockWeatherData = {
  temp: 22,
  humidity: 55,
  wind_speed: 3.2,
  wind_deg: 150,
  pressure: 1013,
  description: 'Переменная облачность',
  isMock: true // Флаг, указывающий, что это моковые данные
};

// Моковые отчеты о симптомах и растениях
/* 
export const mockReports = [
  {
    id: 'mock-1',
    type: 'symptom',
    symptom: 'Чихание',
    severity: 4,
    latitude: CENTER_LAT + 0.02,
    longitude: CENTER_LNG - 0.01,
    createdAt: new Date().toISOString(),
    description: 'Симптомы появились после прогулки в парке'
  },
  {
    id: 'mock-2',
    type: 'plant',
    plantType: 'Береза',
    severity: 5,
    latitude: CENTER_LAT - 0.01,
    longitude: CENTER_LNG + 0.02,
    createdAt: new Date().toISOString(),
    description: 'Большое дерево начало пылить'
  },
  {
    id: 'mock-3',
    type: 'symptom',
    symptom: 'Зуд в глазах',
    severity: 3,
    latitude: CENTER_LAT + 0.015,
    longitude: CENTER_LNG + 0.017,
    createdAt: new Date().toISOString(),
    description: 'Симптомы появляются ближе к вечеру'
  }
]; 
*/ 