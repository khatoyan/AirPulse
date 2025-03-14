import { Request, Response, NextFunction } from 'express';

// Middleware для логирования запросов
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  // Логируем входящий запрос
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Удаляем пароль из логов
    if (sanitizedBody.password) {
      sanitizedBody.password = '****';
    }
    console.log('Тело запроса:', sanitizedBody);
  }
  
  // Перехватываем отправку ответа для логирования
  res.send = function(body: any): Response {
    // Логируем ответ
    console.log(`${new Date().toISOString()} - Ответ ${res.statusCode}`);
    
    try {
      // Пытаемся распарсить ответ, если это строка
      const bodyToLog = typeof body === 'string' ? JSON.parse(body) : body;
      
      // Создаем копию для логирования
      const sanitizedBody = { ...bodyToLog };
      
      // Если в ответе есть токен, скрываем его частично
      if (sanitizedBody.token) {
        sanitizedBody.token = typeof sanitizedBody.token === 'string' 
          ? sanitizedBody.token.substring(0, 20) + '...' 
          : '[НЕ СТРОКА]';
      }
      
      console.log('Тело ответа:', sanitizedBody);
    } catch (err) {
      console.log('Тело ответа (не-JSON):', typeof body === 'string' ? body.substring(0, 100) : typeof body);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}; 