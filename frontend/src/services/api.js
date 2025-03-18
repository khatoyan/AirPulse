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
    try {
      const { data } = await api.get('/weather/current', {
        params: { lat, lon }
      });
      
      // Нормализуем данные о погоде для фронтенда
      const normalizedData = {
        temperature: data.main?.temp,
        humidity: data.main?.humidity,
        windSpeed: data.wind?.speed,
        windDirection: data.wind?.deg,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        // Сохраняем исходные данные на всякий случай
        ...data
      };
      
      return normalizedData;
    } catch (error) {
      console.error('Ошибка при получении погодных данных:', error);
      // Возвращаем базовую структуру в случае ошибки
      return {
        temperature: null,
        humidity: null,
        windSpeed: null,
        windDirection: null,
        description: 'Нет данных',
        error: true
      };
    }
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
      
      // Нормализуем данные прогноза в единый формат
      const normalizedForecast = data.map(item => {
        // Создаем временную метку в формате "DD.MM, HH:MM" и форматируем полную метку
        const dt = item.dt || (typeof item.time === 'string' ? Date.parse(item.time) / 1000 : item.time);
        const date = new Date(dt * 1000);
        
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        const timeLabel = `${hours}:${minutes}`;
        const hourLabel = `${hours}:00`;
        const dateLabel = `${day}.${month}`;
        
        // Полная метка включает дату, время и температуру
        const temp = item.temp || item.temperature || 0;
        const fullLabel = `${dateLabel}, ${timeLabel} | ${temp.toFixed(1)}°C`;
        
        return {
          dt,
          time: item.time,
          timeLabel,
          hourLabel,
          dateLabel,
          fullLabel,
          temp: temp,
          humidity: item.humidity || 0,
          wind_speed: item.wind_speed || item.windSpeed || 0,
          wind_deg: item.wind_deg || item.windDirection || 0
        };
      });
      
      console.log(`Получен прогноз на ${normalizedForecast.length} часов`);
      return normalizedForecast;
    } catch (error) {
      console.error('Ошибка при получении прогноза погоды:', error);
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }
}; 