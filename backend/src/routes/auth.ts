import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

// Интерфейс для JWT Payload
interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

// Вспомогательная функция для валидации email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Вспомогательная функция для валидации пароля
const isValidPassword = (password: string): boolean => {
  // Минимум 8 символов, хотя бы одна буква и одна цифра
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

// Промежуточное ПО для валидации запроса регистрации
const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, allergyLevel } = req.body;
  
  // Проверка наличия обязательных полей
  if (!email || !password) {
    return res.status(400).json({ 
      error: true, 
      message: 'Email и пароль обязательны', 
      code: 'MISSING_REQUIRED_FIELDS',
      details: {
        missing: [
          ...(email ? [] : ['email']),
          ...(password ? [] : ['password']),
        ]
      }
    });
  }
  
  // Валидация email
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: true, 
      message: 'Некорректный формат email', 
      code: 'INVALID_EMAIL_FORMAT'
    });
  }
  
  // Валидация пароля
  if (!isValidPassword(password)) {
    return res.status(400).json({ 
      error: true, 
      message: 'Пароль должен содержать минимум 8 символов, включая хотя бы одну букву и одну цифру', 
      code: 'INVALID_PASSWORD_FORMAT'
    });
  }
  
  // Валидация уровня аллергии, если указан
  if (allergyLevel !== undefined && allergyLevel !== null) {
    const level = Number(allergyLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      return res.status(400).json({ 
        error: true, 
        message: 'Уровень аллергии должен быть числом от 1 до 5', 
        code: 'INVALID_ALLERGY_LEVEL'
      });
    }
  }
  
  next();
};

// Регистрация нового пользователя
router.post('/register', validateRegistration, async (req, res) => {
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
      return res.status(400).json({ 
        error: true, 
        message: 'Пользователь с таким email уже существует',
        code: 'EMAIL_ALREADY_EXISTS'
      });
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
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      config.jwtSecret, 
      { 
        expiresIn: config.jwtExpiresIn || '24h' 
      }
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

// Промежуточное ПО для валидации запроса входа
const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  // Проверка наличия обязательных полей
  if (!email || !password) {
    return res.status(400).json({ 
      error: true, 
      message: 'Email и пароль обязательны', 
      code: 'MISSING_REQUIRED_FIELDS',
      details: {
        missing: [
          ...(email ? [] : ['email']),
          ...(password ? [] : ['password']),
        ]
      }
    });
  }
  
  // Валидация email
  if (!isValidEmail(email)) {
    return res.status(400).json({ 
      error: true, 
      message: 'Некорректный формат email', 
      code: 'INVALID_EMAIL_FORMAT'
    });
  }
  
  next();
};

// Вход пользователя
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Если пользователь не найден или пароль не совпадает
    if (!user) {
      return res.status(401).json({ 
        error: true, 
        message: 'Неверный email или пароль', 
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Проверяем пароль
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: true, 
        message: 'Неверный email или пароль', 
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Создаем JWT payload
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Получаем срок действия токена из конфигурации с дефолтным значением '24h'
    const expiresIn = config.jwtExpiresIn || '24h';

    // Создаем JWT токен с правильными типами
    const token = jwt.sign(
      payload,
      String(config.jwtSecret), // Явное приведение к строке
      { expiresIn } as SignOptions
    );

    // Возвращаем токен и данные пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      user: userWithoutPassword, 
      token,
      expiresIn
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Произошла ошибка при попытке входа', 
      code: 'LOGIN_ERROR' 
    });
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