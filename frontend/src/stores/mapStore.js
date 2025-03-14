import { create } from 'zustand';

export const useMapStore = create((set, get) => ({
  reports: [],
  weatherData: null,
  selectedZone: null,
  updateHeatmap: false,
  showReportForm: false,
  selectedLocation: null,
  windDispersionPoints: [],

  setReports: (reports) => {
    const currentReports = get().reports;
    
    if (currentReports.length === reports.length && 
        currentReports.length > 0 && 
        JSON.stringify(currentReports[0]) === JSON.stringify(reports[0])) {
      console.log('Пропускаем обновление отчетов (нет изменений)');
      return;
    }
    
    console.log(`Обновляем отчеты (${reports.length} шт.)`);
    set({ reports });
    
    const weatherData = get().weatherData;
    if (weatherData) {
      get().generateWindDispersionPoints(reports, weatherData);
    }
  },
  
  setWeatherData: (data) => {
    const currentData = get().weatherData;
    
    if (currentData && data && 
        currentData.temperature === data.temperature && 
        currentData.humidity === data.humidity &&
        currentData.windSpeed === data.windSpeed &&
        currentData.windDeg === data.windDeg) {
      return;
    }
    
    set({ weatherData: data });
    
    const reports = get().reports;
    if (reports.length > 0 && data) {
      get().generateWindDispersionPoints(reports, data);
    }
  },
  
  generateWindDispersionPoints: (reports, weather) => {
    if (!reports || !weather || !weather.windSpeed) {
      set({ windDispersionPoints: [] });
      return;
    }
    
    const plantReports = reports.filter(report => report.type === 'plant');
    
    if (plantReports.length === 0) {
      set({ windDispersionPoints: [] });
      return;
    }
    
    const gaussianRandom = (mean = 0, stdev = 1) => {
      const u = 1 - Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return z * stdev + mean;
    };
    
    const calculateWeatherFactors = (weather) => {
      let temperatureFactor = 1.0;
      if (weather.temperature) {
        if (weather.temperature < 5) {
          temperatureFactor = 0.3;
        } else if (weather.temperature > 35) {
          temperatureFactor = 0.5;
        } else if (weather.temperature >= 20 && weather.temperature <= 25) {
          temperatureFactor = 1.3;
        }
      }
      
      let humidityFactor = 1.0;
      if (weather.humidity) {
        if (weather.humidity > 80) {
          humidityFactor = 0.4;
        } else if (weather.humidity < 30) {
          humidityFactor = 1.2;
        } else if (weather.humidity >= 40 && weather.humidity <= 60) {
          humidityFactor = 1.1;
        }
      }
      
      const windSpeedFactor = Math.min(1.0 + (weather.windSpeed / 20), 2.0);
      
      return { temperatureFactor, humidityFactor, windSpeedFactor };
    };
    
    const weatherFactors = calculateWeatherFactors(weather);
    const dispersionPoints = [];
    
    plantReports.forEach(plant => {
      if (plant.severity < 30) return;
      
      const numPoints = Math.floor(
        (plant.severity / 15) * 
        weather.windSpeed * 
        weatherFactors.temperatureFactor * 
        weatherFactors.humidityFactor
      );
      
      const maxDistance = weather.windSpeed * 0.5 * weatherFactors.windSpeedFactor;
      
      const windRad = ((weather.windDeg + 180) % 360) * (Math.PI / 180);
      
      const angleStdDev = Math.max(5, 15 - weather.windSpeed * 0.5) * (Math.PI / 180);
      
      for (let i = 0; i < numPoints; i++) {
        const distanceFactor = Math.abs(gaussianRandom(0.6, 0.25));
        const distance = distanceFactor * maxDistance;
        
        const randomAngle = gaussianRandom(0, angleStdDev);
        const angle = windRad + randomAngle;
        
        const latFactor = 1 / 111000;
        const lngFactor = 1 / (111000 * Math.cos(plant.latitude * (Math.PI / 180)));
        
        const dx = distance * 1000 * Math.sin(angle) * lngFactor;
        const dy = distance * 1000 * Math.cos(angle) * latFactor;
        
        const lat = plant.latitude + dy;
        const lng = plant.longitude + dx;
        
        const decayFactor = 1.5;
        const intensity = plant.severity * Math.exp(-decayFactor * (distance / maxDistance));
        
        if (intensity > 5) {
          dispersionPoints.push({
            latitude: lat,
            longitude: lng,
            severity: intensity,
            type: 'calculated',
            isCalculated: true,
            parentId: plant.id,
            distance: distance.toFixed(2)
          });
        }
      }
    });
    
    const maxPointsForPerformance = 1000;
    let finalPoints = dispersionPoints;
    
    if (dispersionPoints.length > maxPointsForPerformance) {
      finalPoints = dispersionPoints
        .sort((a, b) => b.severity - a.severity)
        .slice(0, maxPointsForPerformance);
    }
    
    console.log(`Сгенерировано ${finalPoints.length} точек рассеивания пыльцы (из ${dispersionPoints.length} рассчитанных)`);
    console.log('Диапазон расстояний:', {
      min: Math.min(...finalPoints.map(p => parseFloat(p.distance) || 0)).toFixed(2) + ' км',
      max: Math.max(...finalPoints.map(p => parseFloat(p.distance) || 0)).toFixed(2) + ' км'
    });
    
    set({ windDispersionPoints: finalPoints });
  },
  
  setSelectedZone: (zone) => set({ selectedZone: zone }),

  setShowReportForm: (show) => set({ showReportForm: show }),
  
  setSelectedLocation: (location) => set({ selectedLocation: location }),

  calculateZoneIndex: (reports, weather) => {
    if (!reports.length) return 0;

    const baseIndex = reports.reduce((acc, report) => acc + report.severity, 0) / reports.length;

    if (weather) {
      const windFactor = Math.min(weather.windSpeed * 0.1, 0.5);
      const humidityFactor = weather.humidity * 0.005;
      
      return Math.min(baseIndex * (1 + windFactor + humidityFactor), 100);
    }

    return baseIndex;
  }
})); 