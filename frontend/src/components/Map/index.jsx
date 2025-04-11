import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import { useMapStore } from '../../stores/mapStore';
import { Box, Paper, Typography, Divider, Tooltip, CircularProgress, ButtonGroup, Button, Stack, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ReportForm from '../ReportForm';
import './Map.css';
import { weatherService } from '../../services/api';
import InfoIcon from '@mui/icons-material/Info';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterIcon from '@mui/icons-material/Water';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
// Импортируем компоненты временной шкалы
import TimeSlider from './TimeSlider';
import FloweringAlert from './FloweringAlert';
import { normalizeIntensityWithTime } from '../../utils/mapUtils';
// Импортируем функцию для проверки цветения растений
import { isPlantFlowering } from '../../utils/pollenDispersion';

// Импорт иконок для меток
const symptomIcon = new URL('../../assets/icons/symptom-marker.svg', import.meta.url).href;
const plantIcon = new URL('../../assets/icons/plant-marker.svg', import.meta.url).href;

// Переопределяем иконку по умолчанию, чтобы избежать дублирования маркеров
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

// Создаем кастомные иконки для Leaflet
const createIcon = (iconUrl, iconSize = [16, 16]) => {
  console.log('Creating icon with URL:', iconUrl);
  return L.icon({
    iconUrl,
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]]
  });
};

// Инициализация иконок
const ICONS = {
  plant: createIcon(plantIcon, [16, 16]),
  symptom: createIcon(symptomIcon, [16, 16])
};

// Добавляем компонент выбора аллергена
const AllergenSelector = () => {
  const { allergenTypes, selectedAllergen, setSelectedAllergen } = useMapStore();
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
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
  
  // Переключатель для мобильного вида
  const toggleExpanded = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // На мобильных устройствах делаем компактную кнопку, которая раскрывает панель аллергенов
  if (isMobile && !expanded) {
    return (
      <Paper
        elevation={3}
        onClick={handleContainerClick}
        sx={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 999,
          py: 1,
          px: 2,
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 2px 8px rgba(0, 120, 200, 0.3)'
        }}
      >
        <Button
          onClick={toggleExpanded}
          variant="text"
          color="primary"
          startIcon={<AirIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Фильтры
        </Button>
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={3}
      onClick={handleContainerClick}
      sx={{
        position: 'absolute',
        top: 'auto',
        bottom: isMobile ? '70px' : '10px',
        left: isMobile ? '10px' : '50%',
        right: isMobile ? '10px' : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
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
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="600" color="primary">
            Типы аллергенов
          </Typography>
          <IconButton size="small" onClick={toggleExpanded} color="primary">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

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
              minWidth: isMobile ? '100%' : 'auto',
              color: selectedAllergen === allergen.id ? '#fff' : '#1976d2',
              borderColor: '#1976d2',
              backgroundColor: selectedAllergen === allergen.id ? '#1976d2' : 'transparent',
              boxShadow: selectedAllergen === allergen.id ? '0 2px 5px rgba(25, 118, 210, 0.3)' : 'none',
              '&:hover': {
                backgroundColor: selectedAllergen === allergen.id ? '#1565c0' : 'rgba(25, 118, 210, 0.1)',
              },
              m: 0.5,
              textTransform: 'none',
              transition: 'all 0.2s ease',
              justifyContent: 'flex-start'
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
        // Нормализуем выбранный аллерген (учитывая возможность "береза"/"берёза")
        const normalizedAllergen = selectedAllergen.toLowerCase().replace('береза', 'берёза');
        
        displayReports = displayReports.filter(report => {
          if (report.plantType && report.type === 'plant') {
            // Нормализуем plantType
            const plantType = report.plantType.toLowerCase().replace('береза', 'берёза');
            return plantType.includes(normalizedAllergen);
          }
          return false;
        });
      }

      // Фильтруем только отчеты о симптомах и растениях (без расчетных точек распространения)
      const heatmapData = displayReports
        .filter(report => report && !report.isCalculated)
        .map(report => {
          // Получаем базовую интенсивность
          let intensity = report.severity || 3;
          
          // Проверяем, является ли это растением и находится ли оно в периоде цветения
          if (report.type === 'plant') {
            const plantType = report.plantType || report.genus || 'unknown';
            // Если растение не цветет, значительно уменьшаем его интенсивность
            if (!isPlantFlowering(plantType)) {
              intensity = intensity * 0.05; // 95% снижение интенсивности для нецветущих растений
              console.log(`Растение ${plantType} не цветет, значительно уменьшена интенсивность до ${intensity}`);
            } else {
              console.log(`Растение ${plantType} цветет, сохранена интенсивность ${intensity}`);
            }
          }
          
          // Нормализуем интенсивность с учетом времени
          const normalizedIntensity = normalizeIntensityWithTime(intensity, report.timestamp);
          
          return [
            report.latitude || report.lat,
            report.longitude || report.lng,
            normalizedIntensity
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
          radius: 20, // Увеличиваем радиус для более диффузного эффекта
          blur: 40, // Увеличиваем размытие
          maxZoom: 12,
          // Еще более прозрачная цветовая схема
          gradient: {
            0.0: 'rgba(0, 255, 0, 0)', // Полностью прозрачный
            0.1: 'rgba(0, 255, 0, 0.05)', // Едва заметный зеленый
            0.3: 'rgba(255, 255, 0, 0.08)', // Очень слабый желтый
            0.5: 'rgba(255, 128, 0, 0.12)', // Очень слабый оранжевый
            0.7: 'rgba(255, 0, 0, 0.18)', // Слабый красный
            1.0: 'rgba(128, 0, 128, 0.25)' // Слабый фиолетовый
          },
          minOpacity: 0.01 // Еще ниже минимальная прозрачность
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
      
      // Если нет точек для отображения, ничего не делаем
      if (!pointsToDisplay || pointsToDisplay.length === 0) {
        return;
      }
      
      // Ограничиваем количество отображаемых точек для производительности
      // Сначала сортируем точки по интенсивности (от наибольшей к наименьшей)
      const sortedPoints = [...pointsToDisplay].sort((a, b) => 
        (b.severity || 0) - (a.severity || 0)
      );
      
      // Получаем текущий уровень зума
      const currentZoom = map.getZoom();
      
      // Определяем максимальное количество точек в зависимости от зума
      const getMaxPoints = (zoom) => {
        if (zoom >= 15) return 5000; // Высокий зум - больше деталей
        if (zoom >= 12) return 3000; // Средний зум
        if (zoom >= 9) return 2000; // Низкий зум
        return 1000; // Очень низкий зум
      };
      
      // Определяем параметры тепловой карты в зависимости от зума
      const getHeatmapParams = (zoom) => {
        if (zoom >= 15) {
          return { radius: 15, blur: 20 }; // На высоком зуме меньше радиус для точности
        }
        if (zoom >= 12) {
          return { radius: 25, blur: 25 };
        }
        if (zoom >= 9) {
          return { radius: 35, blur: 30 };
        }
        return { radius: 45, blur: 35 }; // На низком зуме больше радиус для видимости
      };
      
      const maxPoints = getMaxPoints(currentZoom);
      const limitedPoints = sortedPoints.length > maxPoints 
        ? sortedPoints.slice(0, maxPoints) 
        : sortedPoints;
      
      console.log(`Отображение ${limitedPoints.length} из ${pointsToDisplay.length} точек рассеивания (зум: ${currentZoom})`);
      
      // Преобразуем точки в формат для L.heatLayer
      const heatmapData = limitedPoints
        .filter(point => point && point.latitude && point.longitude)
        .map(point => {
          // Проверяем, является ли точка результатом распространения от нецветущего растения
          let intensity = point.severity || 3;
          
          if (point.plantType) {
            // Если растение не цветет, уменьшаем интенсивность его распространения
            if (!isPlantFlowering(point.plantType)) {
              intensity = intensity * 0.03; // 97% снижение для нецветущих
            }
          }
          
          // Дополнительно проверяем и применяем временное затухание
          const normalizedIntensity = normalizeIntensityWithTime(intensity, point.timestamp);
          
          return [
            point.latitude,
            point.longitude,
            normalizedIntensity
          ];
        });
      
      // Получаем параметры тепловой карты в зависимости от текущего зума
      const { radius, blur } = getHeatmapParams(currentZoom);
      
      // Создаем новый слой с точками распространения только если есть данные
      if (heatmapData.length > 0) {
        windDispersionLayerRef.current = L.heatLayer(heatmapData, {
          radius: radius,
          blur: blur,
          maxZoom: 18,
          // Прозрачная градация цветов
          gradient: {
            0.0: 'rgba(0, 255, 0, 0)', // Полностью прозрачный
            0.1: 'rgba(0, 255, 0, 0.04)', // Едва заметный зеленый
            0.3: 'rgba(255, 255, 0, 0.07)', // Очень слабый желтый
            0.5: 'rgba(255, 192, 0, 0.1)', // Очень слабый оранжево-желтый
            0.7: 'rgba(255, 128, 0, 0.15)', // Слабый оранжевый
            0.85: 'rgba(255, 0, 0, 0.18)', // Слабый красный
            1.0: 'rgba(128, 0, 128, 0.22)' // Слабый фиолетовый
          },
          minOpacity: 0.01 // Крайне низкая минимальная прозрачность
        }).addTo(map);
      }
    } catch (error) {
      console.error('Ошибка при создании слоя распространения:', error);
    }
    
  }, [map, dispersedPoints, timeDispersionPoints, timelineActive, updateHeatmap]);
  
  // Перерисовываем тепловую карту при изменении зума
  const mapEvents = useMapEvents({
    zoomend: () => {
      // Обновляем updateHeatmap для перерисовки тепловой карты
      useMapStore.getState().setUpdateHeatmap(Date.now());
    }
  });
  
  return null;
};

// Компонент отрисовки точек на карте с разбивкой на категории
function PointMarkers() {
  const { reports, selectedAllergen } = useMapStore();
  const markersLayerRef = useRef(null);
  const map = useMap();
  const [visibleBounds, setVisibleBounds] = useState(map.getBounds());
  
  // Добавляем логирование для анализа поступающих отчетов
  useEffect(() => {
    if (reports && reports.length > 0) {
      console.log(`[PointMarkers] Получено ${reports.length} отчетов из хранилища`);
      
      // Анализируем типы отчетов для диагностики
      const plantsCount = reports.filter(r => r.type === 'plant').length;
      const symptomsCount = reports.filter(r => r.type === 'symptom').length;
      const calculatedCount = reports.filter(r => r.isCalculated).length;
      
      // Подсчитываем городские деревья (начинаются с 'city_')
      const cityTreesCount = reports.filter(r => typeof r.id === 'string' && r.id.startsWith('city_')).length;
      
      console.log(`[PointMarkers] Анализ типов отчетов:
        - Растения: ${plantsCount}
        - Симптомы: ${symptomsCount}
        - Городские деревья: ${cityTreesCount}
        - Рассчитанные точки: ${calculatedCount}
      `);
      
      // Проверяем наличие координат во всех отчетах
      const missingCoords = reports.filter(r => !r.lat || !r.lng).length;
      if (missingCoords > 0) {
        console.warn(`[PointMarkers] Внимание: ${missingCoords} отчетов не имеют координат!`);
      }
      
      // Выводим примеры разных типов отчетов для диагностики
      const plantExample = reports.find(r => r.type === 'plant' && !(typeof r.id === 'string' && r.id.startsWith('city_')));
      const cityExample = reports.find(r => typeof r.id === 'string' && r.id.startsWith('city_'));
      
      if (plantExample) {
        console.log('[PointMarkers] Пример отчета о растении из БД:', plantExample);
      }
      
      if (cityExample) {
        console.log('[PointMarkers] Пример отчета о городском дереве:', cityExample);
      } else {
        console.warn('[PointMarkers] Не найдено ни одного городского дерева среди отчетов!');
      }
    } else {
      console.log('[PointMarkers] Данные еще загружаются или отчеты отсутствуют');
    }
  }, [reports]);

  // Отрисовка меток на карте
  useEffect(() => {
    if (!map || !reports) return;

    console.log(`[PointMarkers] Начинаем рендеринг маркеров. Выбранный аллерген: ${selectedAllergen || 'все'}`);
    console.log('[PointMarkers] Доступные иконки:', ICONS);
    console.log('[PointMarkers] URL иконок:', {
      plant: plantIcon,
      symptom: symptomIcon
    });
    
    // Удаляем существующие маркеры
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    // Фильтруем отчеты на основе выбранного аллергена
    let filteredReports = reports;
    if (selectedAllergen) {
      // Нормализуем выбранный аллерген (учитывая возможность "береза"/"берёза")
      const normalizedAllergen = selectedAllergen.toLowerCase().replace('береза', 'берёза');
      
      filteredReports = reports.filter((report) => {
        // Для симптомов проверяем аллерген
        if (report.type === 'symptom') {
          const allergen = report.allergen?.toLowerCase().replace('береза', 'берёза');
          return allergen === normalizedAllergen;
        }
        // Для растений проверяем genus
        if (report.type === 'plant') {
          const genus = report.genus?.toLowerCase().replace('береза', 'берёза');
          return genus === normalizedAllergen;
        }
        return false;
      });
      console.log(`[PointMarkers] Отчеты отфильтрованы по аллергену "${selectedAllergen}": ${filteredReports.length} из ${reports.length}`);
    }

    // Отрисовываем отфильтрованные отчеты
    console.log(`[PointMarkers] Отрисовка ${filteredReports.length} маркеров`);
    
    // Подсчитываем маркеры по источникам для логирования
    const dbPlants = filteredReports.filter(r => r.type === 'plant' && !(typeof r.id === 'string' && r.id.startsWith('city_'))).length;
    const cityTrees = filteredReports.filter(r => typeof r.id === 'string' && r.id.startsWith('city_')).length;
    const symptoms = filteredReports.filter(r => r.type === 'symptom').length;
    const calculated = filteredReports.filter(r => r.isCalculated).length;
    
    console.log(`[PointMarkers] Распределение отрисовываемых маркеров:
      - Растения из БД: ${dbPlants}
      - Городские деревья: ${cityTrees}
      - Симптомы: ${symptoms}
      - Рассчитанные точки: ${calculated}
    `);

    // Отфильтровываем только отчеты с валидными координатами
    const reportsWithCoordinates = filteredReports.filter(report => {
      // Проверяем, что у отчета есть координаты в любом допустимом формате
      if (report.coordinates && Array.isArray(report.coordinates) && report.coordinates.length === 2) {
        return true;
      }
      
      if (report.latitude !== undefined && report.longitude !== undefined) {
        // Создаем массив координат, если его нет
        report.coordinates = [report.latitude, report.longitude];
        return true;
      }
      
      if (report.lat !== undefined && report.lng !== undefined) {
        // Создаем массив координат, если его нет
        report.coordinates = [report.lat, report.lng];
        return true;
      }
      
      return false;
    });
    
    console.log(`[PointMarkers] После фильтрации координат осталось ${reportsWithCoordinates.length} из ${filteredReports.length} маркеров`);
    const visibleReports = visibleBounds ? reportsWithCoordinates.filter(report => {
      return visibleBounds.contains(L.latLng(report.coordinates[0], report.coordinates[1]));
    }) : reportsWithCoordinates;
    console.log(`[PointMarkers] Количество маркеров в видимой области: ${visibleReports.length}`);

    // Initialize a marker cluster group
    const markerClusterGroup = L.markerClusterGroup();

    visibleReports.forEach((report) => {
      try {
        // Определяем тип иконки на основе типа отчета
        let iconKey = 'symptom'; // Default to symptom if no specific type
        if (report.type === 'plant') {
          iconKey = 'plant';
        }
        
        console.log(`[PointMarkers] Создание маркера типа "${iconKey}" для отчета:`, report);
        
        // Use the icon based on report type
        const icon = ICONS[iconKey];
        console.log(`[PointMarkers] Используемая иконка:`, icon);
        
        // Проверяем координаты
        console.log(`[PointMarkers] Координаты маркера:`, report.coordinates);
        
        const marker = L.marker(report.coordinates, {
          icon: icon,
          title: report.type === 'symptom' ? report.symptom : report.plantType,
          zIndexOffset: 1000
        });
        
        // Добавляем маркер на карту
        marker.addTo(map);
        console.log(`[PointMarkers] Маркер добавлен на карту`);
        
        // Add popup for additional information
        const popupContent = `
          <div class="report-popup">
            <h3>${report.type === 'plant' ? (report.plantType || 'Растение') : (report.symptom || 'Симптом')}</h3>
            <p><strong>Тип:</strong> ${report.type === 'plant' ? 'Растение' : 'Симптом'}</p>
            <p><strong>Интенсивность:</strong> ${report.severity || 'N/A'}/5</p>
            ${report.description ? `<p>${report.description}</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markerClusterGroup.addLayer(marker);
      } catch (error) {
        console.error('[PointMarkers] Ошибка при создании маркера:', error);
      }
    });

    // Add the cluster group to the map and store it in the ref
    map.addLayer(markerClusterGroup);
    markersLayerRef.current = markerClusterGroup;

  }, [map, reports, selectedAllergen, visibleBounds]);

  useMapEvents({
    moveend: () => {
      setVisibleBounds(map.getBounds());
    }
  });

  return null;
}

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

// Функция для получения текстового представления направления ветра
const getWindDirectionText = (degrees) => {
  if (degrees === undefined || degrees === null) {
    return 'Н/Д';
  }
  const directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Компонент для отображения погодной информации и объяснения ее влияния на рассеивание пыльцы
const WeatherInfoPanel = () => {
  const { weatherData } = useMapStore();
  const [expanded, setExpanded] = useState(false);
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
        top: isMobile ? 'auto' : '90px',
        right: '10px',
        bottom: isMobile ? '70px' : 'auto',
        zIndex: 1700,
        padding: 2,
        width: expanded ? (isMobile ? '94%' : '320px') : 'auto',
        minWidth: isMobile ? 'auto' : '180px',
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
          {expanded ? <CloseIcon fontSize="small" /> : <InfoIcon fontSize="small" />}
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
          
          {/* Подробная информация о погоде */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ThermostatIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" fontWeight="bold">
                Температура: {weatherData.temperature ? `${weatherData.temperature}°C` : 'Нет данных'}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color={tempImpact.color}
              sx={{ pl: 4, lineHeight: 1.3 }}
            >
              {tempImpact.icon} {tempImpact.text}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WaterIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" fontWeight="bold">
                Влажность: {weatherData.humidity ? `${weatherData.humidity}%` : 'Нет данных'}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color={humidityImpact.color}
              sx={{ pl: 4, lineHeight: 1.3 }}
            >
              {humidityImpact.icon} {humidityImpact.text}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AirIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" fontWeight="bold">
                Ветер: {weatherData.windSpeed ? `${weatherData.windSpeed} м/с` : 'Нет данных'}
                {weatherData.windDeg ? `, ${getWindDirectionText(weatherData.windDeg)}` : ''}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color={windImpact.color}
              sx={{ pl: 4, lineHeight: 1.3 }}
            >
              {windImpact.icon} {windImpact.text}
            </Typography>
          </Box>
          
          <Tooltip title="Информация о влиянии погоды на распространение пыльцы">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px dashed rgba(0, 0, 0, 0.1)'
            }}>
              <HelpOutlineIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Показано влияние погоды на распространение пыльцы
              </Typography>
            </Box>
          </Tooltip>
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
    
    // Добавляем таймаут для запроса геолокации
    const timeoutId = setTimeout(() => {
      setError("Превышено время ожидания определения местоположения. Возможно, включен VPN или прокси.");
      setLoading(false);
    }, 10000); // 10 секунд таймаут
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        console.log(`Получены координаты пользователя: ${latitude}, ${longitude}`);
        
        // Проверяем, не похоже ли местоположение на VPN/прокси
        if (latitude === 0 && longitude === 0) {
          setError("Не удалось определить точное местоположение. Возможно, включен VPN или прокси.");
          return;
        }
        
        // Сохраняем местоположение пользователя в хранилище в правильном формате
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Проверяем, что карта существует и инициализирована перед использованием setView
        if (map && map._loaded) {
          try {
            // Перемещаем карту к местоположению пользователя
            map.setView([latitude, longitude], 13);
          } catch (err) {
            console.error('Ошибка при перемещении карты:', err);
          }
        } else {
          console.log('Карта не полностью инициализирована, пропускаем setView');
        }
        
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error("Ошибка при получении местоположения:", err);
        
        let errorMessage = "Не удалось определить ваше местоположение.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Доступ к геолокации запрещен. Пожалуйста, разрешите доступ в настройках браузера.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Информация о местоположении недоступна. Проверьте подключение к интернету.";
            break;
          case err.TIMEOUT:
            errorMessage = "Превышено время ожидания определения местоположения. Возможно, включен VPN или прокси.";
            break;
          default:
            errorMessage = "Произошла ошибка при определении местоположения.";
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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
  const { 
    toggleReportForm, 
    showReportForm, 
    selectedLocation, 
    setSelectedLocation, 
    allergenTypes, 
    setSelectedAllergen,
    addReport
  } = useMapStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '80vh' }}>
      <MapContainer
        center={[55.0084, 82.9357]} // Новосибирск как начальный центр
        zoom={13}
        minZoom={13}
        maxBounds={[[55.0074, 82.9337], [55.0094, 82.9377]]}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true}
      >
        <FloweringAlert />
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