import { toast } from 'react-toastify';

// Утилитарная функция для получения заголовка авторизации из стора
export const getAuthHeader = () => {
  // Получаем данные аутентификации из localStorage
  try {
    const authData = localStorage.getItem('auth-storage');
    if (!authData) return null;
    
    const { state } = JSON.parse(authData);
    if (!state || !state.token) return null;
    
    return { Authorization: `Bearer ${state.token}` };
  } catch (error) {
    console.error('Ошибка при получении токена аутентификации:', error);
    return null;
  }
};

// Проверка срока действия токена
export const isTokenExpired = (token) => {
  try {
    // Получаем payload из JWT токена
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Проверяем срок действия
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Ошибка при проверке срока действия токена:', error);
    return true; // В случае ошибки считаем токен истекшим
  }
};

// Функция для проверки и добавления заголовка авторизации
export const withAuth = (config = {}) => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    // Если нет авторизации, но она требуется для запроса
    toast.error('Необходимо авторизоваться для выполнения данного запроса');
    return Promise.reject(new Error('Требуется авторизация'));
  }
  
  return { 
    ...config, 
    headers: { 
      ...config.headers,
      ...authHeader 
    } 
  };
};

// Настройка перехватчика запросов
export const setupRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      // Добавляем заголовок авторизации к запросу, если доступен
      const authHeader = getAuthHeader();
      if (authHeader) {
        // Проверяем срок действия токена
        const token = authHeader.Authorization.split(' ')[1];
        if (isTokenExpired(token)) {
          // Если токен истек, выходим из системы
          localStorage.removeItem('auth-storage');
          // Перезагружаем страницу для обновления состояния
          window.location.reload();
          return Promise.reject(new Error('Срок действия сессии истек. Пожалуйста, войдите снова.'));
        }
        config.headers = { ...config.headers, ...authHeader };
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Настройка перехватчика ответов
export const setupResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Стандартизированное сообщение об ошибке
      let errorMessage = 'Произошла ошибка при обработке запроса';
      
      // Если есть ответ сервера с сообщением об ошибке
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Обрабатываем особые коды ошибок
      if (error.response) {
        switch (error.response.status) {
          case 401:
            // Неавторизованный доступ
            localStorage.removeItem('auth-storage');
            toast.error('Сессия истекла. Пожалуйста, войдите снова');
            // Перенаправляем на страницу входа, если не там
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            break;
          case 403:
            // Запрещенный доступ
            toast.error('У вас нет прав на выполнение этой операции');
            break;
          case 404:
            // Ресурс не найден
            toast.error('Запрашиваемый ресурс не найден');
            break;
          case 500:
            // Ошибка сервера
            toast.error('Ошибка сервера. Пожалуйста, попробуйте позже');
            break;
          default:
            // Другие ошибки
            toast.error(errorMessage);
        }
      } else {
        // Сетевая ошибка или другая проблема
        toast.error(`Ошибка сети: ${errorMessage}`);
      }
      
      return Promise.reject(error);
    }
  );
}; 