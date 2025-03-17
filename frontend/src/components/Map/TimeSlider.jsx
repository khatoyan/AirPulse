import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Slider, 
  Typography, 
  Paper, 
  IconButton, 
  Stack,
  Switch,
  FormControlLabel,
  Tooltip,
  Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useMapStore } from '../../stores/mapStore';

const TimeSlider = () => {
  const { 
    forecastData, 
    selectedTimeIndex, 
    setSelectedTimeIndex, 
    timelineActive,
    toggleTimeline,
    loadForecast 
  } = useMapStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(1500); // 1.5 секунды на кадр
  const [expanded, setExpanded] = useState(true);
  
  // Отладочный вывод данных прогноза
  useEffect(() => {
    console.log('Состояние прогноза:', { 
      forecastDataLength: forecastData?.length || 0, 
      timelineActive,
      selectedTimeIndex
    });
  }, [forecastData, timelineActive, selectedTimeIndex]);
  
  // Эффект для автоматического воспроизведения
  useEffect(() => {
    let autoplayTimer;
    
    if (isPlaying && forecastData && forecastData.length > 0) {
      console.log('Запускаем автоматическое воспроизведение прогноза');
      autoplayTimer = setInterval(() => {
        setSelectedTimeIndex((prevIndex) => {
          // Зацикливаем прогноз
          const nextIndex = (prevIndex + 1) % forecastData.length;
          console.log(`Воспроизведение: переключение с ${prevIndex} на ${nextIndex}`);
          return nextIndex;
        });
      }, autoplaySpeed);
    }
    
    return () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
      }
    };
  }, [isPlaying, forecastData, autoplaySpeed, setSelectedTimeIndex]);

  // Если нет данных прогноза и timeline активен, загружаем их
  useEffect(() => {
    if (timelineActive && (!forecastData || forecastData.length === 0)) {
      console.log('Активирован таймлайн без данных, загружаем прогноз...');
      const coords = useMapStore.getState().getMapCoordinates();
      loadForecast(coords.lat, coords.lng);
    }
  }, [timelineActive, forecastData, loadForecast]);
  
  // Обработчик изменения значения слайдера
  const handleSliderChange = (event, newValue) => {
    setSelectedTimeIndex(newValue);
  };
  
  // Обработчик нажатия кнопки воспроизведения/паузы
  const togglePlay = (e) => {
    e.stopPropagation(); // Предотвращаем пробрасывание клика
    setIsPlaying(!isPlaying);
  };
  
  // Обработчик нажатия кнопки сворачивания/разворачивания
  const toggleExpanded = (e) => {
    e.stopPropagation(); // Предотвращаем пробрасывание клика
    setExpanded(!expanded);
  };
  
  // Обработчик включения/выключения таймлайна
  const handleToggleTimeline = (e) => {
    e.stopPropagation(); // Предотвращаем пробрасывание клика
    console.log('Переключение таймлайна');
    toggleTimeline();
  };
  
  // Обработчик сброса таймлайна
  const handleResetTimeline = (e) => {
    e.stopPropagation(); // Предотвращаем пробрасывание клика
    console.log('Сброс таймлайна');
    setSelectedTimeIndex(0);
    setIsPlaying(false);
  };
  
  // Предотвращаем пробрасывание клика на карту
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };
  
  // Получаем данные о текущем выбранном времени
  const currentTimeData = forecastData[selectedTimeIndex] || {};
  
  // Форматируем метки времени для слайдера
  const timeMarks = forecastData.filter((_, index) => index % 4 === 0).map(item => ({
    value: forecastData.indexOf(item),
    label: item.hourLabel
  }));
  
  // Если нет данных прогноза и не активен режим таймлайна, возвращаем только кнопку активации
  if (!timelineActive || forecastData.length === 0) {
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: '70px', 
          right: '10px', 
          zIndex: 1000 
        }}
        onClick={handleContainerClick}
      >
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleToggleTimeline}
          startIcon={<AccessTimeIcon />}
          sx={{ borderRadius: '20px' }}
        >
          Прогноз
        </Button>
      </Box>
    );
  }
  
  // Компактный вид, когда шкала не активна или свернута
  if (!timelineActive || !expanded) {
    return (
      <Paper
        elevation={5}
        className="time-slider-container"
        onClick={handleContainerClick}
        sx={{
          position: 'absolute',
          top: '90px', // Увеличиваем отступ сверху
          left: '10px',
          padding: '12px',
          zIndex: 1600,
          backgroundColor: 'white',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
          border: '3px solid #1976d2'
        }}
      >
        <Tooltip title={timelineActive ? "Развернуть таймлайн" : "Активировать прогноз на 24 часа"}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={timelineActive ? toggleExpanded : handleToggleTimeline}
            startIcon={<AccessTimeIcon />}
            endIcon={timelineActive ? <ExpandMoreIcon /> : null}
            sx={{ 
              textTransform: 'none',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1,
              px: 2
            }}
          >
            Прогноз 24ч
          </Button>
        </Tooltip>
        
        {timelineActive && (
          <>
            <IconButton 
              color={isPlaying ? "secondary" : "primary"} 
              onClick={togglePlay}
              sx={{ 
                ml: 1,
                boxShadow: isPlaying ? '0 0 8px rgba(255, 0, 150, 0.7)' : 'none',
                width: 44,
                height: 44,
                border: '2px solid',
                borderColor: isPlaying ? 'secondary.main' : 'primary.main'
              }}
            >
              {isPlaying ? <PauseIcon fontSize="medium" /> : <PlayArrowIcon fontSize="medium" />}
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={handleResetTimeline}
              sx={{
                ml: 1,
                width: 44,
                height: 44,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
              title="Сбросить таймлайн"
            >
              <RestartAltIcon fontSize="medium" />
            </IconButton>
          </>
        )}
      </Paper>
    );
  }
  
  // Расширенный вид с полным слайдером
  return (
    <Paper
      elevation={5}
      className="time-slider-container"
      onClick={handleContainerClick}
      sx={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: { xs: '95%', sm: '85%', md: '75%', lg: '65%' },
        maxWidth: '800px',
        padding: 2,
        zIndex: 1600,
        backgroundColor: 'white',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
        border: '3px solid #1976d2'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            <AccessTimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Прогноз распространения пыльцы на 24 часа
          </Typography>
          
          <Box>
            <IconButton 
              color={isPlaying ? "secondary" : "primary"} 
              onClick={togglePlay}
              sx={{ 
                mr: 1,
                boxShadow: isPlaying ? '0 0 6px rgba(255, 0, 150, 0.5)' : 'none'
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={handleResetTimeline}
              sx={{ mr: 1 }}
              title="Сбросить таймлайн"
            >
              <RestartAltIcon />
            </IconButton>
            
            <IconButton 
              size="small" 
              onClick={toggleExpanded}
              sx={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
            >
              <ExpandLessIcon />
            </IconButton>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ minWidth: '60px', fontWeight: 'bold' }}
          >
            {currentTimeData.timeLabel || '00:00'}
          </Typography>
          
          <Slider
            value={selectedTimeIndex}
            min={0}
            max={forecastData.length - 1}
            step={1}
            marks={timeMarks}
            onChange={handleSliderChange}
            aria-labelledby="time-slider"
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.75rem'
              },
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                backgroundColor: '#1976d2'
              },
              '& .MuiSlider-track': {
                backgroundColor: '#1976d2'
              }
            }}
          />
        </Stack>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Текущие условия:</strong> {currentTimeData.temp}°C, влажность {currentTimeData.humidity}%, 
            ветер {currentTimeData.wind_speed} м/с ({currentTimeData.wind_deg}°)
          </Typography>
          
          <Typography variant="caption" fontWeight="bold" color="primary.main">
            Нажимайте Play для автовоспроизведения
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

// Создаем компонент переключателя для активации временной шкалы
export const TimelineToggle = () => {
  // Данный компонент больше не нужен, так как функционал
  // переключения перенесен в сам компонент TimeSlider
  return null;
};

export default TimeSlider; 