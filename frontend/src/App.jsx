import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainApp from './components/MainApp';
import AdminPanel from './components/Admin/AdminPanel';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { useAuthStore } from './stores/authStore';
import { CircularProgress, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import InfoPage from './components/InfoPage';
import AllergyInfoTab from './components/InfoPage/AllergyInfoTab';
import AsthmaInfoTab from './components/InfoPage/AsthmaInfoTab';
import AllergyTestTab from './components/InfoPage/AllergyTestTab';
import FAQTab from './components/InfoPage/FAQTab';
import FloweringCalendar from './components/InfoPage/FloweringCalendar';
import Header from './components/Header';
import Footer from './components/Footer';

// Основной компонент приложения с маршрутизацией
function App() {
  const { isAuthenticated, isAdmin, checkAuth, isLoading } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

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
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        className="App"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Header />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MainApp />} />
            <Route path="/calendar" element={<FloweringCalendar />} />
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
            <Route path="/info/*" element={<InfoPage />}>
              <Route index element={<AllergyInfoTab />} />
              <Route path="allergy" element={<AllergyInfoTab />} />
              <Route path="asthma" element={<AsthmaInfoTab />} />
              <Route path="test" element={<AllergyTestTab />} />
              <Route path="faq" element={<FAQTab />} />
              <Route path="calendar" element={<FloweringCalendar />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
