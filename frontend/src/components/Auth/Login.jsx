import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box, Alert } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
  const { login, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем URL для перенаправления после входа
  const from = location.state?.from?.pathname || '/';
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении полей
    if (error) clearError();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(credentials);
    
    if (success) {
      // Перенаправляем пользователя
      navigate(from);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 3,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'white'
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Вход в AirPulse
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Электронная почта"
            name="email"
            autoComplete="email"
            autoFocus
            value={credentials.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Пароль"
            type="password"
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Для администрирования необходимы права администратора.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default Login; 