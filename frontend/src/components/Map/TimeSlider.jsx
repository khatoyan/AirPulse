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
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplaySpeed, setAutoplaySpeed] = useState(1500); // 1.5 секунды на кадр
  const [expanded, setExpanded] = useState(!isMobile); // На мобильных по умолчанию свернуто
  
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

  // Реагируем на изменение размера экрана
  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);
  
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
  const timeMarks = forecastData.filter((_, index) => {
    // На мобильных показываем меньше меток
    return isMobile ? index % 8 === 0 : index % 4 === 0;
  }).map(item => ({
    value: forecastData.indexOf(item),
    label: item.hourLabel
  }));
  
  // Если нет данных прогноза и не активен режим таймлайна, возвращаем только кнопку активации
  if (!timelineActive || forecastData.length === 0) {
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: isMobile ? '130px' : '70px', 
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
          sx={{ 
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
        >
          {isMobile ? 'Прогноз' : 'Прогноз на 24ч'}
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
          top: isMobile ? 'auto' : '90px',
          left: isMobile ? '10px' : '10px',
          bottom: isMobile ? '130px' : 'auto',
          padding: '8px 12px',
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
            size={isMobile ? "small" : "medium"}
            onClick={timelineActive ? toggleExpanded : handleToggleTimeline}
            startIcon={<AccessTimeIcon />}
            endIcon={timelineActive ? <ExpandMoreIcon /> : null}
            sx={{ 
              textTransform: 'none',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '1rem',
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1 : 2
            }}
          >
            {isMobile ? 'Прогноз' : 'Прогноз 24ч'}
          </Button>
        </Tooltip>
        
        {timelineActive && (
          <>
            <IconButton 
              color={isPlaying ? "secondary" : "primary"} 
              onClick={togglePlay}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                ml: 1,
                boxShadow: isPlaying ? '0 0 8px rgba(255, 0, 150, 0.7)' : 'none',
                width: isMobile ? 36 : 44,
                height: isMobile ? 36 : 44,
                border: '2px solid',
                borderColor: isPlaying ? 'secondary.main' : 'primary.main'
              }}
            >
              {isPlaying ? <PauseIcon fontSize={isMobile ? "small" : "medium"} /> : <PlayArrowIcon fontSize={isMobile ? "small" : "medium"} />}
            </IconButton>
            
            <IconButton
              color="primary"
              onClick={handleResetTimeline}
              size={isMobile ? "small" : "medium"}
              sx={{
                ml: 1,
                width: isMobile ? 36 : 44,
                height: isMobile ? 36 : 44,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
              title="Сбросить таймлайн"
            >
              <RestartAltIcon fontSize={isMobile ? "small" : "medium"} />
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
        bottom: isMobile ? '70px' : '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: { xs: '95%', sm: '90%', md: '80%', lg: '65%' },
        maxWidth: '800px',
        padding: isMobile ? 1.5 : 2,
        zIndex: 1600,
        backgroundColor: 'white',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
        border: '3px solid #1976d2'
      }}
    >
      <Stack spacing={isMobile ? 1 : 2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant={isMobile ? "subtitle2" : "subtitle1"} fontWeight="bold" color="primary">
              Прогноз на 24 часа
            </Typography>
          </Box>
          
          <Box>
            <Tooltip title="Свернуть таймлайн">
              <IconButton 
                onClick={toggleExpanded} 
                color="primary"
                size="small"
              >
                <ExpandLessIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Отключить прогноз">
              <IconButton 
                onClick={handleToggleTimeline} 
                color="error"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
        
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <IconButton 
              color={isPlaying ? "secondary" : "primary"} 
              onClick={togglePlay}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                boxShadow: isPlaying ? '0 0 8px rgba(255, 0, 150, 0.7)' : 'none',
                border: '2px solid',
                borderColor: isPlaying ? 'secondary.main' : 'primary.main',
                p: isMobile ? 0.5 : 1
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            
            <Typography variant={isMobile ? "body2" : "body1"} sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
              {currentTimeData.fullLabel || 'Загрузка данных...'}
            </Typography>
            
            <IconButton
              color="primary"
              onClick={handleResetTimeline}
              size={isMobile ? "small" : "medium"}
              sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                p: isMobile ? 0.5 : 1
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Stack>
          
          <Slider
            value={selectedTimeIndex}
            onChange={handleSliderChange}
            step={1}
            marks={timeMarks}
            min={0}
            max={forecastData.length - 1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => {
              const item = forecastData[value];
              return item ? item.hourLabel : '';
            }}
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: isMobile ? '0.6rem' : '0.75rem'
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            {forecastData[0]?.fullLabel || ''}
          </Typography>
          <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
            {forecastData[forecastData.length - 1]?.fullLabel || ''}
          </Typography>
        </Box>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={timelineActive} 
                  onChange={handleToggleTimeline} 
                  color="primary" 
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Режим прогноза активен
                </Typography>
              }
            />
          </Box>
        )}
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