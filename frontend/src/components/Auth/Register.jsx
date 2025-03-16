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
    setFormData(prevData => {
      const types = [...prevData.allergyTypes];
      const index = types.indexOf(type);
      
      if (index === -1) {
        types.push(type);
      } else {
        types.splice(index, 1);
      }
      
      // Очищаем ошибку, если есть выбранные типы
      if (types.length > 0 && errors.allergyTypes) {
        setErrors(prev => ({ ...prev, allergyTypes: '' }));
      }
      
      return { ...prevData, allergyTypes: types };
    });
  };

  const handleAllergyLevelChange = (e, newValue) => {
    setFormData(prev => ({ ...prev, allergyLevel: newValue }));
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
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну заглавную букву';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну цифру';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (!formData.name) {
      newErrors.name = 'Имя обязательно';
    }
    
    // Если пользователь указал, что у него есть аллергия, проверяем, выбраны ли типы
    if (formData.hasAllergy && formData.allergyTypes.length === 0) {
      newErrors.allergyTypes = 'Выберите хотя бы один тип аллергии';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем форму перед отправкой
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Подготавливаем данные для отправки
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        hasAllergy: formData.hasAllergy
      };
      
      // Если у пользователя есть аллергия, добавляем соответствующие поля
      if (formData.hasAllergy) {
        userData.allergyTypes = formData.allergyTypes;
        userData.allergyLevel = formData.allergyLevel;
      }
      
      // Отправляем запрос на регистрацию
      const response = await authService.register(userData);
      
      // Показываем уведомление об успешной регистрации
      setNotification({
        open: true,
        message: 'Регистрация успешна! Выполняется вход...',
        severity: 'success'
      });
      
      // Автоматически выполняем вход с зарегистрированными учетными данными
      setTimeout(async () => {
        await login({
          email: formData.email,
          password: formData.password
        });
        
        // Перенаправляем на главную страницу
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      
      // Показываем уведомление об ошибке
      setNotification({
        open: true,
        message: error.response?.data?.error || 'Ошибка при регистрации. Попробуйте снова.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Закрытие уведомления
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
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