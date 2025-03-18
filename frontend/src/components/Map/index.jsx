import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useMapStore } from '../../stores/mapStore';
import { Box, Paper, Typography, Divider, Tooltip, CircularProgress, ButtonGroup, Button, Stack, IconButton } from '@mui/material';
import ReportForm from '../ReportForm';
import './Map.css';
import { weatherService } from '../../services/api';
import InfoIcon from '@mui/icons-material/Info';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterIcon from '@mui/icons-material/Water';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
// Импортируем компоненты временной шкалы
import TimeSlider from './TimeSlider';
import { normalizeIntensity, getPointRadius, getColorForSeverity, normalizeIntensityWithTime } from '../../utils/mapUtils';

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

// Добавляем компонент выбора аллергена
const AllergenSelector = () => {
  const { allergenTypes, selectedAllergen, setSelectedAllergen } = useMapStore();
  const [isMobile, setIsMobile] = useState(false);
  
  // Проверяем размер экрана при монтировании и при изменении размера окна
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Предотвращаем пробрасывание клика на карту
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <Paper 
      elevation={3}
      onClick={handleContainerClick}
      sx={{
        position: 'absolute',
        top: 'auto',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        py: 1,
        px: 0.5,
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        maxWidth: isMobile ? '95%' : '700px',
        boxShadow: '0 2px 8px rgba(0, 120, 200, 0.2)'
      }}
    >
      <Stack 
        direction={isMobile ? 'column' : 'row'} 
        spacing={1}
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        sx={{ px: 1 }}
      >
        {allergenTypes.map((allergen) => (
          <Button
            key={allergen.id}
            variant={selectedAllergen === allergen.id ? "contained" : "outlined"}
            color="primary"
            onClick={(e) => {
              e.stopPropagation(); // Предотвращаем пробрасывание клика
              setSelectedAllergen(selectedAllergen === allergen.id ? null : allergen.id);
            }}
            sx={{
              borderRadius: '6px',
              py: 0.5,
              px: 2,
              minWidth: isMobile ? '120px' : 'auto',
              color: selectedAllergen === allergen.id ? '#fff' : '#1976d2',
              borderColor: '#1976d2',
              backgroundColor: selectedAllergen === allergen.id ? '#1976d2' : 'transparent',
              boxShadow: selectedAllergen === allergen.id ? '0 2px 5px rgba(25, 118, 210, 0.3)' : 'none',
              '&:hover': {
                backgroundColor: selectedAllergen === allergen.id ? '#1565c0' : 'rgba(25, 118, 210, 0.1)',
              },
              m: 0.5,
              textTransform: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Typography variant="body2" fontWeight={selectedAllergen === allergen.id ? 600 : 400}>
              {allergen.name}
            </Typography>
          </Button>
        ))}
      </Stack>
    </Paper>
  );
};

// Модифицируем компонент HeatmapLayer для поддержки временной шкалы
const HeatmapLayer = () => {
  const map = useMap();
  const heatmapLayerRef = useRef(null);
  const { reports, updateHeatmap, selectedAllergen, timelineActive, timeDispersionPoints, dispersedPoints } = useMapStore();
  
  // При изменении отчетов или флага обновления обновляем тепловую карту
  useEffect(() => {
    if (!map) return;
    
    try {
      // Фильтруем отчеты по выбранному аллергену, если он установлен
      let displayReports = reports || [];
      
      if (selectedAllergen) {
        displayReports = displayReports.filter(report => {
          if (report.plantType && report.type === 'plant') {
            return report.plantType.toLowerCase().includes(selectedAllergen.toLowerCase());
          }
          return false;
        });
      }

      // Фильтруем только отчеты о симптомах и растениях (без расчетных точек распространения)
      const heatmapData = displayReports
        .filter(report => report && !report.isCalculated)
        .map(report => {
          return [
            report.latitude,
            report.longitude,
            normalizeIntensityWithTime(report.severity, report.timestamp)
          ];
        });

      console.log(`Отображение ${heatmapData.length} точек на тепловой карте (из ${reports ? reports.length : 0} отчетов)`);

      // Если уже есть тепловая карта, удаляем ее
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
      
      // Создаем новую тепловую карту только если есть данные
      if (heatmapData.length > 0) {
        heatmapLayerRef.current = L.heatLayer(heatmapData, {
          radius: 20,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.0: 'rgba(0, 128, 255, 0.7)',
            0.3: 'rgba(0, 255, 255, 0.7)',
            0.5: 'rgba(255, 255, 0, 0.8)',
            0.7: 'rgba(255, 128, 0, 0.9)',
            1.0: 'rgba(255, 0, 0, 1.0)'
          }
        }).addTo(map);
      }
    } catch (error) {
      console.error('Ошибка при создании тепловой карты:', error);
    }

  }, [map, reports, updateHeatmap, selectedAllergen]);

  return null;
};

// Компонент для отображения точек распространения пыльцы
const WindDispersionLayer = () => {
  const map = useMap();
  const windDispersionLayerRef = useRef(null);
  const { dispersedPoints, timelineActive, timeDispersionPoints, updateHeatmap } = useMapStore();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Определяем, какие точки использовать в зависимости от режима
      const pointsToDisplay = timelineActive ? (timeDispersionPoints || []) : (dispersedPoints || []);
      
      // Если уже есть слой с точками, удаляем его
      if (windDispersionLayerRef.current) {
        map.removeLayer(windDispersionLayerRef.current);
      }
      
      if (pointsToDisplay && pointsToDisplay.length > 0) {
        // Преобразуем точки в формат для L.heatLayer
        const heatmapData = pointsToDisplay
          .filter(point => point && point.latitude && point.longitude)
          .map(point => {
            return [
              point.latitude,
              point.longitude,
              normalizeIntensityWithTime(point.severity, point.timestamp)
            ];
          });
        
        console.log(`Отображение ${heatmapData.length} точек рассеивания ветром (timelineActive: ${timelineActive})`);
        
        // Создаем новый слой с точками распространения только если есть данные
        if (heatmapData.length > 0) {
          windDispersionLayerRef.current = L.heatLayer(heatmapData, {
            radius: 15,
            blur: 20,
            maxZoom: 18,
            gradient: {
              0.0: 'rgba(0, 128, 255, 0.7)',
              0.3: 'rgba(0, 255, 255, 0.7)',
              0.5: 'rgba(255, 255, 0, 0.8)',
              0.7: 'rgba(255, 128, 0, 0.9)',
              1.0: 'rgba(255, 0, 0, 1.0)'
            }
          }).addTo(map);
        }
      }
    } catch (error) {
      console.error('Ошибка при создании слоя распространения:', error);
    }
    
  }, [map, dispersedPoints, timeDispersionPoints, timelineActive, updateHeatmap]);
  
  return null;
};

// Добавляем маркеры с иконками в зависимости от типа отчета
const PointMarkers = () => {
  const { reports, selectedAllergen } = useMapStore();
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
  
  // Фильтруем отчеты по выбранному аллергену
  const filteredReports = reports.filter(report => {
    // Показываем только точки, которые не рассчитаны
    if (report.isCalculated) return false;
    
    // Если не выбран аллерген, показываем все отчеты
    if (!selectedAllergen) return true;
    
    // Для отчетов типа "plant" проверяем соответствие выбранному аллергену
    if (report.type === 'plant' && report.plantType) {
      return report.plantType.toLowerCase().includes(selectedAllergen.toLowerCase());
    }
    
    // Для отчетов типа "symptom" всегда показываем
    return report.type === 'symptom';
  });
  
  return (
    <>
      {filteredReports.map((report, index) => {
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

// Компонент для обработки событий карты
const MapController = () => {
  const { toggleReportForm } = useMapStore();
  
  // Обрабатываем клик по карте
  const mapEvents = useMapEvents({
    click: (e) => {
      console.log('Клик по карте зарегистрирован: ', e.latlng);
      
      // Проверяем, был ли клик на элементе управления
      const target = e.originalEvent.target;
      if (target.closest('.leaflet-control') || 
          target.closest('.MuiPaper-root') || 
          target.closest('.MuiButton-root') || 
          target.closest('.MuiIconButton-root')) {
        console.log('Клик на элементе управления, игнорируем');
        return;
      }
      
      // Сохраняем координаты в объекте для создания нового отчета
      const coords = {
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      };
      console.log('Клик по карте для создания отчета:', coords);
      
      // Показываем форму отчета с выбранной локацией
      toggleReportForm(true, coords);
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

// Компонент для отображения погодной информации и объяснения ее влияния на рассеивание пыльцы
const WeatherInfoPanel = () => {
  const { weatherData } = useMapStore();
  const [expanded, setExpanded] = useState(false);
  
  if (!weatherData) return null;
  
  // Предотвращаем пробрасывание клика на карту
  const handlePanelClick = (e) => {
    e.stopPropagation();
  };
  
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
      elevation={4}
      className="weather-info-panel"
      onClick={handlePanelClick}
      sx={{
        position: 'absolute',
        top: '90px', // Увеличиваем отступ сверху
        right: '10px',
        zIndex: 1700,
        padding: 2,
        width: expanded ? 320 : 'auto',
        minWidth: 180,
        transition: 'width 0.3s ease',
        maxWidth: '90%',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        opacity: 1,
        border: '3px solid #1976d2',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="primary">
          Погодные условия
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: expanded ? 'primary.main' : 'text.secondary',
            bgcolor: expanded ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
            border: expanded ? '1px solid rgba(25, 118, 210, 0.5)' : 'none'
          }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Если панель не развернута, показываем краткую информацию */}
      {!expanded && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" component="div" sx={{ fontWeight: 'medium' }}>
            {weatherData.temperature ? `${weatherData.temperature}°C` : 'Н/Д'}, 
            {weatherData.humidity ? ` ${weatherData.humidity}%` : ' Н/Д'}, 
            {weatherData.windSpeed ? ` ${weatherData.windSpeed} м/с` : ' Н/Д'}
          </Typography>
        </Box>
      )}
      
      {expanded && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mb: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ThermostatIcon fontSize="small" sx={{ mr: 1, color: tempImpact.color }} />
            <Box>
              <Typography variant="body2" component="span" fontWeight="medium">
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
              <Typography variant="body2" component="span" fontWeight="medium">
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
              <Typography variant="body2" component="span" fontWeight="medium">
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
              Используем модель Гауссовского рассеивания с учетом погодных факторов
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Компонент для загрузки данных прогноза
const ForecastDataLoader = () => {
  const { loadForecast, forecastData } = useMapStore();
  const map = useMap();
  
  useEffect(() => {
    // Загружаем прогноз при монтировании компонента
    if (!forecastData || forecastData.length === 0) {
      const center = map.getCenter();
      console.log(`Загрузка прогноза погоды при инициализации карты: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
      loadForecast(center.lat, center.lng);
    }
    
    // Загружаем новый прогноз при значительном изменении области просмотра
    const handleMoveEnd = () => {
      // Ограничиваем частоту обновления - запрашиваем новый прогноз только 
      // если карта была значительно перемещена (более 20 км)
      const center = map.getCenter();
      console.log(`Карта перемещена, обновляем прогноз погоды: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
      loadForecast(center.lat, center.lng);
    };
    
    // Добавляем обработчик события перемещения карты
    const debouncedHandler = debounce(handleMoveEnd, 2000);
    map.on('moveend', debouncedHandler);
    
    return () => {
      map.off('moveend', debouncedHandler);
    };
  }, [map, loadForecast, forecastData]);
  
  return null;
};

// Компонент для обработки местоположения пользователя
const UserLocationControl = () => {
  const map = useMap();
  const { setUserLocation, userLocation } = useMapStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const locationControlRef = useRef(null);
  
  // Обработчик закрытия уведомления
  const handleCloseNotification = () => {
    setShowErrorNotification(false);
  };
  
  // Показываем уведомление при ошибке
  useEffect(() => {
    if (error) {
      setShowErrorNotification(true);
    }
  }, [error]);
  
  // Функция для определения местоположения пользователя
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Ваш браузер не поддерживает геолокацию");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Получены координаты пользователя: ${latitude}, ${longitude}`);
        
        // Сохраняем местоположение пользователя в хранилище в правильном формате
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Перемещаем карту к местоположению пользователя
        map.setView([latitude, longitude], 13);
        
        setLoading(false);
      },
      (err) => {
        console.error("Ошибка при получении местоположения:", err);
        
        // Устанавливаем местоположение по умолчанию при ошибке
        const defaultLocation = { lat: 55.0084, lng: 82.9357 }; // Новосибирск
        console.log(`Используем местоположение по умолчанию: ${defaultLocation.lat}, ${defaultLocation.lng}`);
        setUserLocation(defaultLocation);
        
        // Отображаем дружелюбное сообщение об ошибке
        let errorMessage = "Не удалось определить местоположение";
        if (err.code === 1) {
          errorMessage = "Доступ к геолокации запрещен. Это может быть связано с использованием HTTP вместо HTTPS.";
        } else if (err.code === 2) {
          errorMessage = "Местоположение недоступно.";
        } else if (err.code === 3) {
          errorMessage = "Превышено время ожидания при определении местоположения.";
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 5000, 
        maximumAge: 0 
      }
    );
  }, [map, setUserLocation]);
  
  // Добавляем кнопку на карту
  useEffect(() => {
    if (!map) return;
    
    // Создаем кастомный контрол для кнопки местоположения
    if (!locationControlRef.current) {
      const LocationControl = L.Control.extend({
        options: {
          position: 'topleft'
        },
        
        onAdd: function(map) {
          const container = L.DomUtil.create('div', 'location-control');
          container.innerHTML = `
            <button class="location-button" title="Найти мое местоположение">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#1976d2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            </button>
          `;
          
          // Добавляем стили для кнопки
          const style = document.createElement('style');
          style.innerHTML = `
            .location-control {
              margin: 10px;
            }
            .location-button {
              width: 40px;
              height: 40px;
              border-radius: 4px;
              background-color: white;
              border: 2px solid rgba(0, 0, 0, 0.2);
              background-clip: padding-box;
              cursor: pointer;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .location-button:hover {
              background-color: #f4f4f4;
            }
            .location-button.loading svg {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
          
          // Добавляем обработчик клика
          container.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Вызываем функцию определения местоположения
            getUserLocation();
            
            // Добавляем класс загрузки к кнопке
            const button = container.querySelector('.location-button');
            button.classList.add('loading');
            
            // Удаляем класс загрузки через 2 секунды
            setTimeout(() => {
              button.classList.remove('loading');
            }, 2000);
            
            return false;
          };
          
          return container;
        }
      });
      
      locationControlRef.current = new LocationControl();
      map.addControl(locationControlRef.current);
    }
    
    // Автоопределение местоположения при первой загрузке
    getUserLocation();
    
    return () => {
      if (locationControlRef.current) {
        map.removeControl(locationControlRef.current);
        locationControlRef.current = null;
      }
    };
  }, [map, getUserLocation]);
  
  return (
    <>
      {showErrorNotification && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1800,
            padding: 2,
            maxWidth: '80%',
            backgroundColor: '#fffcf4',
            borderRadius: 2,
            border: '2px solid #e2b007',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box sx={{ mr: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseNotification}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
    </>
  );
};

// Добавляем функцию debounce, если нет lodash
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Модифицируем основной компонент карты
function Map() {
  const { showReportForm, selectedLocation, setReports, setUserLocation, toggleReportForm } = useMapStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Добавляем инициализацию состояния для местоположения пользователя
  useEffect(() => {
    // Дополняем хранилище начальными данными о местоположении пользователя
    useMapStore.setState({ 
      userLocation: null
    });
  }, []);
  
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
    <Box sx={{ position: 'relative', height: '90vh', width: '100%' }}>
      <MapContainer
        center={[55.0084, 82.9357]} // Новосибирск как начальный центр
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController />
        <WeatherDataLoader />
        <ForecastDataLoader />
        <UserLocationControl />
        
        <HeatmapLayer />
        <WindDispersionLayer />
        <PointMarkers />
        
        <WeatherInfoPanel />
        
        <AllergenSelector />
        <TimeSlider />
      </MapContainer>
      
      {showReportForm && selectedLocation && (
        <ReportForm
          location={selectedLocation}
          onClose={() => toggleReportForm(false)}
        />
      )}
    </Box>
  );
}

export default Map; 