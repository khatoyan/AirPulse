import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { loadCityTrees } from '../services/cityPlantsService';
import { CITY_TREES_LIMIT } from './plants';

const router = Router();
const prisma = new PrismaClient();

// Получить все одобренные отчеты
router.get('/', async (req, res) => {
  try {
    // Получаем отчеты из базы данных
    console.log('[reports:GET /] Загрузка одобренных отчетов из БД...');
    const dbReports = await prisma.report.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        plant: true
      }
    });
    console.log(`[reports:GET /] Загружено ${dbReports.length} отчетов из БД`);
    
    // Загружаем городские деревья как отчеты
    console.log('[reports:GET /] Загрузка городских деревьев из JSON...');
    const cityTrees = await loadCityTrees(CITY_TREES_LIMIT);
    console.log(`[reports:GET /] Загружено ${cityTrees.length} городских деревьев`);
    
    // Преобразуем городские деревья в формат отчетов
    const cityTreeReports = cityTrees.map(tree => {
      return {
        id: tree.id,
        latitude: tree.latitude,
        longitude: tree.longitude,
        coordinates: [tree.latitude, tree.longitude],
        severity: tree.allergenicity || 2,
        type: 'plant',
        plantType: tree.name,
        description: tree.description || tree.name,
        genus: tree.species.split(' ')[0] || tree.name,
        approved: true,
        createdAt: tree.createdAt,
        updatedAt: tree.updatedAt
      };
    });
    
    // Объединяем данные
    const allReports = [...dbReports, ...cityTreeReports];
    console.log(`[reports:GET /] Всего объединено ${allReports.length} отчетов`);
    
    res.json(allReports);
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
    let userId: number;
    let isAdmin = false;

    // Если токен есть, пытаемся получить инфо о пользователе
    if (isAuthenticated) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        // Проверяем, используем ли новый формат (id) или старый (userId)
        userId = decoded.id || decoded.userId;
        isAdmin = decoded.role === 'admin';
      } catch (error) {
        // Если токен недействителен, возвращаем ошибку авторизации
        console.warn('Недействительный токен авторизации');
        return res.status(401).json({ error: 'Требуется авторизация' });
      }
    } else {
      // Требуем авторизацию для создания отчета
      return res.status(401).json({ error: 'Требуется авторизация для создания отчета' });
    }

    // Проверяем обязательные поля в зависимости от типа отчета
    if (type === 'symptom' && !symptom) {
      return res.status(400).json({ error: 'Для отчета о симптоме требуется указать симптом' });
    }
    
    if (type === 'plant' && !plantId) {
      return res.status(400).json({ error: 'Для отчета о растении требуется указать ID растения' });
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
        plantId: plantId ? Number(plantId) : null,
        description,
        userId,
        approved,
        isCalculated: false
      }
    });
    res.status(201).json(report);
  } catch (error) {
    console.error('Ошибка при создании отчета:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании отчета', 
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      stack: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.stack : undefined
    });
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