import { create } from 'zustand';
import { authService } from '../services/api';

export const useAuthStore = create((set, get) => ({
  // Состояние
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: false,
  isLoading: false,
  error: null,

  // Действия
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
    // Добавляем логирование для входящих данных
    console.log('Вызов login с данными:', JSON.stringify(credentials, null, 2));
    
    try {
      const response = await authService.login(credentials);
      
      // Дополнительная проверка и логирование для отладки
      console.log('Ответ с сервера:', response);
      
      if (!response || !response.token) {
        throw new Error('Получен некорректный ответ от сервера: отсутствует токен');
      }
      
      // Убедимся, что токен - это строка
      const token = typeof response.token === 'string' 
        ? response.token 
        : JSON.stringify(response.token);
      
      localStorage.setItem('token', token);
      set({
        user: response.user,
        token,
        isAuthenticated: true,
        isAdmin: response.user.role === 'admin',
        isLoading: false
      });
      return true;
    } catch (error) {
      console.error('Ошибка входа:', error);
      set({
        error: error.response?.data?.error || 'Ошибка входа в систему',
        isLoading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false
    });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return false;

    set({ isLoading: true });
    try {
      const authHeader = { Authorization: `Bearer ${token}` };
      const user = await authService.getCurrentUser(authHeader);
      
      // Проверяем, есть ли новый токен из-за изменения роли
      if (user.newToken) {
        console.log('Получен новый токен из-за изменения роли');
        localStorage.setItem('token', user.newToken);
        // Удаляем свойство newToken из объекта user перед сохранением
        const { newToken, ...userWithoutToken } = user;
        set({
          user: userWithoutToken,
          token: user.newToken,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
          isLoading: false
        });
      } else {
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
          isLoading: false
        });
      }
      return true;
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      // Если токен недействителен, выходим из системы
      get().logout();
      set({ isLoading: false });
      return false;
    }
  },

  // Получить заголовок авторизации для запросов
  getAuthHeader: () => {
    const token = get().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Сбросить ошибку
  clearError: () => set({ error: null })
})); 