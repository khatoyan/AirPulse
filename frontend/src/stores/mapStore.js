import { create } from 'zustand';

export const useMapStore = create((set, get) => ({
  reports: [],
  weatherData: null,
  selectedZone: null,
  updateHeatmap: false,
  showReportForm: false,
  selectedLocation: null,
  windDispersionPoints: [],
  selectedAllergen: null,
  
  allergenTypes: [
    { id: 'береза', name: 'Берёза', icon: '🌳' },
    { id: 'амброзия', name: 'Амброзия', icon: '🌱' },
    { id: 'сорняки', name: 'Сорняки', icon: '🌿' },
    { id: 'ольха', name: 'Ольха', icon: '🌲' },
    { id: 'полынь', name: 'Полынь', icon: '🌾' },
    { id: 'злаки', name: 'Злаки', icon: '🌾' }
  ],
  
  setSelectedAllergen: (allergen) => {
    set({ selectedAllergen: allergen });
    const { reports, weatherData } = get();
    if (reports.length > 0 && weatherData) {
      get().generateWindDispersionPoints(reports, weatherData);
    }
  },

  getFilteredReports: () => {
    const { reports, selectedAllergen } = get();
    
    if (!selectedAllergen) {
      return reports;
    }
    
    return reports.filter(report => {
      if (report.plantType && report.type === 'plant') {
        return report.plantType.toLowerCase().includes(selectedAllergen.toLowerCase());
      }
      return false;
    });
  },
  
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
    
    const { selectedAllergen } = get();
    let plantReports = reports.filter(report => report.type === 'plant');
    
    if (selectedAllergen) {
      plantReports = plantReports.filter(report => 
        report.plantType && report.plantType.toLowerCase().includes(selectedAllergen.toLowerCase())
      );
      console.log(`Фильтрация по аллергену: ${selectedAllergen}, найдено ${plantReports.length} отчетов`);
    }
    
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
    
    const calculateRemainingPotency = (report) => {
      const now = new Date();
      const reportTime = new Date(report.createdAt);
      const hoursPassed = (now - reportTime) / (1000 * 60 * 60);
      
      let halfLife = 24;
      
      if (report.plantType) {
        const plantType = report.plantType.toLowerCase();
        if (plantType.includes('амброзия')) halfLife = 36;
        else if (plantType.includes('береза')) halfLife = 18;
        else if (plantType.includes('злаки')) halfLife = 12;
        else if (plantType.includes('полынь')) halfLife = 30;
        else if (plantType.includes('ольха')) halfLife = 20;
        else if (plantType.includes('сорняки')) halfLife = 24;
      }
      
      const decayFactor = Math.pow(0.7, hoursPassed / halfLife);
      
      return decayFactor;
    };
    
    const determineAtmosphericStability = (weather) => {
      let stability = 3;
      
      if (weather.temperature && weather.windSpeed) {
        if (weather.windSpeed > 8) stability = 2;
        else if (weather.windSpeed < 2) stability = 5;
        
        if (weather.temperature > 30) stability -= 1;
        else if (weather.temperature < 5) stability += 1;
      }
      
      return Math.max(1, Math.min(6, stability));
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
      
      const windSpeedFactor = Math.min(1.0 + (weather.windSpeed / 15), 2.5);
      
      return { temperatureFactor, humidityFactor, windSpeedFactor };
    };
    
    const weatherFactors = calculateWeatherFactors(weather);
    const stability = determineAtmosphericStability(weather);
    const dispersionPoints = [];
    
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const recentPlantReports = plantReports.filter(report => {
      const reportDate = new Date(report.createdAt);
      return reportDate >= fourDaysAgo;
    });
    
    console.log(`Расчет распространения пыльцы для ${recentPlantReports.length} отчетов о растениях`);
    
    const windDegMath = (90 - weather.windDeg + 360) % 360;
    
    const windRadMath = (windDegMath * Math.PI) / 180;
    
    const windDispersionFactor = Math.max(3 - weather.windSpeed * 0.2, 0.5);
    
    recentPlantReports.forEach(plant => {
      if (plant.severity < 1) return;
      
      const ageFactor = calculateRemainingPotency(plant);
      
      if (ageFactor < 0.05) return;
      
      const numPoints = Math.floor(
        (plant.severity / 1.2) * 
        Math.max(weather.windSpeed, 1) * 
        weatherFactors.temperatureFactor * 
        weatherFactors.humidityFactor * 
        ageFactor * 
        5
      );
      
      const maxDistance = weather.windSpeed * 0.6 * weatherFactors.windSpeedFactor;
      
      for (let i = 0; i < numPoints; i++) {
        const distanceFactor = -Math.log(1 - Math.random() * 0.95) * 0.5;
        const distance = Math.min(distanceFactor * maxDistance, maxDistance);
        
        const perpSigma = (distance * 0.15) * windDispersionFactor;
        const perpDeviation = gaussianRandom(0, perpSigma);
        
        const vertSigma = perpSigma * 0.5;
        const vertDeviation = gaussianRandom(0, vertSigma);
        
        let dx = distance * 1000 * Math.cos(windRadMath) - perpDeviation * Math.sin(windRadMath);
        let dy = distance * 1000 * Math.sin(windRadMath) + perpDeviation * Math.cos(windRadMath);
        
        const latFactor = 1 / 111000;
        const lngFactor = 1 / (111000 * Math.cos(plant.latitude * (Math.PI / 180)));
        
        const lat = plant.latitude + dy * latFactor;
        const lng = plant.longitude + dx * lngFactor;
        
        const decayWithDistance = Math.exp(-1.2 * (distance / maxDistance));
        const intensity = Math.max(1, plant.severity * decayWithDistance * ageFactor * 1.5);
        
        if (intensity > 0.3) {
          dispersionPoints.push({
            latitude: lat,
            longitude: lng,
            severity: intensity,
            type: 'calculated',
            isCalculated: true,
            parentId: plant.id,
            createdAt: plant.createdAt,
            plantType: plant.plantType,
            distance: distance.toFixed(2),
            perpDeviation: perpDeviation.toFixed(2),
            vertDeviation: vertDeviation.toFixed(2)
          });
        }
      }
    });
    
    const maxPointsForPerformance = 2000;
    let finalPoints = dispersionPoints;
    
    if (dispersionPoints.length > maxPointsForPerformance) {
      finalPoints = dispersionPoints
        .sort((a, b) => b.severity - a.severity)
        .slice(0, maxPointsForPerformance);
    }
    
    console.log(`Сгенерировано ${finalPoints.length} точек рассеивания пыльцы (из ${dispersionPoints.length} рассчитанных)`);
    if (finalPoints.length > 0) {
      console.log('Диапазон расстояний:', {
        min: Math.min(...finalPoints.map(p => parseFloat(p.distance) || 0)).toFixed(2) + ' км',
        max: Math.max(...finalPoints.map(p => parseFloat(p.distance) || 0)).toFixed(2) + ' км'
      });
    }
    
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