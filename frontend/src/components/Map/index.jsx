import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useMapStore } from '../../stores/mapStore';
import { Box, Paper, Typography, Divider, Tooltip, CircularProgress } from '@mui/material';
import ReportForm from '../ReportForm';
import './Map.css';
import { weatherService } from '../../services/api';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterIcon from '@mui/icons-material/Water';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Импорт иконок для меток
import plantIcon from '../../assets/icons/plant-marker.svg';
import symptomIcon from '../../assets/icons/symptom-marker.svg';

// Переопределяем иконку по умолчанию, чтобы избежать дублирования маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

// Создаем кастомные иконки для Leaflet
const createIcon = (iconUrl, iconSize = [16, 16]) => {
  return L.icon({
    iconUrl,
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]]
  });
};

// Инициализация иконок
const ICONS = {
  plant: createIcon(plantIcon),
  symptom: createIcon(symptomIcon),
  default: createIcon(symptomIcon) // Добавляем дефолтную иконку на случай неопределенного типа
};

// Компонент для обновления тепловой карты
const HeatmapLayer = () => {
  const { reports, windDispersionPoints } = useMapStore();
  const map = useMap();
  const layerRef = useRef();
  const windLayerRef = useRef();
  const [loading, setLoading] = useState(true);

  // Настраиваем функцию для адаптивного радиуса: больше радиус для более интенсивных точек
  const getPointRadius = (intensity) => {
    // Теперь intensity в диапазоне 1-5, масштабируем адекватно
    return 15 + Math.min(intensity * 3, 15); // От 15 до 30 в зависимости от интенсивности
  };

  // Настраиваем цветовую схему для обычной тепловой карты (желто-красная)
  const normalGradient = {
    0.0: 'rgba(255, 255, 0, 0)',
    0.1: 'rgba(255, 255, 0, 0.4)',
    0.2: 'rgba(255, 230, 0, 0.5)',
    0.4: 'rgba(255, 200, 0, 0.6)',
    0.6: 'rgba(255, 150, 0, 0.7)',
    0.8: 'rgba(255, 100, 0, 0.8)',
    0.9: 'rgba(255, 50, 0, 0.9)',
    1.0: 'rgba(255, 0, 0, 1.0)'
  };

  // Настраиваем другую цветовую схему для точек рассеивания (оранжево-красная)
  const windGradient = {
    0.0: 'rgba(255, 255, 255, 0)',
    0.1: 'rgba(255, 240, 0, 0.3)',
    0.2: 'rgba(255, 210, 0, 0.4)',
    0.4: 'rgba(255, 180, 0, 0.5)',
    0.6: 'rgba(255, 150, 0, 0.6)',
    0.8: 'rgba(255, 100, 0, 0.7)',
    1.0: 'rgba(255, 50, 0, 0.8)'
  };

  useEffect(() => {
    if (reports.length > 0) {
      setLoading(false);
      
      if (map && reports) {
        const points = reports
          .filter(r => !r.isCalculated) // Убедимся, что используем только реальные точки
          .map(r => [
            r.latitude,
            r.longitude,
            Math.max(r.severity / 5, 0.2) // Нормализуем интенсивность от 1-5 до 0-1
          ]);

        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        if (points.length > 0) {
          layerRef.current = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 10,
            gradient: normalGradient,
          }).addTo(map);
        }
      }
    } else if (loading && reports.length === 0) {
      // Если данные загружены, но пусты
      setTimeout(() => setLoading(false), 1000);
    }

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, reports, loading]);

  useEffect(() => {
    if (map && windDispersionPoints && windDispersionPoints.length > 0) {
      // Создаем тепловую карту для точек рассеивания ветром
      const windHeatData = windDispersionPoints.map(p => {
        // Получаем интенсивность точки, приведенную к шкале 0-1
        const intensity = Math.min(p.severity / 5, 1);
        
        // Рассчитываем радиус в зависимости от интенсивности
        const radius = getPointRadius(p.severity);
        
        return [
          p.latitude,
          p.longitude,
          intensity // Значение интенсивности для тепловой карты
        ];
      });

      if (windLayerRef.current) {
        map.removeLayer(windLayerRef.current);
      }

      // Настраиваем отображение для точек рассеивания
      windLayerRef.current = L.heatLayer(windHeatData, {
        radius: 15, // Меньший радиус для точек рассеивания
        blur: 20, // Больше размытие для имитации Гауссовского распределения
        maxZoom: 12,
        gradient: windGradient,
        minOpacity: 0.2 // Минимальная непрозрачность для лучшей видимости
      }).addTo(map);
    }

    return () => {
      if (windLayerRef.current && map) {
        map.removeLayer(windLayerRef.current);
      }
    };
  }, [map, windDispersionPoints]);

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="map-loading-overlay">
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Загрузка данных...
        </Typography>
      </div>
    );
  }

  return null;
};

// Добавляем маркеры с иконками в зависимости от типа отчета
const PointMarkers = () => {
  const { reports } = useMapStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (reports.length > 0) {
      setLoading(false);
    } else {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [reports]);
  
  // Если данные загружаются, не отображаем маркеры
  if (loading) return null;
  
  return (
    <>
      {reports.filter(report => !report.isCalculated).map((report, index) => {
        const icon = report.type === 'plant' ? ICONS.plant : ICONS.symptom;
        
        return (
          <Marker 
            key={`marker-${report.id || index}`}
            position={[report.latitude, report.longitude]} 
            icon={icon}
          >
            <Popup>
              <div className="report-popup">
                <h3>Отчет о {report.type === 'symptom' ? 'симптоме' : 'растении'}</h3>
                <p><strong>Тип:</strong> {report.type === 'symptom' ? report.symptom : report.plantType}</p>
                <p><strong>Интенсивность:</strong> {report.severity}/5</p>
                {report.description && <p><strong>Описание:</strong> {report.description}</p>}
                <p><strong>Дата:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Функция для получения цвета в зависимости от интенсивности
const getColorForSeverity = (severity) => {
  switch (severity) {
    case 1: return '#3388ff'; // синий
    case 2: return '#33ff88'; // зеленый
    case 3: return '#ffff33'; // желтый
    case 4: return '#ff8833'; // оранжевый
    case 5: return '#ff3333'; // красный
    default: return '#3388ff'; // по умолчанию синий
  }
};

// Компонент для обработки событий карты
const MapController = () => {
  const { setSelectedLocation, setShowReportForm } = useMapStore();
  
  // Обрабатываем клик по карте
  useMapEvents({
    click: (e) => {
      // Сохраняем координаты в объекте для создания нового отчета
      const coords = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };
      console.log('Клик по карте для создания отчета:', coords);
      setSelectedLocation(coords);
      setShowReportForm(true); // Показываем форму отчета
    }
  });

  return null;
};

// Компонент для загрузки и обновления данных о погоде
const WeatherDataLoader = () => {
  const { setWeatherData } = useMapStore();
  const map = useMap();
  const [loading, setLoading] = useState(true);
  
  // Функция для загрузки данных о погоде
  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      // Получаем центр карты для запроса погоды
      const center = map.getCenter();
      
      // Загружаем данные о погоде для текущей позиции
      const weatherData = await weatherService.getCurrentWeather(
        center.lat,
        center.lng
      );
      
      setWeatherData(weatherData);
    } catch (error) {
      console.error('Ошибка при загрузке данных о погоде:', error);
      
      // В случае ошибки, пробуем загрузить последние сохраненные данные
      try {
        const latestWeather = await weatherService.getLatestWeather();
        if (latestWeather) {
          console.log('Используем последние сохраненные данные о погоде');
          setWeatherData(latestWeather);
        }
      } catch (err) {
        console.error('Невозможно загрузить даже последние данные о погоде:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [map, setWeatherData]);
  
  // Инициализация и периодическое обновление данных о погоде
  useEffect(() => {
    // Загружаем данные о погоде при первом рендере
    fetchWeatherData();
    
    // Настраиваем интервал обновления (каждые 15 минут)
    const weatherTimerRef = setInterval(fetchWeatherData, 15 * 60 * 1000);
    
    return () => {
      // Очищаем интервал при размонтировании
      clearInterval(weatherTimerRef);
    };
  }, [fetchWeatherData]);
  
  return loading ? (
    <div className="weather-loading-indicator">
      <CircularProgress size={24} />
    </div>
  ) : null;
};

// Компонент для отображения индикатора ветра
const WindIndicator = () => {
  const { weatherData } = useMapStore();
  const map = useMap();
  const windControlRef = useRef(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Создаем кастомный контрол для отображения направления ветра
    if (!windControlRef.current) {
      const WindControl = L.Control.extend({
        options: {
          position: 'topright'
        },
        
        onAdd: function() {
          const container = L.DomUtil.create('div', 'wind-indicator-container');
          container.style.background = 'white';
          container.style.padding = '10px';
          container.style.borderRadius = '5px';
          container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
          container.style.width = '150px';
          
          const title = L.DomUtil.create('div', 'wind-title', container);
          title.innerHTML = 'Ветер';
          title.style.fontWeight = 'bold';
          title.style.marginBottom = '5px';
          
          const content = L.DomUtil.create('div', 'wind-content', container);
          content.innerHTML = 'Нет данных';
          
          const arrow = L.DomUtil.create('div', 'wind-arrow', container);
          arrow.innerHTML = '↑';
          arrow.style.fontSize = '24px';
          arrow.style.textAlign = 'center';
          arrow.style.transform = 'rotate(0deg)';
          arrow.style.marginTop = '5px';
          
          container.title = 'Направление и скорость ветра';
          
          this._container = container;
          this._content = content;
          this._arrow = arrow;
          
          return container;
        },
        
        update: function(data) {
          if (!data) {
            this._content.innerHTML = 'Нет данных';
            this._arrow.style.display = 'none';
            return;
          }
          
          const { windSpeed, windDeg } = data;
          
          // Направление, откуда дует ветер
          const windDirection = this._getWindDirection(windDeg);
          
          this._content.innerHTML = `${windSpeed.toFixed(1)} м/с, ${windDirection}`;
          this._arrow.style.display = 'block';
          
          // Стрелка показывает, куда дует ветер (противоположно направлению windDeg)
          // windDeg указывает направление, откуда дует ветер
          this._arrow.style.transform = `rotate(${windDeg}deg)`;
        },
        
        _getWindDirection: function(degrees) {
          const directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
          const index = Math.round(degrees / 22.5) % 16;
          return directions[index];
        }
      });
      
      windControlRef.current = new WindControl();
      map.addControl(windControlRef.current);
    }
    
    // Обновляем индикатор при изменении данных о ветре
    if (weatherData && windControlRef.current) {
      windControlRef.current.update(weatherData);
    }
    
    return () => {
      if (windControlRef.current) {
        map.removeControl(windControlRef.current);
        windControlRef.current = null;
      }
    };
  }, [map, weatherData]);
  
  return null;
};

// Компонент для отображения погодной информации и объяснения ее влияния на рассеивание пыльцы
const WeatherInfoPanel = () => {
  const { weatherData } = useMapStore();
  const [expanded, setExpanded] = useState(false);
  
  if (!weatherData) return null;
  
  // Определяем влияние погодных факторов на рассеивание пыльцы
  const getTemperatureImpact = (temp) => {
    if (!temp) return { text: 'Нет данных', color: 'text.secondary' };
    
    if (temp < 5) return { 
      text: 'Холодно: снижение выброса пыльцы', 
      color: 'info.main',
      icon: '↓'
    };
    if (temp > 35) return { 
      text: 'Жарко: умеренное снижение выброса', 
      color: 'warning.main',
      icon: '↓'
    };
    if (temp >= 20 && temp <= 25) return { 
      text: 'Оптимально: повышенный выброс пыльцы', 
      color: 'error.main',
      icon: '↑'
    };
    
    return { 
      text: 'Нормальное рассеивание', 
      color: 'text.primary',
      icon: '→'
    };
  };
  
  const getHumidityImpact = (humidity) => {
    if (!humidity) return { text: 'Нет данных', color: 'text.secondary' };
    
    if (humidity > 80) return { 
      text: 'Высокая влажность: значительное снижение распространения', 
      color: 'info.main',
      icon: '↓'
    };
    if (humidity < 30) return { 
      text: 'Низкая влажность: усиление распространения', 
      color: 'error.main',
      icon: '↑'
    };
    if (humidity >= 40 && humidity <= 60) return { 
      text: 'Оптимальная влажность: повышенное распространение', 
      color: 'warning.main',
      icon: '↑'
    };
    
    return { 
      text: 'Нормальное рассеивание', 
      color: 'text.primary',
      icon: '→'
    };
  };
  
  const getWindImpact = (speed) => {
    if (!speed) return { text: 'Нет данных', color: 'text.secondary' };
    
    if (speed < 2) return { 
      text: 'Слабый ветер: минимальное распространение', 
      color: 'info.main',
      icon: '↓'
    };
    if (speed >= 2 && speed < 5) return { 
      text: 'Умеренный ветер: среднее распространение', 
      color: 'text.primary',
      icon: '→'
    };
    if (speed >= 5 && speed < 10) return { 
      text: 'Сильный ветер: значительное распространение', 
      color: 'warning.main',
      icon: '↑'
    };
    if (speed >= 10) return { 
      text: 'Очень сильный ветер: максимальное распространение', 
      color: 'error.main',
      icon: '↑'
    };
    
    return { 
      text: 'Нормальное рассеивание', 
      color: 'text.primary',
      icon: '→'
    };
  };
  
  const tempImpact = getTemperatureImpact(weatherData.temperature);
  const humidityImpact = getHumidityImpact(weatherData.humidity);
  const windImpact = getWindImpact(weatherData.windSpeed);
  
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        padding: 2,
        width: expanded ? 320 : 'auto',
        transition: 'width 0.3s ease',
        maxWidth: '90%',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        opacity: 0.9
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Погодные условия и рассеивание пыльцы
        </Typography>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          <InfoIcon fontSize="small" color={expanded ? 'primary' : 'action'} />
        </IconButton>
      </Box>
      
      {expanded && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mb: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ThermostatIcon fontSize="small" sx={{ mr: 1, color: tempImpact.color }} />
            <Box>
              <Typography variant="body2" component="span">
                Температура: {weatherData.temperature ? `${weatherData.temperature}°C` : 'Н/Д'}
              </Typography>
              <Typography variant="body2" component="div" color={tempImpact.color}>
                {tempImpact.icon} {tempImpact.text}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WaterIcon fontSize="small" sx={{ mr: 1, color: humidityImpact.color }} />
            <Box>
              <Typography variant="body2" component="span">
                Влажность: {weatherData.humidity ? `${weatherData.humidity}%` : 'Н/Д'}
              </Typography>
              <Typography variant="body2" component="div" color={humidityImpact.color}>
                {humidityImpact.icon} {humidityImpact.text}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AirIcon fontSize="small" sx={{ mr: 1, color: windImpact.color }} />
            <Box>
              <Typography variant="body2" component="span">
                Ветер: {weatherData.windSpeed ? `${weatherData.windSpeed} м/с` : 'Н/Д'}, 
                {weatherData.windDeg ? ` ${weatherData.windDeg}°` : ' Н/Д'}
              </Typography>
              <Typography variant="body2" component="div" color={windImpact.color}>
                {windImpact.icon} {windImpact.text}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HelpOutlineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Используем модель Гауссовского рассеивания с учетом погодных факторов для моделирования распространения пыльцы
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

function Map() {
  const { showReportForm, setShowReportForm, selectedLocation } = useMapStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Симулируем начальную загрузку карты
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh', 
          width: '100%',
          flexDirection: 'column'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Загрузка карты AirPulse...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '70vh' }}>
      <MapContainer 
        center={[55.0084, 82.9357]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <WeatherDataLoader />
        <HeatmapLayer />
        <PointMarkers />
        <MapController />
        <WindIndicator />
      </MapContainer>
      
      <WeatherInfoPanel />
      
      {showReportForm && selectedLocation && (
        <ReportForm 
          open={showReportForm}
          onClose={() => setShowReportForm(false)}
          location={selectedLocation}
        />
      )}
    </Box>
  );
}

export default Map; 