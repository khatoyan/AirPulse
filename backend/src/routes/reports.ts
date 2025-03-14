import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

// Получить все одобренные отчеты
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        plant: true
      }
    });
    res.json(reports);
  } catch (error) {
    console.error('Ошибка при получении отчетов:', error);
    res.status(500).json({ error: 'Ошибка при получении отчетов' });
  }
});

// Получить все ожидающие модерации отчеты (для админов)
router.get('/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { approved: false, isCalculated: false },
      orderBy: { createdAt: 'desc' },
      include: {
        plant: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json(reports);
  } catch (error) {
    console.error('Ошибка при получении ожидающих отчетов:', error);
    res.status(500).json({ error: 'Ошибка при получении ожидающих отчетов' });
  }
});

// Одобрить отчет (для админов)
router.put('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: { approved: true }
    });
    res.json(report);
  } catch (error) {
    console.error('Ошибка при одобрении отчета:', error);
    res.status(500).json({ error: 'Ошибка при одобрении отчета' });
  }
});

// Отклонить отчет (для админов)
router.put('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Отчет отклонен', id: Number(id) });
  } catch (error) {
    console.error('Ошибка при отклонении отчета:', error);
    res.status(500).json({ error: 'Ошибка при отклонении отчета' });
  }
});

// Создать новый отчет - доступно даже без аутентификации
router.post('/', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      severity, 
      type, 
      symptom, 
      plantType, 
      plantId, 
      description
    } = req.body;

    // Проверяем, есть ли токен авторизации
    const authHeader = req.headers.authorization;
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    let userId = null;
    let isAdmin = false;

    // Если токен есть, пытаемся получить инфо о пользователе
    if (isAuthenticated) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as { 
          userId: number; 
          role: string;
        };
        userId = decoded.userId;
        isAdmin = decoded.role === 'admin';
      } catch (error) {
        // Если токен недействителен, просто не устанавливаем userId и isAdmin
        console.warn('Недействительный токен авторизации');
      }
    }

    // Автоматически одобряем отчеты о симптомах или если пользователь - админ
    const approved = type === 'symptom' || isAdmin;

    const report = await prisma.report.create({
      data: {
        latitude,
        longitude,
        severity,
        type,
        symptom,
        plantType,
        plantId,
        description,
        userId,
        approved,
        isCalculated: false
      }
    });
    res.status(201).json(report);
  } catch (error) {
    console.error('Ошибка при создании отчета:', error);
    res.status(500).json({ error: 'Ошибка при создании отчета' });
  }
});

// Получить отчеты в определенной зоне
router.get('/zone', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const reports = await prisma.$queryRaw`
      SELECT * FROM "Report"
      WHERE (
        6371 * acos(
          cos(radians(${Number(lat)}))
          * cos(radians(latitude))
          * cos(radians(longitude) - radians(${Number(lng)}))
          + sin(radians(${Number(lat)}))
          * sin(radians(latitude))
        )
      ) <= ${Number(radius)}
      AND "approved" = true
    `;
    res.json(reports);
  } catch (error) {
    console.error('Ошибка при получении отчетов в зоне:', error);
    res.status(500).json({ error: 'Ошибка при получении отчетов в зоне' });
  }
});

// Получить статистику по отчетам (для админов)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // Получаем количество одобренных отчетов
    const approvedCount = await prisma.report.count({
      where: { approved: true }
    });
    
    // Получаем количество отклоненных отчетов (это сложно посчитать, так как отклоненные удаляются)
    // В реальной системе можно было бы добавить статус вместо удаления
    // Здесь просто добавим заглушку
    const rejectedCount = 0;
    
    // Получаем количество отчетов на модерации
    const pendingCount = await prisma.report.count({
      where: { approved: false, isCalculated: false }
    });
    
    // Отправляем статистику
    res.json({
      approvedCount,
      rejectedCount,
      pendingCount
    });
  } catch (error) {
    console.error('Ошибка при получении статистики по отчетам:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики по отчетам' });
  }
});

export const reportsRouter = router; 