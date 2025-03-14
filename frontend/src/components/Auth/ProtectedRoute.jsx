import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Компонент для защиты маршрутов, требующих аутентификации
function ProtectedRoute({ children, isAllowed, redirectPath = '/login' }) {
  const location = useLocation();

  // Если пользователь не авторизован или не имеет прав, перенаправляем на страницу входа
  // и сохраняем текущий URL для возврата после входа
  if (!isAllowed) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute; 