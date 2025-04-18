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
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      const data = await reportsService.getAllReports();
      
      // Анализируем типы полученных отчетов
      if (data.length > 0) {
        const plantCount = data.filter(r => r.type === 'plant').length;
        const symptomCount = data.filter(r => r.type === 'symptom').length;
        const cityCount = data.filter(r => typeof r.id === 'string' && r.id.startsWith('city_')).length;
        
        console.log(`[Отчеты] Загружено общее количество: ${data.length}
          - Растения (из БД): ${plantCount - cityCount}
          - Городские деревья: ${cityCount}
          - Симптомы: ${symptomCount}
        `);
      }
      
      setOriginalReports(data); // Сохраняем оригинальные отчеты
      setLastUpdate(Date.now()); // Обновляем время последней загрузки
    } catch (error) {
      console.error('[MainApp] Ошибка при загрузке отчетов:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // Мемоизированная функция загрузки погоды
  const fetchWeather = useCallback(async () => {
    try {
      const data = await weatherService.getCurrentWeather(55.0084, 82.9357);
      setWeatherData(data);
    } catch (error) {
      console.error('[MainApp] Ошибка при загрузке погодных данных:', error);
    }
  }, [setWeatherData]);

  // Мемоизированный обработчик создания нового отчета
  const handleReportCreated = useCallback(() => {
    setTimeout(fetchReports, 1000); // Небольшая задержка для завершения транзакции на бэкенде
  }, [fetchReports]);

  // Обрабатываем данные о пыльце с учетом погоды
  const processReports = useCallback(() => {
    if (originalReports.length === 0) {
      return;
    }
    
    // Фильтруем только подтвержденные отчеты и симптомы
    const approvedReports = originalReports.filter(report => 
      report.approved
    );
    
    if (weatherData && weatherData.windSpeed) {
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
      
      // Обновляем отчеты с учетом разнесения пыльцы
      const combinedReports = [...approvedReports, ...dispersedReports];
      setReports(combinedReports);
    } else {
      // Если нет данных о погоде, просто отображаем исходные отчеты
      setReports([...approvedReports]);
    }
  }, [originalReports, weatherData, setReports]);

  // Загрузка отчетов и погодных данных при монтировании
  useEffect(() => {
    fetchReports();
    fetchWeather();
    
    // Добавляем обработчик события создания отчета
    window.addEventListener('report_created', handleReportCreated);
    
    // Обновляем данные каждые 5 минут
    const reportsInterval = setInterval(fetchReports, 5 * 60 * 1000);
    // Обновляем погоду каждые 30 минут
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => {
      clearInterval(reportsInterval);
      clearInterval(weatherInterval);
      window.removeEventListener('report_created', handleReportCreated);
    };
  }, [fetchReports, fetchWeather, handleReportCreated]);

  // Обработка отчетов при изменении исходных данных или погоды
  useEffect(() => {
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