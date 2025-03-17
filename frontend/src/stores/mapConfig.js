// Конфигурация и константы для карты и аллергенов

// Список типов аллергенов
export const allergenTypes = [
  { id: 'береза', name: 'Берёза', icon: '🌳' },
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
  pointsPerSource: 20 // Количество точек рассчитываемых на каждый источник пыльцы
}; 