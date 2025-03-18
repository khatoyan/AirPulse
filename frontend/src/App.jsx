import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
      <div className="app" role="main">
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
