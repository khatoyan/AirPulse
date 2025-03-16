// Генерация PNG из SVG с помощью встроенного Canvas API
// Этот скрипт можно запустить вручную при необходимости обновить иконку

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Размер итогового PNG
const size = 32;

async function generateFavicon() {
  try {
    // Создаем Canvas указанного размера
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Загружаем SVG с фона
    const svg = fs.readFileSync('./public/favicon.svg', 'utf8');
    
    // Создаем Data URL для SVG
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    
    // Загружаем изображение
    const img = await loadImage(svgDataUrl);
    
    // Рисуем изображение на канвасе
    ctx.drawImage(img, 0, 0, size, size);
    
    // Получаем PNG данные
    const buffer = canvas.toBuffer('image/png');
    
    // Сохраняем PNG файл
    fs.writeFileSync('./public/favicon.png', buffer);
    
    console.log('Favicon PNG успешно создан!');
  } catch (error) {
    console.error('Ошибка при создании иконки:', error);
  }
}

// Вызываем функцию генерации
generateFavicon();

/* 
Для запуска этого скрипта необходимо установить node-canvas:
npm install canvas

Затем запустить скрипт:
node public/generate-favicon.js
*/ 