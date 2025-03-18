import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [192, 512];
const sourceFile = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Создаем директорию для иконок, если её нет
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Генерируем иконки для каждого размера
sizes.forEach(size => {
  sharp(sourceFile)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => {
      console.log(`Generated ${size}x${size} icon`);
    })
    .catch(err => {
      console.error(`Error generating ${size}x${size} icon:`, err);
    });
}); 