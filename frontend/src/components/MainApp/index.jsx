import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Map from '../Map';
import { useMapStore } from '../../stores/mapStore';
import { reportsService, weatherService } from '../../services/api';
import { calculatePollenDispersion } from '../../utils/pollenDispersion';
import '../../App.css';

// Основной компонент отображения карты и погоды
function MainApp() {
  const { setReports, setWeatherData, weatherData } = useMapStore();
  const [originalReports, setOriginalReports] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const isProcessingRef = useRef(false);

  // Создаем мемоизированную функцию для получения отчетов
  const fetchReports = useCallback(async () => {
    // Предотвращаем параллельные вызовы
    if (isProcessingRef.current) {
      console.log('[MainApp] Предотвращен параллельный вызов fetchReports - обработка уже идет');
      return;
    }
    
    console.log('[MainApp] Начало загрузки отчетов...');
    isProcessingRef.current = true;
    
    try {
      console.log('[MainApp] Отправка запроса к API для получения отчетов');
      const data = await reportsService.getAllReports();
      console.log(`[MainApp] Получено ${data.length} отчетов с сервера`);
      
      // Анализируем типы полученных отчетов
      if (data.length > 0) {
        const plantCount = data.filter(r => r.type === 'plant').length;
        const symptomCount = data.filter(r => r.type === 'symptom').length;
        const cityCount = data.filter(r => typeof r.id === 'string' && r.id.startsWith('city_')).length;
        
        console.log(`[MainApp] Анализ полученных отчетов:
          - Растения (из БД): ${plantCount - cityCount}
          - Городские деревья: ${cityCount}
          - Симптомы: ${symptomCount}
        `);
        
        if (cityCount > 0) {
          console.log('[MainApp] Обнаружены городские деревья в ответе API, интеграция работает!');
        } else {
          console.warn('[MainApp] Не обнаружено городских деревьев в ответе API');
        }
      }
      
      setOriginalReports(data); // Сохраняем оригинальные отчеты
      setLastUpdate(Date.now()); // Обновляем время последней загрузки
    } catch (error) {
      console.error('[MainApp] Ошибка при загрузке отчетов:', error);
    } finally {
      isProcessingRef.current = false;
      console.log('[MainApp] Завершение загрузки отчетов');
    }
  }, []);

  // Мемоизированная функция загрузки погоды
  const fetchWeather = useCallback(async () => {
    console.log('[MainApp] Начало загрузки погодных данных...');
    try {
      const data = await weatherService.getCurrentWeather(55.0084, 82.9357);
      console.log('[MainApp] Получены погодные данные:', data);
      setWeatherData(data);
    } catch (error) {
      console.error('[MainApp] Ошибка при загрузке погодных данных:', error);
    }
  }, [setWeatherData]);

  // Мемоизированный обработчик создания нового отчета
  const handleReportCreated = useCallback(() => {
    console.log('[MainApp] Обнаружено создание нового отчета, обновляем данные...');
    setTimeout(fetchReports, 1000); // Небольшая задержка для завершения транзакции на бэкенде
  }, [fetchReports]);

  // Обрабатываем данные о пыльце с учетом погоды
  const processReports = useCallback(() => {
    if (originalReports.length === 0) {
      console.log('[MainApp] Нет отчетов для обработки, пропускаем расчет');
      return;
    }
    
    console.log(`[MainApp] Начало обработки ${originalReports.length} отчетов с учетом погодных данных`);
    
    // Фильтруем только подтвержденные отчеты и симптомы
    const approvedReports = originalReports.filter(report => 
      report.approved
    );
    
    console.log(`[MainApp] Отфильтровано ${approvedReports.length} подтвержденных отчетов из ${originalReports.length}`);
    
    // Проверяем наличие городских деревьев
    const cityTrees = approvedReports.filter(r => typeof r.id === 'string' && r.id.startsWith('city_')).length;
    if (cityTrees > 0) {
      console.log(`[MainApp] В подтвержденных отчетах найдено ${cityTrees} городских деревьев`);
    }
    
    if (weatherData && weatherData.windSpeed) {
      console.log(`[MainApp] Применяем модель гауссовского распределения с учетом ветра:
        - Скорость ветра: ${weatherData.windSpeed} м/с
        - Направление ветра: ${weatherData.windDirection}°
        - Температура: ${weatherData.temperature}°C
        - Влажность: ${weatherData.humidity}%
      `);
      
      // Рассчитываем распространение пыльцы с учетом ветра по математической модели
      // и передаем полные данные о погоде
      const dispersedReports = calculatePollenDispersion(
        approvedReports,
        weatherData.windSpeed,
        weatherData.windDirection,
        null, // timeIndex не используется для текущих данных
        {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          precipitation: weatherData.precipitation || 0,
          pressure: weatherData.pressure,
          description: weatherData.description
        }
      );
      
      console.log(`[MainApp] Сгенерировано ${dispersedReports.length} рассчетных точек распространения пыльцы`);
      
      // Обновляем отчеты с учетом разнесения пыльцы
      const combinedReports = [...approvedReports, ...dispersedReports];
      console.log(`[MainApp] Отправка в хранилище ${combinedReports.length} объединенных отчетов`);
      setReports(combinedReports);
    } else {
      // Если нет данных о погоде, просто отображаем исходные отчеты
      console.log('[MainApp] Нет данных о погоде, используем только исходные отчеты');
      setReports([...approvedReports]);
    }
  }, [originalReports, weatherData, setReports]);

  // Загрузка отчетов и погодных данных при монтировании
  useEffect(() => {
    console.log('[MainApp] Компонент смонтирован, начинаем загрузку данных');
    fetchReports();
    fetchWeather();
    
    // Добавляем обработчик события создания отчета
    window.addEventListener('report_created', handleReportCreated);
    console.log('[MainApp] Добавлен обработчик событий создания отчетов');
    
    // Обновляем данные каждые 5 минут
    const reportsInterval = setInterval(fetchReports, 5 * 60 * 1000);
    // Обновляем погоду каждые 30 минут
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    console.log('[MainApp] Настроены интервалы обновления данных');
    
    return () => {
      clearInterval(reportsInterval);
      clearInterval(weatherInterval);
      window.removeEventListener('report_created', handleReportCreated);
      console.log('[MainApp] Компонент размонтирован, очищены обработчики и интервалы');
    };
  }, [fetchReports, fetchWeather, handleReportCreated]);

  // Обработка отчетов при изменении исходных данных или погоды
  useEffect(() => {
    console.log('[MainApp] Изменение originalReports или weatherData, запуск processReports');
    processReports();
  }, [originalReports, weatherData, processReports]);

  // Мемоизированные данные для отображения
  const updateTimeString = useMemo(() => {
    if (lastUpdate === 0) return 'Загрузка данных...';
    return new Date(lastUpdate).toLocaleTimeString();
  }, [lastUpdate]);

  return (
    <main className="app-main">
      <Map />
      {/* Можно добавить время последнего обновления, если нужно */}
      {/* <div className="update-info">Обновлено: {updateTimeString}</div> */}
    </main>
  );
}

export default MainApp; 