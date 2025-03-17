import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  setupRequestInterceptor, 
  setupResponseInterceptor, 
  getAuthHeader, 
  withAuth 
} from './interceptors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Настраиваем перехватчики
setupRequestInterceptor(api);
setupResponseInterceptor(api);

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
  // Получить текущую погоду
  getCurrentWeather: async (lat, lon) => {
    const { data } = await api.get('/weather/current', {
      params: { lat, lon }
    });
    return data;
  },
  
  // Получить прогноз погоды на 24 часа
  getHourlyForecast: async (lat, lon) => {
    try {
      console.log(`Запрос прогноза погоды для координат: ${lat}, ${lon}`);
      
      const { data } = await api.get('/weather/forecast', {
        params: { lat, lon }
      });
      
      if (!data || !Array.isArray(data)) {
        console.error('Получены некорректные данные прогноза:', data);
        return [];
      }
      
      console.log(`Получен прогноз на ${data.length} часов`);
      return data;
    } catch (error) {
      console.error('Ошибка при получении прогноза погоды:', error);
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }
}; 