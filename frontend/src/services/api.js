import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Сервис аутентификации
export const authService = {
  // Вход в систему
  login: async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      console.log('Ответ login API:', data);
      return data;
    } catch (error) {
      console.error('Ошибка при входе в API:', error);
      throw error;
    }
  },
  
  // Проверка текущего пользователя
  getCurrentUser: async (authHeader) => {
    const { data } = await api.get('/auth/me', { headers: authHeader });
    return data;
  },

  // Регистрация нового пользователя
  register: async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      console.log('Ответ register API:', data);
      return data;
    } catch (error) {
      console.error('Ошибка при регистрации в API:', error);
      throw error;
    }
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
  createReport: async (report, authHeader = null) => {
    // Если передан authHeader, добавляем его в запрос
    const options = authHeader ? { headers: authHeader } : {};
    const { data } = await api.post('/reports', report, options);
    return data;
  },

  // Получить отчеты в зоне
  getReportsInZone: async (lat, lng, radius) => {
    const { data } = await api.get('/reports/zone', {
      params: { lat, lng, radius }
    });
    return data;
  },
  
  // Получить отчеты, ожидающие модерации (только для админов)
  getPendingReports: async (authHeader) => {
    const { data } = await api.get('/reports/pending', {
      headers: authHeader
    });
    return data;
  },
  
  // Одобрить отчет (только для админов)
  approveReport: async (reportId, authHeader) => {
    const { data } = await api.put(`/reports/${reportId}/approve`, {}, {
      headers: authHeader
    });
    return data;
  },
  
  // Отклонить отчет (только для админов)
  rejectReport: async (reportId, rejectData, authHeader) => {
    const { data } = await api.put(`/reports/${reportId}/reject`, rejectData, {
      headers: authHeader
    });
    return data;
  },
  
  // Получить статистику по отчетам (только для админов)
  getReportsStats: async (authHeader) => {
    const { data } = await api.get('/reports/stats', {
      headers: authHeader
    });
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

  // Создать новую зону
  createZone: async (zone) => {
    const { data } = await api.post('/zones', zone);
    return data;
  },

  // Обновить индекс зоны
  updateZoneIndex: async (id, index) => {
    const { data } = await api.patch(`/zones/${id}/index`, { index });
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
  createPlant: async (plantData, authHeader) => {
    const { data } = await api.post('/plants', plantData, {
      headers: authHeader
    });
    return data;
  },
  
  // Обновить растение (только для админов)
  updatePlant: async (id, plantData, authHeader) => {
    const { data } = await api.put(`/plants/${id}`, plantData, {
      headers: authHeader
    });
    return data;
  },
  
  // Удалить растение (только для админов)
  deletePlant: async (id, authHeader) => {
    const { data } = await api.delete(`/plants/${id}`, {
      headers: authHeader
    });
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