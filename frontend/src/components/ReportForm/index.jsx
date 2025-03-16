import { useState, useEffect } from 'react';
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
  Chip
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

function ReportForm({ open, onClose, location }) {
  const { reports, setReports } = useMapStore();
  const { isAuthenticated, isAdmin, getAuthHeader } = useAuthStore();
  const [reportType, setReportType] = useState('symptom');
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'symptom',
    symptom: '',
    symptoms: [],
    plantType: '',
    severity: 3,
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Загрузка списка растений
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await plantsService.getAllPlants();
        console.log('Загруженные растения:', data);
        setPlants(data);
      } catch (error) {
        console.error('Ошибка при загрузке растений:', error);
        setSnackbar({
          open: true,
          message: 'Не удалось загрузить список растений',
          severity: 'error'
        });
      }
    };
    
    fetchPlants();
  }, []);

  const handleTypeChange = (event) => {
    const type = event.target.value;
    setReportType(type);
    setFormData({ ...formData, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Проверка на выбор растения
      if (reportType === 'plant' && !formData.plantId) {
        setSnackbar({
          open: true,
          message: 'Выберите растение из списка',
          severity: 'error'
        });
        setLoading(false);
        return;
      }

      // Проверка на выбор симптома/симптомов
      if (reportType === 'symptom' && formData.symptoms.length === 0) {
        setSnackbar({
          open: true,
          message: 'Выберите хотя бы один симптом из списка',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Подготовка отчета с учетом модерации
      const report = {
        ...location,
        ...formData,
        symptom: formData.symptoms.length > 0 ? formData.symptoms.join(', ') : formData.symptom,
        severity: Number(formData.severity),
        createdAt: new Date().toISOString(),
      };

      console.log('Отправляем отчет:', report);

      // Если пользователь авторизован, используем его токен
      const authHeader = isAuthenticated ? getAuthHeader() : null;
      
      // Проверяем наличие токена
      if (!authHeader) {
        setSnackbar({
          open: true,
          message: 'Необходимо авторизоваться для отправки отчета',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Отправляем отчет в API
      const newReport = await reportsService.createReport(report);
      
      // Показываем разные сообщения в зависимости от типа отчета
      if (reportType === 'plant' && !isAdmin) {
        setSnackbar({
          open: true,
          message: 'Отчет отправлен на модерацию и появится на карте после проверки администратором',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Отчет успешно добавлен и отображается на карте',
          severity: 'success'
        });
      }
      
      // Оповещаем о создании отчета для обновления данных
      window.dispatchEvent(new CustomEvent('report_created'));
      
      onClose();
    } catch (error) {
      console.error('Ошибка при добавлении отчета:', error);
      let errorMessage = 'Ошибка при добавлении отчета';
      
      // Пытаемся получить более детальную информацию об ошибке
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить отчет</DialogTitle>
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
                <Autocomplete
                  multiple
                  id="symptoms-autocomplete"
                  options={symptoms}
                  value={formData.symptoms}
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      symptoms: newValue
                    });
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Симптомы"
                      placeholder="Выберите симптомы"
                      required
                    />
                  )}
                />
              </FormControl>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Autocomplete
                  id="plant-autocomplete"
                  options={plants}
                  getOptionLabel={(option) => option?.name || ''}
                  isOptionEqualToValue={(option, value) => {
                    // Проверяем, что оба объекта существуют и у них есть id
                    if (!option || !value) return false;
                    return option.id === value.id;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Тип растения"
                      required
                      error={plants.length === 0}
                      helperText={plants.length === 0 ? 'Не удалось загрузить список растений' : ''}
                    />
                  )}
                  onChange={(_, newValue) => {
                    console.log('Выбранное растение:', newValue);
                    setFormData({
                      ...formData,
                      plantType: newValue?.name || '',
                      plantId: newValue?.id || null
                    });
                  }}
                  loading={plants.length === 0}
                  loadingText="Загрузка растений..."
                  noOptionsText="Растения не найдены"
                />
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
              value={formData.description}
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