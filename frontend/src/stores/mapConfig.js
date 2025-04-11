// Конфигурация и константы для карты и аллергенов

// Список типов аллергенов
export const allergenTypes = [
  { id: 'берёза', name: 'Берёза', icon: '🌳' },
  { id: 'амброзия', name: 'Амброзия', icon: '🌱' },
  { id: 'сорняки', name: 'Сорняки', icon: '🌿' },
  { id: 'ольха', name: 'Ольха', icon: '🌲' },
  { id: 'полынь', name: 'Полынь', icon: '🌾' },
  { id: 'злаки', name: 'Злаки', icon: '🌾' }
];

// Начальные координаты карты (Новосибирск)
export const defaultMapCoordinates = {
  lat: 55.0084,
  lng: 82.9357,
  zoom: 12
};

// Настройки карты
export const mapSettings = {
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  zoomControl: false
};

// Настройки тепловой карты
export const heatmapConfig = {
  radius: 25,
  max: 10,
  blur: 15,
  gradient: {
    0.0: 'green',
    0.5: 'yellow',
    0.75: 'orange',
    1.0: 'red'
  },
  maxZoom: 18,
  minOpacity: 0.05,
  // Адаптивные настройки в зависимости от зума
  zoomLevels: {
    high: { // зум >= 15
      radius: 15,
      blur: 20
    },
    medium: { // зум >= 12
      radius: 25,
      blur: 25
    },
    low: { // зум >= 9
      radius: 35, 
      blur: 30
    },
    veryLow: { // зум < 9
      radius: 45,
      blur: 35
    }
  }
};

// Цвета для маркеров в зависимости от концентрации пыльцы
export const markerColors = {
  low: '#4CAF50', // зеленый
  medium: '#FFC107', // желтый
  high: '#FF5722', // оранжевый
  critical: '#F44336' // красный
};

// Масштабные коэффициенты для расчета распространения пыльцы
export const dispersionConfig = {
  windScaleFactor: 2000, // Коэффициент влияния скорости ветра на распространение
  baseRadius: 1000,  // Базовый радиус в метрах
  pointsPerSource: 20, // Количество точек рассчитываемых на каждый источник пыльцы
  // Адаптивные настройки в зависимости от количества источников
  pointsScaling: {
    low: 30,    // До 10 источников
    medium: 20, // 11-20 источников
    high: 15,   // 21-50 источников
    veryHigh: 10 // 50+ источников
  },
  // Настройки кластеризации
  clustering: {
    enabled: true,
    gridSize: 100, // Размер ячейки сетки в метрах
    distanceMultipliers: {
      near: 1,    // < 500м
      medium: 2,  // 500-1000м
      far: 3      // > 1000м
    }
  },
  // Максимальное количество источников для расчета
  maxSourcePoints: 100,
  // Лимиты отображения в зависимости от зума
  renderLimits: {
    highZoom: 5000,   // >= 15
    mediumZoom: 3000, // >= 12
    lowZoom: 2000,    // >= 9
    veryLowZoom: 1000 // < 9
  }
}; 