import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Получить все растения
router.get('/', async (req, res) => {
  try {
    const plants = await prisma.plant.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(plants);
  } catch (error) {
    console.error('Ошибка при получении растений:', error);
    res.status(500).json({ error: 'Ошибка при получении растений' });
  }
});

// Получить растение по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plant = await prisma.plant.findUnique({
      where: { id: Number(id) },
      include: {
        reports: {
          where: { approved: true }
        }
      }
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Растение не найдено' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Ошибка при получении растения:', error);
    res.status(500).json({ error: 'Ошибка при получении растения' });
  }
});

// Создать новое растение (только для админов)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      latinName, // Фронтенд отправляет latinName вместо species
      description, 
      season, // Фронтенд отправляет season вместо bloomStart/bloomEnd
      allergyLevel, // Фронтенд отправляет allergyLevel вместо allergenicity
      category, // Дополнительное поле с фронтенда
      icon // Дополнительное поле с фронтенда
    } = req.body;
    
    console.log('Получены данные растения:', req.body);
    
    // Преобразуем данные в формат, ожидаемый Prisma
    const plant = await prisma.plant.create({
      data: {
        name,
        species: latinName || '', // Используем latinName как species
        description,
        bloomStart: season || null, // Используем season как bloomStart
        bloomEnd: season || null, // Используем season как bloomEnd
        allergenicity: allergyLevel ? Number(allergyLevel) : 0 // Используем allergyLevel как allergenicity
        // Поля category и icon не используются в схеме Prisma
      }
    });
    
    res.status(201).json(plant);
  } catch (error) {
    console.error('Ошибка при создании растения:', error);
    res.status(500).json({ error: 'Ошибка при создании растения' });
  }
});

// Обновить растение (только для админов)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      latinName, // Фронтенд отправляет latinName вместо species
      description, 
      season, // Фронтенд отправляет season вместо bloomStart/bloomEnd
      allergyLevel, // Фронтенд отправляет allergyLevel вместо allergenicity
      category, // Дополнительное поле с фронтенда
      icon // Дополнительное поле с фронтенда
    } = req.body;
    
    console.log('Получены данные для обновления растения:', req.body);
    
    const plant = await prisma.plant.update({
      where: { id: Number(id) },
      data: {
        name,
        species: latinName || '', // Используем latinName как species
        description,
        bloomStart: season || null, // Используем season как bloomStart
        bloomEnd: season || null, // Используем season как bloomEnd
        allergenicity: allergyLevel ? Number(allergyLevel) : 0 // Используем allergyLevel как allergenicity
        // Поля category и icon не используются в схеме Prisma
      }
    });
    
    res.json(plant);
  } catch (error) {
    console.error('Ошибка при обновлении растения:', error);
    res.status(500).json({ error: 'Ошибка при обновлении растения' });
  }
});

// Удалить растение (только для админов)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Сначала обновляем все отчеты, связанные с этим растением
    await prisma.report.updateMany({
      where: { plantId: Number(id) },
      data: { plantId: null }
    });
    
    // Затем удаляем само растение
    await prisma.plant.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Растение успешно удалено', id: Number(id) });
  } catch (error) {
    console.error('Ошибка при удалении растения:', error);
    res.status(500).json({ error: 'Ошибка при удалении растения' });
  }
});

export const plantsRouter = router; 