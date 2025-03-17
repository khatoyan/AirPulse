// Слайс хранилища для работы с местоположением пользователя
export const createLocationSlice = (set, get) => ({
  // Состояние
  userLocation: null,           // Местоположение пользователя
  
  // Установка местоположения пользователя
  setUserLocation: (location) => {
    if (!location || !location.lat || !location.lng) {
      console.error('Ошибка: некорректные данные о местоположении пользователя');
      return;
    }
    
    console.log('Установлено местоположение пользователя:', location);
    set({ userLocation: location });
  },
  
  // Запрос местоположения пользователя через Geolocation API
  requestUserLocation: () => {
    if (!navigator.geolocation) {
      console.error('Geolocation API не поддерживается в этом браузере');
      return;
    }
    
    console.log('Запрашиваем местоположение пользователя...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        get().setUserLocation(location);
      },
      (error) => {
        console.error('Ошибка при получении местоположения:', error.message);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 5000, 
        maximumAge: 0 
      }
    );
  },
  
  // Сброс местоположения пользователя
  clearUserLocation: () => {
    set({ userLocation: null });
  }
}); 