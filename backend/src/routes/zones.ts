import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Получить все зоны
router.get('/', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении зон' });
  }
});

// Создать новую зону
router.post('/', async (req, res) => {
  try {
    const { name, polygon, index } = req.body;
    const zone = await prisma.zone.create({
      data: {
        name,
        polygon,
        index
      }
    });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании зоны' });
  }
});

// Обновить индекс зоны
router.patch('/:id/index', async (req, res) => {
  try {
    const { id } = req.params;
    const { index } = req.body;
    const zone = await prisma.zone.update({
      where: { id: Number(id) },
      data: { index }
    });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении индекса зоны' });
  }
});

export const zonesRouter = router; 