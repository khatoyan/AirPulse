import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  Autocomplete,
  Checkbox,
  Chip,
  ClickAwayListener,
  Paper
} from '@mui/material';
import { useMapStore } from '../../stores/mapStore';
import { useAuthStore } from '../../stores/authStore';
import { reportsService, plantsService } from '../../services/api';

// Типы симптомов
const symptoms = [
  'Чихание',
  'Заложенность носа',
  'Кашель',
  'Слезотечение',
  'Зуд в горле',
  'Затрудненное дыхание'
];

function ReportForm({ location, onClose }) {
  const { addReport, toggleReportForm, showReportForm } = useMapStore();
  const { isAuthenticated, isAdmin, getAuthHeader } = useAuthStore();
  const [reportType, setReportType] = useState('symptom');
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectRef = useRef(null);
  
  console.log('Компонент ReportForm рендерится. Местоположение:', location);

  // Инициализируем состояние формы
  const [formData, setFormData] = useState({
    type: 'symptom',
    symptom: '',
    symptoms: [], // Пустой массив для множественного выбора симптомов
    plantType: '',
    plantId: null,
    plantObj: null, // Добавляем объект растения для Autocomplete
    severity: 3,
    allergen: '',
    note: '',
    description: '', // Добавляем поле для описания
    isAnonymous: !isAuthenticated 
  });

  console.log('Начальное состояние формы:', formData);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Загрузка списка растений
  useEffect(() => {
    console.log('Инициализация загрузки растений...');
    
    const fetchPlants = async () => {
      try {
        console.log('Запрос списка растений с бэкенда...');
        const data = await plantsService.getAllPlants();
        console.log('Ответ от сервера (растения):', data);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Успешно загружено ${data.length} растений`);
          setPlants(data);
        } else {
          console.error('Получен пустой или некорректный список растений:', data);
          // Для отладки создаем моковый список растений
          const mockPlants = [
            { id: 1, name: 'Береза' },
            { id: 2, name: 'Тополь' },
            { id: 3, name: 'Ольха' },
            { id: 4, name: 'Амброзия' }
          ];
          console.log('Используем моковые данные для отладки:', mockPlants);
          setPlants(mockPlants);
          
          setSnackbar({
            open: true,
            message: 'Не удалось загрузить список растений. Используем тестовые данные.',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('Ошибка при загрузке растений:', error);
        
        // Для отладки создаем моковый список растений
        const mockPlants = [
          { id: 1, name: 'Береза' },
          { id: 2, name: 'Тополь' },
          { id: 3, name: 'Ольха' },
          { id: 4, name: 'Амброзия' }
        ];
        console.log('Ошибка API. Используем моковые данные для отладки:', mockPlants);
        setPlants(mockPlants);
        
        setSnackbar({
          open: true,
          message: 'Не удалось загрузить список растений. Используем тестовые данные.',
          severity: 'warning'
        });
      }
    };
    
    fetchPlants();
  }, []);

  const handleTypeChange = (event) => {
    const type = event.target.value;
    console.log(`Изменение типа отчета на: ${type}`);
    setReportType(type);
    
    // Сбрасываем поля, относящиеся к определенному типу, при переключении
    if (type === 'symptom') {
      setFormData({
        ...formData,
        type,
        plantType: '',
        plantId: null,
        plantObj: null
      });
    } else {
      setFormData({
        ...formData,
        type,
        symptoms: []
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location || !location.latitude || !location.longitude) {
      console.error('Ошибка: местоположение не определено', location);
      setSnackbar({
        open: true,
        message: 'Ошибка: местоположение не определено',
        severity: 'error'
      });
      return;
    }
    
    // Проверяем обязательные поля
    if (reportType === 'symptom' && (!formData.symptoms || formData.symptoms.length === 0)) {
      setSnackbar({
        open: true,
        message: 'Пожалуйста, выберите хотя бы один симптом',
        severity: 'error'
      });
      return;
    }
    
    if (reportType === 'plant' && !formData.plantType) {
      setSnackbar({
        open: true,
        message: 'Пожалуйста, выберите тип растения',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Подготавливаем данные отчета
      const reportData = {
        latitude: location.latitude,
        longitude: location.longitude,
        type: reportType,
        severity: formData.severity,
        note: formData.description || formData.note || null,
        anonymous: formData.isAnonymous
      };
      
      // Добавляем специфичные для типа отчета данные
      if (reportType === 'symptom') {
        // Для симптомов используем первый выбранный симптом как основной
        reportData.symptom = formData.symptoms[0]; // Берем первый симптом как основной
        
        // Преобразуем массив симптомов в строку, если их несколько
        if (formData.symptoms.length > 1) {
          reportData.note = (reportData.note ? reportData.note + ". " : "") + 
                           "Дополнительные симптомы: " + formData.symptoms.slice(1).join(", ");
        }
        
        // Устанавливаем аллерген по умолчанию для симптомов
        reportData.allergen = "general";
      } else if (reportType === 'plant') {
        reportData.plantType = formData.plantType;
        reportData.plantId = formData.plantId;
        reportData.allergen = formData.plantType.toLowerCase();
      }
      
      console.log('Отправка отчета с данными:', reportData);
      
      // Отправляем отчет
      const createdReport = await reportsService.createReport(reportData);
      console.log('Получен ответ от сервера:', createdReport);
      
      // Добавляем отчет в состояние
      if (createdReport) {
        addReport(createdReport);
        
        setSnackbar({
          open: true,
          message: 'Ваш отчет успешно отправлен! Спасибо за помощь в мониторинге аллергии.',
          severity: 'success'
        });
        
        // Сбрасываем форму
        setFormData({
          type: 'symptom',
          symptom: '',
          symptoms: [],
          plantType: '',
          severity: 3,
          allergen: '',
          note: '',
          isAnonymous: !isAuthenticated
        });
        
        // Закрываем форму с задержкой
        setTimeout(() => {
          toggleReportForm(false);
        }, 800);
      }
    } catch (error) {
      console.error('Ошибка при отправке отчета:', error);
      
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при отправке отчета. Пожалуйста, попробуйте еще раз.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Метки для слайдера интенсивности
  const severityMarks = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ];

  // Функция для проверки стилей и отладки
  const inspectSelectElement = () => {
    if (selectRef.current) {
      console.log('Элемент Select:', selectRef.current);
      const computedStyle = window.getComputedStyle(selectRef.current);
      console.log('Вычисленные стили для Select:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        opacity: computedStyle.opacity,
        pointerEvents: computedStyle.pointerEvents
      });
    } else {
      console.log('Select ref не доступен');
    }
  };

  // Тестовая функция для открытия выпадающего списка программно
  const forceOpenSelect = () => {
    console.log('Пытаемся программно открыть выпадающий список');
    if (selectRef.current) {
      try {
        // Пытаемся программно активировать элемент
        selectRef.current.click();
        selectRef.current.focus();
        console.log('Фокус установлен на Select');
      } catch (e) {
        console.error('Ошибка при программном открытии списка:', e);
      }
    }
  };

  // Проверяем стили после монтирования
  useEffect(() => {
    setTimeout(() => {
      inspectSelectElement();
    }, 500);
  }, []);

  // Отладка открытия Select
  const handleSelectFocus = (e) => {
    console.log('Select получил фокус:', e);
  };

  const handleSelectClick = (e) => {
    console.log('Click на Select:', e);
  };

  return (
    <>
      <Dialog 
        open={true} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        sx={{
          zIndex: 1300,
          '& .MuiDialog-paper': {
            borderRadius: 2,
            border: '3px solid #1976d2',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            backgroundColor: 'white',
            opacity: 1
          }
        }}
        disablePortal={true}
      >
        <DialogTitle>
          Добавить отчет
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                value={reportType}
                onChange={handleTypeChange}
              >
                <FormControlLabel value="symptom" control={<Radio />} label="Симптом" />
                <FormControlLabel value="plant" control={<Radio />} label="Растение" />
              </RadioGroup>
            </FormControl>

            {reportType === 'symptom' ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Симптомы *
                </Typography>
                
                <Autocomplete
                  multiple
                  options={symptoms}
                  value={formData.symptoms}
                  onChange={(event, newValue) => {
                    setFormData({
                      ...formData,
                      symptoms: newValue
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Выберите симптомы"
                      error={formData.symptoms.length === 0 && formData.type === 'symptom'}
                      helperText={formData.symptoms.length === 0 && formData.type === 'symptom' ? "Выберите хотя бы один симптом" : ""}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Checkbox
                        checked={formData.symptoms.indexOf(option) > -1}
                        sx={{ mr: 1 }}
                      />
                      {option}
                    </li>
                  )}
                  PopperProps={{
                    sx: {
                      zIndex: 1400
                    }
                  }}
                />
              </FormControl>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Тип растения *
                </Typography>
                
                <Select
                  value={formData.plantType}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const selectedPlant = plants.find(p => p.name === selectedValue);
                    console.log('Выбранное растение:', selectedPlant);
                    
                    setFormData({
                      ...formData,
                      plantType: selectedValue,
                      plantId: selectedPlant?.id || null,
                      plantObj: selectedPlant || null
                    });
                  }}
                  required
                  displayEmpty
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        zIndex: 1400
                      }
                    }
                  }}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1.5
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    -- Выберите растение --
                  </MenuItem>
                  {plants.map((plant) => (
                    <MenuItem key={plant.id} value={plant.name}>
                      {plant.name}
                    </MenuItem>
                  ))}
                </Select>
                
                {plants.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    Не удалось загрузить список растений. Пожалуйста, повторите попытку позже.
                  </Typography>
                )}
                {reportType === 'plant' && !isAdmin && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Ваш отчет о растении будет отправлен на модерацию и появится на карте после проверки администратором.
                  </Typography>
                )}
              </FormControl>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                {reportType === 'symptom' ? 'Тяжесть симптомов' : 'Интенсивность пыльцы'} (от 1 до 5)
              </Typography>
              <Slider
                value={formData.severity}
                onChange={(e, value) => setFormData({ ...formData, severity: value })}
                valueLabelDisplay="auto"
                step={1}
                marks={severityMarks}
                min={1}
                max={5}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Дополнительное описание"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ReportForm; 