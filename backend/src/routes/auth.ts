import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      hasAllergy, 
      allergyTypes, 
      allergyLevel 
    } = req.body;

    console.log('Данные регистрации:', {
      email,
      name,
      hasAllergy,
      allergyTypesLength: allergyTypes?.length,
      allergyLevel
    });

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Подготавливаем данные с правильными типами
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: 'user',
      hasAllergy: hasAllergy === true || hasAllergy === 'true' ? true : false,
      allergyTypes: Array.isArray(allergyTypes) ? allergyTypes : [],
      allergyLevel: allergyLevel ? parseInt(allergyLevel.toString(), 10) : null
    };

    console.log('Данные для создания пользователя:', userData);

    // Создаем нового пользователя
    const user = await prisma.user.create({
      data: userData
    });

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Отправляем ответ без пароля
    const { password: _, ...userWithoutPassword } = user;

    // Проверяем правильность формата ответа для отладки
    console.log('Отправляем ответ клиенту:', {
      user: userWithoutPassword,
      token: typeof token === 'string' ? token.substring(0, 20) + '...' : 'null'
    });

    res.status(201).json({
      user: userWithoutPassword,
      token: token // Передаем токен как есть, без дополнительных обработок
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    // Отправляем более подробную информацию об ошибке
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Ошибка при регистрации пользователя', 
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    } else {
      res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
  }
});

// Вход пользователя
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Попытка входа для:', email);

    // Ищем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Отправляем ответ без пароля
    const { password: _, ...userWithoutPassword } = user;
    
    // Важно! Не выполняем дополнительные преобразования токена
    res.json({
      user: userWithoutPassword,
      token: token // Передаем токен как есть, без дополнительной сериализации
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Ошибка при входе в систему' });
  }
});

// Получить текущего пользователя
router.get('/me', async (req, res) => {
  try {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];

    // Проверяем токен
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    
    // Получаем пользователя из базы данных
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Создаем новый токен с актуальной ролью, если роль изменилась
    let newToken = null;
    if (user.role !== (decoded as any).role) {
      newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
    }

    // Отправляем ответ без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      newToken: newToken // Если роль изменилась, отправляем новый токен
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

export const authRouter = router; 