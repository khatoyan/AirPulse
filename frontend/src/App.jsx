import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Map from './components/Map';
import AdminPanel from './components/Admin/AdminPanel';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Header from './components/Header';
import Footer from './components/Footer';
import { useMapStore } from './stores/mapStore';
import { reportsService, weatherService } from './services/api';
import { calculatePollenDispersion } from './utils/pollenDispersion';
import { useAuthStore } from './stores/authStore';
import { CircularProgress, Box } from '@mui/material';
import './App.css';

// Основной компонент отображения карты и погоды
function MainApp() {
  const { setReports, setWeatherData, weatherData } = useMapStore();
  const [originalReports, setOriginalReports] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const isProcessingRef = useRef(false);

  // Создаем мемоизированную функцию для получения отчетов
  const fetchReports = useCallback(async () => {
    // Предотвращаем параллельные вызовы
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    console.log('Загружаем отчеты...');
    
    try {
      const data = await reportsService.getAllReports();
      console.log('Получено отчетов:', data.length);
      setOriginalReports(data); // Сохраняем оригинальные отчеты
      setLastUpdate(Date.now()); // Обновляем время последней загрузки
    } catch (error) {
      console.error('Ошибка при загрузке отчетов:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Обрабатываем данные о пыльце с учетом погоды
  const processReports = useCallback(() => {
    if (originalReports.length === 0) return;
    
    console.log('Обрабатываем отчеты...');
    
    // Фильтруем только подтвержденные отчеты и симптомы
    const approvedReports = originalReports.filter(report => 
      report.approved
    );
    
    if (weatherData && weatherData.windSpeed) {
      // Рассчитываем распространение пыльцы с учетом ветра
      console.log('Учитываем погоду:', weatherData);
      const dispersedReports = calculatePollenDispersion(
        approvedReports,
        weatherData.windSpeed,
        weatherData.windDirection
      );
      
      // Обновляем отчеты с учетом разнесения пыльцы
      setReports([...approvedReports, ...dispersedReports]);
    } else {
      // Если нет данных о погоде, просто отображаем исходные отчеты
      console.log('Нет данных о погоде, используем только исходные отчеты');
      setReports([...approvedReports]);
    }
  }, [originalReports, weatherData, setReports]);

  // Загрузка отчетов и погодных данных при монтировании
  useEffect(() => {
    // Загрузка погодных данных
    const fetchWeather = async () => {
      try {
        const data = await weatherService.getCurrentWeather(55.0084, 82.9357);
        setWeatherData(data);
      } catch (error) {
        console.error('Ошибка при загрузке погодных данных:', error);
      }
    };

    fetchReports();
    fetchWeather();
    
    // Добавляем обработчик события создания отчета
    const handleReportCreated = () => {
      console.log('Обнаружено создание нового отчета, обновляем данные...');
      setTimeout(fetchReports, 1000); // Небольшая задержка для завершения транзакции на бэкенде
    };
    
    window.addEventListener('report_created', handleReportCreated);
    
    // Обновляем данные каждые 5 минут
    const reportsInterval = setInterval(fetchReports, 5 * 60 * 1000);
    // Обновляем погоду каждые 30 минут
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => {
      clearInterval(reportsInterval);
      clearInterval(weatherInterval);
      window.removeEventListener('report_created', handleReportCreated);
    };
  }, [fetchReports]);

  // Обработка отчетов при изменении исходных данных или погоды
  useEffect(() => {
    processReports();
  }, [originalReports, weatherData, processReports]);

  return (
    <>
      <Header />
      <main className="app-main">
        <Map />
      </main>
      <Footer />
    </>
  );
}

// Основной компонент приложения с маршрутизацией
function App() {
  const { isAuthenticated, isAdmin, checkAuth, isLoading } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setAuthChecked(true);
    };
    
    verifyAuth();
  }, [checkAuth]);

  // Показываем индикатор загрузки, пока проверяем аутентификацию
  if (isLoading || !authChecked) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute 
                isAllowed={isAuthenticated && isAdmin}
                redirectPath="/login"
              >
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
