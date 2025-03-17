// Слайс хранилища для работы с отчетами и выбранными зонами
export const createReportsSlice = (set, get) => ({
  // Состояние
  reports: [],                  // Отчеты о концентрации пыльцы
  selectedZone: null,           // Выбранная зона на карте
  updateHeatmap: 0,             // Счетчик обновлений тепловой карты
  showReportForm: false,        // Показывать ли форму создания отчета
  selectedLocation: null,       // Выбранная локация для нового отчета
  windDispersionPoints: [],     // Точки распространения пыльцы с учетом ветра
  selectedAllergen: null,       // Выбранный для фильтрации аллерген
  
  // Установка полученных отчетов
  setReports: (reports) => {
    set({ 
      reports,
      updateHeatmap: Date.now() // Увеличиваем счетчик обновлений для тепловой карты
    });
    
    // Если активна временная шкала, обновляем точки распространения
    if (get().timelineActive && get().forecastData.length > 0) {
      const { selectedTimeIndex, forecastData } = get();
      get().generateTimeDispersionPoints(reports, forecastData[selectedTimeIndex], selectedTimeIndex);
    }
  },
  
  // Установка точек разнесения пыльцы ветром
  setWindDispersionPoints: (points) => {
    set({ 
      windDispersionPoints: points,
      updateHeatmap: Date.now()
    });
  },
  
  // Добавление нового отчета
  addReport: (report) => {
    const newReports = [...get().reports, report];
    get().setReports(newReports);
    // Создаем пользовательское событие для уведомления о создании отчета
    window.dispatchEvent(new CustomEvent('report_created', { detail: report }));
  },
  
  // Выбор зоны на карте
  setSelectedZone: (zone) => {
    set({ selectedZone: zone });
  },
  
  // Отображение/скрытие формы создания отчета
  toggleReportForm: (show, location = null) => {
    const newState = show !== undefined ? show : !get().showReportForm;
    set({ 
      showReportForm: newState,
      selectedLocation: newState ? location : null
    });
  },
  
  // Выбор аллергена для фильтрации
  setSelectedAllergen: (allergenId) => {
    // Если выбран тот же аллерген, сбрасываем выбор
    const newAllergen = get().selectedAllergen === allergenId ? null : allergenId;
    set({ selectedAllergen: newAllergen });
  },
  
  // Получить отфильтрованные отчеты
  getFilteredReports: () => {
    const { reports, selectedAllergen } = get();
    if (!selectedAllergen) return reports;
    
    return reports.filter(report => 
      report.allergen === selectedAllergen ||
      // Для рассчитанных точек разнесения также фильтруем
      (report.parentAllergen && report.parentAllergen === selectedAllergen)
    );
  }
}); 