import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
    
    try {
      const data = await reportsService.getAllReports();
      setOriginalReports(data); // Сохраняем оригинальные отчеты
      setLastUpdate(Date.now()); // Обновляем время последней загрузки
    } catch (error) {
      console.error('Ошибка при загрузке отчетов:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Мемоизированная функция загрузки погоды
  const fetchWeather = useCallback(async () => {
    try {
      const data = await weatherService.getCurrentWeather(55.0084, 82.9357);
      setWeatherData(data);
    } catch (error) {
      console.error('Ошибка при загрузке погодных данных:', error);
    }
  }, [setWeatherData]);

  // Мемоизированный обработчик создания нового отчета
  const handleReportCreated = useCallback(() => {
    console.log('Обнаружено создание нового отчета, обновляем данные...');
    setTimeout(fetchReports, 1000); // Небольшая задержка для завершения транзакции на бэкенде
  }, [fetchReports]);

  // Обрабатываем данные о пыльце с учетом погоды
  const processReports = useCallback(() => {
    if (originalReports.length === 0) return;
    
    console.log('Обрабатываем отчеты и учитываем погодные данные...');
    
    // Фильтруем только подтвержденные отчеты и симптомы
    const approvedReports = originalReports.filter(report => 
      report.approved
    );
    
    if (weatherData && weatherData.windSpeed) {
      console.log('Применяем модель гауссовского распределения с учетом ветра:', weatherData);
      
      // Рассчитываем распространение пыльцы с учетом ветра по математической модели
      const dispersedReports = calculatePollenDispersion(
        approvedReports,
        weatherData.windSpeed,
        weatherData.windDirection
      );
      
      console.log(`Сгенерировано ${dispersedReports.length} рассчетных точек распространения пыльцы`);
      
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
    fetchReports();
    fetchWeather();
    
    // Добавляем обработчик события создания отчета
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
  }, [fetchReports, fetchWeather, handleReportCreated]);

  // Обработка отчетов при изменении исходных данных или погоды
  useEffect(() => {
    processReports();
  }, [originalReports, weatherData, processReports]);

  // Мемоизированные данные для отображения
  const updateTimeString = useMemo(() => {
    if (lastUpdate === 0) return 'Загрузка данных...';
    return new Date(lastUpdate).toLocaleTimeString();
  }, [lastUpdate]);

  return (
    <>
      <Header />
      <main className="app-main">
        <Map />
        {/* Можно добавить время последнего обновления, если нужно */}
        {/* <div className="update-info">Обновлено: {updateTimeString}</div> */}
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
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
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
