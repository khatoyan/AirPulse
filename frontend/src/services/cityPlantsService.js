/* // Функция для загрузки городских деревьев из JSON-файла
export const loadCityPlants = async () => {
  console.log('[cityPlantsService] Начинаем загрузку городских деревьев из JSON-файла');
  try {
    const response = await fetch('/data/city_plants.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[cityPlantsService] Получено ${data.length} записей из JSON-файла`);
    
    // Ограничиваем количество загружаемых объектов до 500
    const limitedData = data.slice(0, 500);
    console.log(`[cityPlantsService] Применяем ограничение: будут использованы только первые 500 записей из ${data.length}`);
    
    // Преобразуем данные в формат для отображения на карте
    const cityPlants = limitedData.map((plant, index) => {
      return {
        id: `city_${index}`,
        type: 'plant',
        genus: plant.genus || 'Неизвестно',
        plantType: `${plant.genus || 'Неизвестно'} ${plant.species || ''}`.trim(),
        latitude: plant.latitude,
        longitude: plant.longitude,
        coordinates: [plant.latitude, plant.longitude],
        severity: calculateSeverity(plant.genus),
        createdAt: new Date().toISOString(),
        description: `Городское дерево: ${plant.genus || 'Неизвестно'} ${plant.species || ''}`.trim()
      };
    });
    
    // Фильтруем записи с невалидными координатами
    const validPlants = cityPlants.filter(plant => 
      plant.latitude && plant.longitude && 
      !isNaN(parseFloat(plant.latitude)) && 
      !isNaN(parseFloat(plant.longitude))
    );
    
    console.log(`[cityPlantsService] Обработано ${cityPlants.length} записей, из них ${validPlants.length} с валидными координатами`);
    
    if (validPlants.length < cityPlants.length) {
      console.warn(`[cityPlantsService] Пропущено ${cityPlants.length - validPlants.length} записей из-за отсутствия валидных координат`);
    }
    
    return validPlants;
  } catch (error) {
    console.error('[cityPlantsService] Ошибка при загрузке городских деревьев:', error);
    return [];
  }
}; */