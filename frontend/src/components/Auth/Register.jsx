import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  FormControlLabel, 
  Checkbox,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Slider,
  Chip,
  Grid,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const allergyTypeOptions = [
  'Пыльца деревьев',
  'Пыльца трав',
  'Пыльца сорняков',
  'Пыльца злаков',
  'Грибковые споры',
  'Другое'
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  // Основные данные для формы
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    hasAllergy: false,
    allergyTypes: [],
    allergyLevel: 3
  });
  
  // Состояния UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Обработчики изменения полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Очищаем ошибки при изменении поля
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleAllergyChange = (e) => {
    setFormData({ ...formData, hasAllergy: e.target.checked });
  };

  const handleAllergyTypeToggle = (type) => {
    const updatedTypes = formData.allergyTypes.includes(type)
      ? formData.allergyTypes.filter(t => t !== type)
      : [...formData.allergyTypes, type];
    
    setFormData({ ...formData, allergyTypes: updatedTypes });
  };

  const handleAllergyLevelChange = (e, newValue) => {
    setFormData({ ...formData, allergyLevel: newValue });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (!formData.name) {
      newErrors.name = 'Имя обязательно';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Подготавливаем данные для отправки
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        hasAllergy: formData.hasAllergy,
        allergyTypes: formData.hasAllergy ? formData.allergyTypes : [],
        allergyLevel: formData.hasAllergy ? formData.allergyLevel : null
      };
      
      // Отправляем запрос на регистрацию
      const response = await authService.register(registrationData);
      
      // Логируем ответ для отладки
      console.log('Ответ от сервера при регистрации:', response);

      // Проверяем структуру ответа
      if (!response || !response.token) {
        throw new Error('Некорректный ответ от сервера после регистрации: нет токена');
      }

      // Обновляем состояние аутентификации
      console.log('Ответ от сервера при регистрации:', {
        token: typeof response.token === 'string' 
          ? `${response.token.substring(0, 20)}...` 
          : JSON.stringify(response.token),
        user: response.user
      });

      // Инициируем вход - исправляем здесь, передаем учетные данные
      await login({
        email: formData.email,
        password: formData.password
      });
      
      setNotification({
        open: true,
        message: 'Регистрация успешна! Перенаправляем вас...',
        severity: 'success'
      });
      
      // Перенаправляем на главную страницу после короткой задержки
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      
      // Получаем более подробную информацию об ошибке
      let errorMessage = 'Произошла ошибка при регистрации';
      
      if (error.response) {
        // Ошибка от сервера с ответом
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || errorMessage;
        console.log('Детали ошибки:', serverError);
      } else if (error.request) {
        // Запрос был сделан, но ответ не получен
        errorMessage = 'Сервер не отвечает. Пожалуйста, попробуйте позже.';
      } else {
        // Что-то пошло не так при настройке запроса
        errorMessage = error.message || errorMessage;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Регистрация
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Основная информация */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Имя"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                required
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="Пароль"
                fullWidth
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="confirmPassword"
                label="Подтвердите пароль"
                fullWidth
                required
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            {/* Информация об аллергии */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasAllergy}
                    onChange={handleAllergyChange}
                    name="hasAllergy"
                    color="primary"
                  />
                }
                label="У меня есть аллергия на пыльцу"
              />
            </Grid>
            
            {formData.hasAllergy && (
              <>
                <Grid item xs={12}>
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <FormLabel component="legend">Типы аллергенов</FormLabel>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {allergyTypeOptions.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          onClick={() => handleAllergyTypeToggle(type)}
                          color={formData.allergyTypes.includes(type) ? "primary" : "default"}
                          variant={formData.allergyTypes.includes(type) ? "filled" : "outlined"}
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Уровень чувствительности к аллергенам
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={formData.allergyLevel}
                      onChange={handleAllergyLevelChange}
                      min={1}
                      max={5}
                      step={1}
                      marks={[
                        { value: 1, label: 'Низкий' },
                        { value: 2, label: '2' },
                        { value: 3, label: 'Средний' },
                        { value: 4, label: '4' },
                        { value: 5, label: 'Высокий' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? 'Создание аккаунта...' : 'Зарегистрироваться'}
              </Button>
            </Grid>
            
            <Grid item xs={12} textAlign="center">
              <Typography variant="body2">
                Уже есть аккаунт?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Войти
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Register; 