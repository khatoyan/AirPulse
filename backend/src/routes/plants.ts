import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { loadCityTrees } from '../services/cityPlantsService';
import { CITY_TREES_LIMIT } from '../constants/limits';

const router = Router();
const prisma = new PrismaClient();

// Функция для нормализации названий растений с учетом российских букв
const normalizePlantName = (name: string): string => {
  if (!name) return '';
  
  let normalized = name.trim().toLowerCase();
  
  // Замена 'е' на 'ё' в названиях растений
  if (normalized.includes('берез')) {
    normalized = normalized.replace('берез', 'берёз');
  }
  
  return normalized;
};

// Get all plants
router.get('/', async (req, res) => {
  console.log('[plants:GET /] Запрос на получение всех растений');
  try {
    // Загружаем растения из базы данных
    console.log('[plants:GET /] Загрузка растений из базы данных...');
    const dbPlants = await prisma.plant.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    console.log(`[plants:GET /] Загружено ${dbPlants.length} растений из БД`);
    
    // Загружаем городские деревья из JSON
    console.log('[plants:GET /] Загрузка городских деревьев из JSON...');
    const cityTrees = await loadCityTrees(CITY_TREES_LIMIT);
    console.log(`[plants:GET /] Загружено ${cityTrees.length} городских деревьев`);
    
    // Объединяем данные
    const combinedPlants = [...dbPlants, ...cityTrees];
    console.log(`[plants:GET /] Всего объединено ${combinedPlants.length} растений`);

    // Удаляем дубликаты по имени
    const uniquePlantMap = new Map();
    
    // Стандартизируем названия растений из БД
    dbPlants.forEach(plant => {
      if (plant.name.includes('Береза')) {
        plant.name = plant.name.replace('Береза', 'Берёза');
      }
    });
    
    // Стандартизируем названия городских деревьев
    cityTrees.forEach(plant => {
      if (plant.name.includes('Береза')) {
        plant.name = plant.name.replace('Береза', 'Берёза');
      }
    });
    
    combinedPlants.forEach(plant => {
      const normalizedName = normalizePlantName(plant.name);
      
      // Приоритет отдаем растениям из БД (числовые ID) над городскими (строковые ID)
      if (!uniquePlantMap.has(normalizedName) || 
          (typeof plant.id === 'number' && typeof uniquePlantMap.get(normalizedName).id === 'string')) {
        uniquePlantMap.set(normalizedName, plant);
      }
    });
    
    const allPlants = Array.from(uniquePlantMap.values());
    console.log(`[plants:GET /] После удаления дубликатов: ${allPlants.length} уникальных растений`);
    
    // Проверяем первые несколько элементов для диагностики
    if (allPlants.length > 0) {
      console.log(`[plants:GET /] Пример первого объединенного растения:`, 
        JSON.stringify(allPlants[0], null, 2).substring(0, 200) + '...');
    }
    
    res.json(allPlants);
    console.log(`[plants:GET /] Отправлено ${allPlants.length} растений клиенту`);
  } catch (error) {
    console.error('[plants:GET /] Ошибка при получении растений:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// Get currently flowering plants
router.get('/flowering', async (req, res) => {
  console.log('[plants:GET /flowering] Запрос на получение цветущих растений');
  try {
    // Получение текущего месяца в нижнем регистре на русском языке
    const currentMonth = new Date().toLocaleString('ru-RU', { month: 'long' }).toLowerCase();
    console.log('[plants:GET /flowering] Текущий месяц:', currentMonth);
    
    // Словарь месяцев для корректного сравнения (порядковые номера)
    const monthOrder: Record<string, number> = {
      'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4, 
      'май': 5, 'июнь': 6, 'июль': 7, 'август': 8, 
      'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12
    };
    
    // Номер текущего месяца
    const currentMonthNumber = monthOrder[currentMonth];
    console.log('[plants:GET /flowering] Номер текущего месяца:', currentMonthNumber);
    
    if (!currentMonthNumber) {
      console.error('[plants:GET /flowering] Не удалось определить текущий месяц');
      return res.status(500).json({ error: 'Не удалось определить текущий месяц' });
    }
    
    // Получаем все растения из БД
    console.log('[plants:GET /flowering] Загрузка растений из базы данных...');
    const dbPlants = await prisma.plant.findMany();
    console.log(`[plants:GET /flowering] Загружено ${dbPlants.length} растений из БД`);
    
    // Получаем городские деревья
    console.log('[plants:GET /flowering] Загрузка городских деревьев из JSON...');
    const cityTrees = await loadCityTrees(CITY_TREES_LIMIT);
    console.log(`[plants:GET /flowering] Загружено ${cityTrees.length} городских деревьев`);
    
    // Стандартизируем названия растений из БД
    dbPlants.forEach(plant => {
      if (plant.name.includes('Береза')) {
        plant.name = plant.name.replace('Береза', 'Берёза');
      }
    });
    
    // Стандартизируем названия городских деревьев
    cityTrees.forEach(plant => {
      if (plant.name.includes('Береза')) {
        plant.name = plant.name.replace('Береза', 'Берёза');
      }
    });
    
    // Объединяем растения из БД и городские
    const combinedPlants = [...dbPlants, ...cityTrees];
    console.log(`[plants:GET /flowering] Объединено ${combinedPlants.length} растений`);
    
    // Дедупликация растений по имени перед фильтрацией
    const uniquePlantMap = new Map();
    
    combinedPlants.forEach(plant => {
      const normalizedName = normalizePlantName(plant.name);
      
      // Приоритет отдаем растениям из БД (числовые ID) над городскими (строковые ID)
      if (!uniquePlantMap.has(normalizedName) || 
          (typeof plant.id === 'number' && typeof uniquePlantMap.get(normalizedName).id === 'string')) {
        uniquePlantMap.set(normalizedName, plant);
      }
    });
    
    const allPlants = Array.from(uniquePlantMap.values());
    console.log(`[plants:GET /flowering] После удаления дубликатов: ${allPlants.length} уникальных растений`);
    
    // Фильтруем растения, которые цветут в текущем месяце
    console.log('[plants:GET /flowering] Фильтрация цветущих растений...');
    const floweringPlants = allPlants.filter(plant => {
      if (!plant.bloomStart || !plant.bloomEnd) return false;
      
      // Получаем месяцы начала и конца цветения
      const bloomStartLower = plant.bloomStart.toLowerCase();
      const bloomEndLower = plant.bloomEnd.toLowerCase();
      
      // Получаем порядковые номера месяцев
      const startMonth = monthOrder[bloomStartLower];
      const endMonth = monthOrder[bloomEndLower];
      
      if (!startMonth || !endMonth) {
        console.log(`[plants:GET /flowering] Некорректный формат месяца для растения ${plant.name}`);
        return false;
      }
      
      // Проверяем, цветет ли растение в текущем месяце
      if (startMonth <= endMonth) {
        // Обычный случай (например, с апреля по июнь)
        return currentMonthNumber >= startMonth && currentMonthNumber <= endMonth;
      } else {
        // Случай, когда цветение пересекает границу года (например, с ноября по февраль)
        return currentMonthNumber >= startMonth || currentMonthNumber <= endMonth;
      }
    });
    
    console.log(`[plants:GET /flowering] Найдено ${floweringPlants.length} цветущих растений`);
    // Источники данных для цветущих растений
    const dbFlowering = floweringPlants.filter(p => typeof p.id === 'number').length;
    const cityFlowering = floweringPlants.filter(p => typeof p.id === 'string').length;
    console.log(`[plants:GET /flowering] Из них: ${dbFlowering} из БД, ${cityFlowering} из городских данных`);
    
    res.json(floweringPlants);
    console.log(`[plants:GET /flowering] Отправлено ${floweringPlants.length} цветущих растений клиенту`);
  } catch (error) {
    console.error('[plants:GET /flowering] Ошибка при получении цветущих растений:', error);
    res.status(500).json({ error: 'Failed to fetch flowering plants' });
  }
});

// Get plant by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[plants:GET /${id}] Запрос на получение растения по ID: ${id}`);
  
  try {
    // Проверяем, является ли ID идентификатором городского дерева
    if (id.startsWith('city_')) {
      console.log(`[plants:GET /${id}] Идентификатор соответствует городскому дереву`);
      // Загружаем городские деревья
      const cityTrees = await loadCityTrees(CITY_TREES_LIMIT);
      
      // Ищем дерево по ID
      const cityTree = cityTrees.find(tree => tree.id === id);
      
      if (!cityTree) {
        console.log(`[plants:GET /${id}] Городское дерево не найдено`);
        return res.status(404).json({ error: 'Plant not found' });
      }
      
      console.log(`[plants:GET /${id}] Городское дерево найдено: ${cityTree.name}`);
      return res.json(cityTree);
    }
    
    // Если это обычное растение из БД
    console.log(`[plants:GET /${id}] Поиск растения в базе данных`);
    const plant = await prisma.plant.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!plant) {
      console.log(`[plants:GET /${id}] Растение не найдено в базе данных`);
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    console.log(`[plants:GET /${id}] Растение найдено в базе данных: ${plant.name}`);
    res.json(plant);
  } catch (error) {
    console.error(`[plants:GET /${id}] Ошибка при получении растения:`, error);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// Create new plant (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  console.log('[plants:POST /] Запрос на создание нового растения');
  try {
    const { name, species, description, bloomStart, bloomEnd, allergenicity } = req.body;
    
    const newPlant = await prisma.plant.create({
      data: {
        name,
        species,
        description,
        bloomStart,
        bloomEnd,
        allergenicity: parseInt(allergenicity)
      }
    });
    
    console.log(`[plants:POST /] Создано новое растение: ${name} (ID: ${newPlant.id})`);
    res.status(201).json(newPlant);
  } catch (error) {
    console.error('[plants:POST /] Ошибка при создании растения:', error);
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

export default router; 