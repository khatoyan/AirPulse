import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

// Функция декодирования JWT токена без подтверждения подписи
const decodeToken = (token) => {
  try {
    // Разделяем JWT на части и берем payload часть (индекс 1)
    const payload = token.split('.')[1];
    // Декодируем из base64
    const decodedPayload = atob(payload);
    // Преобразуем JSON строку в объект
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Ошибка декодирования токена:', error);
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Состояние
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,

      // Действия
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(credentials);
          
          if (!response || !response.token) {
            throw new Error('Получен некорректный ответ от сервера: отсутствует токен');
          }
          
          // Убедимся, что токен - это строка
          const token = typeof response.token === 'string' 
            ? response.token 
            : JSON.stringify(response.token);
          
          set({
            user: response.user,
            token,
            isAuthenticated: true,
            isAdmin: response.user.role === 'admin',
            isLoading: false
          });
          
          // Показываем уведомление об успешном входе
          toast.success(`Добро пожаловать, ${response.user.name || response.user.email}!`);
          
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false
        });
        
        // Показываем уведомление о выходе
        toast.info('Вы вышли из системы');
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
              user: user,
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
        if (!token) {
          return null;
        }
        
        // Проверка срока действия токена
        try {
          const decodedToken = decodeToken(token);
          if (!decodedToken || !decodedToken.exp) {
            // Если токен не декодируется или в нем нет срока действия
            console.warn('Токен не содержит информации о сроке действия');
            return { Authorization: `Bearer ${token}` };
          }
          
          // Проверяем срок действия (exp хранится в секундах с начала эпохи)
          const now = Math.floor(Date.now() / 1000);
          if (decodedToken.exp < now) {
            // Токен истек
            console.warn('Токен истек, выполняем выход');
            setTimeout(() => get().logout(), 0);
            return null;
          }
          
          return { Authorization: `Bearer ${token}` };
        } catch (error) {
          console.error('Ошибка при проверке токена:', error);
          return { Authorization: `Bearer ${token}` };
        }
      },

      // Обновление профиля пользователя
      updateProfile: async (userData) => {
        const { token } = get();
        if (!token) {
          toast.error('Необходимо авторизоваться для обновления профиля');
          return false;
        }
        
        set({ isLoading: true });
        try {
          const authHeader = { Authorization: `Bearer ${token}` };
          const updatedUser = await authService.updateProfile(userData, authHeader);
          
          set({
            user: updatedUser,
            isLoading: false
          });
          
          toast.success('Профиль успешно обновлен');
          return true;
        } catch (error) {
          console.error('Ошибка обновления профиля:', error);
          set({ isLoading: false });
          return false;
        }
      },

      // Сбросить ошибку
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // имя для localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Сохраняем только эти поля в localStorage
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      })
    }
  )
); 