import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Утилитарная функция для получения заголовка авторизации из стора
const getAuthHeader = () => {
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

// Добавляем функцию проверки срока действия токена
const isTokenExpired = (token) => {
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

// Добавляем обработчик перехватчиков запросов и ответов
api.interceptors.request.use(
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

// Добавляем обработчик ответов для единой обработки ошибок
api.interceptors.response.use(
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

// Функция для проверки и добавления заголовка авторизации
const withAuth = (config = {}) => {
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

// Сервис аутентификации
export const authService = {
  // Вход в систему
  login: async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    } catch (error) {
      throw error; // теперь перехватывается интерцептором
    }
  },
  
  // Проверка текущего пользователя
  getCurrentUser: async (authHeader) => {
    // Если передан внешний заголовок авторизации, используем его
    // иначе берем из хранилища
    const headers = authHeader || getAuthHeader();
    if (!headers) {
      throw new Error('Требуется авторизация');
    }
    
    const { data } = await api.get('/auth/me', { headers });
    return data;
  },

  // Регистрация нового пользователя
  register: async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      return data;
    } catch (error) {
      throw error; // теперь перехватывается интерцептором
    }
  },
  
  // Обновление профиля пользователя
  updateProfile: async (userData) => {
    const config = withAuth();
    const { data } = await api.put('/auth/profile', userData, config);
    return data;
  },
  
  // Изменение пароля
  changePassword: async (passwordData) => {
    const config = withAuth();
    const { data } = await api.put('/auth/password', passwordData, config);
    toast.success('Пароль успешно изменен');
    return data;
  }
};

// Сервис отчетов
export const reportsService = {
  // Получить все одобренные отчеты
  getAllReports: async () => {
    const { data } = await api.get('/reports');
    return data;
  },

  // Создать новый отчет
  createReport: async (report) => {
    try {
      // Проверяем, авторизован ли пользователь
      const authHeader = getAuthHeader();
      const options = authHeader ? { headers: authHeader } : {};
      
      const { data } = await api.post('/reports', report, options);
      
      // Показываем уведомление об успешном создании отчета
      toast.success('Отчет успешно создан и отправлен на модерацию');
      
      return data;
    } catch (error) {
      // Обрабатывается интерцептором
      throw error;
    }
  },

  // Получить отчеты в зоне
  getReportsInZone: async (lat, lng, radius) => {
    const { data } = await api.get('/reports/zone', {
      params: { lat, lng, radius }
    });
    return data;
  },
  
  // Получить отчеты, ожидающие модерации (только для админов)
  getPendingReports: async () => {
    const config = withAuth();
    const { data } = await api.get('/reports/pending', config);
    return data;
  },
  
  // Одобрить отчет (только для админов)
  approveReport: async (reportId) => {
    const config = withAuth();
    const { data } = await api.put(`/reports/${reportId}/approve`, {}, config);
    toast.success('Отчет успешно одобрен');
    return data;
  },
  
  // Отклонить отчет (только для админов)
  rejectReport: async (reportId, rejectData) => {
    const config = withAuth();
    const { data } = await api.put(`/reports/${reportId}/reject`, rejectData, config);
    toast.info('Отчет отклонен');
    return data;
  },
  
  // Получить статистику по отчетам (только для админов)
  getReportsStats: async () => {
    const config = withAuth();
    const { data } = await api.get('/reports/stats', config);
    return data;
  }
};

// Сервис зон
export const zonesService = {
  // Получить все зоны
  getAllZones: async () => {
    const { data } = await api.get('/zones');
    return data;
  },

  // Создать новую зону (только для админов)
  createZone: async (zone) => {
    const config = withAuth();
    const { data } = await api.post('/zones', zone, config);
    toast.success('Зона успешно создана');
    return data;
  },

  // Обновить индекс зоны (только для админов)
  updateZoneIndex: async (id, index) => {
    const config = withAuth();
    const { data } = await api.patch(`/zones/${id}/index`, { index }, config);
    toast.success('Индекс зоны обновлен');
    return data;
  }
};

// Сервис растений
export const plantsService = {
  // Получить все растения
  getAllPlants: async () => {
    const { data } = await api.get('/plants');
    return data;
  },
  
  // Получить одно растение по ID
  getPlantById: async (id) => {
    const { data } = await api.get(`/plants/${id}`);
    return data;
  },
  
  // Создать новое растение (только для админов)
  createPlant: async (plantData) => {
    const config = withAuth();
    const { data } = await api.post('/plants', plantData, config);
    toast.success('Растение успешно добавлено');
    return data;
  },
  
  // Обновить растение (только для админов)
  updatePlant: async (id, plantData) => {
    const config = withAuth();
    const { data } = await api.put(`/plants/${id}`, plantData, config);
    toast.success('Данные о растении обновлены');
    return data;
  },
  
  // Удалить растение (только для админов)
  deletePlant: async (id) => {
    const config = withAuth();
    const { data } = await api.delete(`/plants/${id}`, config);
    toast.success('Растение удалено');
    return data;
  }
};

// Сервис погоды
export const weatherService = {
  // Получить текущие погодные данные
  getCurrentWeather: async (lat, lon) => {
    const { data } = await api.get('/weather/current', {
      params: { lat, lon }
    });
    return data;
  },

  // Получить последние погодные данные
  getLatestWeather: async () => {
    const { data } = await api.get('/weather/latest');
    return data;
  }
}; 