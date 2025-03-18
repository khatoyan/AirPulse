import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all plants
router.get('/', async (req, res) => {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// Get currently flowering plants
router.get('/flowering', async (req, res) => {
  try {
    // Получение текущего месяца в нижнем регистре на русском языке
    const currentMonth = new Date().toLocaleString('ru-RU', { month: 'long' }).toLowerCase();
    console.log('Текущий месяц:', currentMonth);
    
    // Словарь месяцев для корректного сравнения (порядковые номера)
    const monthOrder: Record<string, number> = {
      'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4, 
      'май': 5, 'июнь': 6, 'июль': 7, 'август': 8, 
      'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12
    };
    
    // Номер текущего месяца
    const currentMonthNumber = monthOrder[currentMonth];
    console.log('Номер текущего месяца:', currentMonthNumber);
    
    if (!currentMonthNumber) {
      return res.status(500).json({ error: 'Не удалось определить текущий месяц' });
    }
    
    // Получаем все растения
    const allPlants = await prisma.plant.findMany();
    
    // Фильтруем растения, которые цветут в текущем месяце
    const floweringPlants = allPlants.filter(plant => {
      if (!plant.bloomStart || !plant.bloomEnd) return false;
      
      // Получаем месяцы начала и конца цветения
      const bloomStartLower = plant.bloomStart.toLowerCase();
      const bloomEndLower = plant.bloomEnd.toLowerCase();
      
      console.log(`Растение: ${plant.name}, начало: ${bloomStartLower}, конец: ${bloomEndLower}`);
      
      // Получаем порядковые номера месяцев
      const startMonth = monthOrder[bloomStartLower];
      const endMonth = monthOrder[bloomEndLower];
      
      if (!startMonth || !endMonth) {
        console.log(`Некорректный формат месяца для растения ${plant.name}`);
        return false;
      }
      
      console.log(`Растение: ${plant.name}, номер начала: ${startMonth}, номер конца: ${endMonth}`);
      
      // Проверяем, цветет ли растение в текущем месяце
      if (startMonth <= endMonth) {
        // Обычный случай (например, с апреля по июнь)
        return currentMonthNumber >= startMonth && currentMonthNumber <= endMonth;
      } else {
        // Случай, когда цветение пересекает границу года (например, с ноября по февраль)
        return currentMonthNumber >= startMonth || currentMonthNumber <= endMonth;
      }
    });
    
    console.log(`Найдено ${floweringPlants.length} цветущих растений`);
    res.json(floweringPlants);
  } catch (error) {
    console.error('Error fetching flowering plants:', error);
    res.status(500).json({ error: 'Failed to fetch flowering plants' });
  }
});

// Get plant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await prisma.plant.findUnique({
      where: {
        id: parseInt(id)
      }
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// Create new plant (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
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
    
    res.status(201).json(newPlant);
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

export default router; 