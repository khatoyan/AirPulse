import fs from 'fs';
import path from 'path';

// Интерфейс для городских данных (как в markers.json)
interface CityTreeMarker {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  height?: number;
  trunk_diameter?: number;
}

// Расширенный интерфейс для совместимости с моделью Plant
interface FormattedCityTree {
  id: string;
  name: string;
  species: string;
  description?: string;
  bloomStart?: string;
  bloomEnd?: string;
  allergenicity: number;
  latitude: number;
  longitude: number;
  height?: number;
  crownDiameter?: number;
  trunk_diameter?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Маппинг названий деревьев для получения параметров цветения и аллергенности
const TREE_MAPPING: Record<string, {
  species: string;
  bloomStart: string;
  bloomEnd: string;
  allergenicity: number;
  crownToTrunkRatio: number;
}> = {
  'Береза': {
    species: 'Betula',
    bloomStart: 'апрель',
    bloomEnd: 'май',
    allergenicity: 5,
    crownToTrunkRatio: 30 // Примерное соотношение диаметра кроны к диаметру ствола
  },
  'Сосна': {
    species: 'Pinus',
    bloomStart: 'май',
    bloomEnd: 'июнь',
    allergenicity: 3,
    crownToTrunkRatio: 20
  },
  'Тополь': {
    species: 'Populus',
    bloomStart: 'апрель',
    bloomEnd: 'май',
    allergenicity: 4,
    crownToTrunkRatio: 25
  },
  'Клен': {
    species: 'Acer',
    bloomStart: 'апрель',
    bloomEnd: 'май',
    allergenicity: 3,
    crownToTrunkRatio: 28
  },
  'Липа': {
    species: 'Tilia',
    bloomStart: 'июнь',
    bloomEnd: 'июль',
    allergenicity: 2,
    crownToTrunkRatio: 26
  },
  'Ель': {
    species: 'Picea',
    bloomStart: 'май',
    bloomEnd: 'июнь',
    allergenicity: 2,
    crownToTrunkRatio: 18
  },
  'Дуб': {
    species: 'Quercus',
    bloomStart: 'май',
    bloomEnd: 'июнь',
    allergenicity: 3,
    crownToTrunkRatio: 32
  },
  // Стандартные параметры для неизвестных видов
  'default': {
    species: 'Unknown',
    bloomStart: 'май',
    bloomEnd: 'июнь',
    allergenicity: 2,
    crownToTrunkRatio: 25
  }
};

/**
 * Загружает данные о городских деревьях из JSON файла
 * @param limit Максимальное количество загружаемых объектов (по умолчанию 500)
 */
export async function loadCityTrees(limit: number = 500): Promise<FormattedCityTree[]> {
  try {
    const filePath = path.join(__dirname, '../data/markers.json');
    
    if (!fs.existsSync(filePath)) {
      console.error(`[cityPlantsService] Файл с данными о городских деревьях не найден: ${filePath}`);
      return [];
    }
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    const cityTrees: CityTreeMarker[] = JSON.parse(rawData);
    
    console.log(`[ГОРОДСКИЕ ДЕРЕВЬЯ] Всего городских деревьев в JSON: ${cityTrees.length}`);
    
    // Ограничиваем количество загружаемых объектов
    const limitedTrees = cityTrees.slice(0, limit);
    console.log(`[ГОРОДСКИЕ ДЕРЕВЬЯ] Загружено для использования: ${limitedTrees.length} из ${cityTrees.length} (лимит: ${limit})`);
    
    // Группировка по типам деревьев
    const treeTypes: Record<string, number> = {};
    limitedTrees.forEach(tree => {
      treeTypes[tree.name] = (treeTypes[tree.name] || 0) + 1;
    });
    console.log('[ГОРОДСКИЕ ДЕРЕВЬЯ] Распределение типов деревьев:', treeTypes);
    
    // Преобразуем данные в формат, совместимый с моделью Plant
    const formattedTrees: FormattedCityTree[] = limitedTrees.map((tree, index) => {
      // Получаем соответствующий маппинг для вида дерева или используем значения по умолчанию
      const treeType = TREE_MAPPING[tree.name] || TREE_MAPPING['default'];
      
      // Расчет диаметра кроны из диаметра ствола, если он указан
      let crownDiameter = 0;
      if (tree.trunk_diameter) {
        crownDiameter = tree.trunk_diameter * treeType.crownToTrunkRatio / 100;
      } else {
        // Примерный диаметр кроны по высоте
        crownDiameter = (tree.height || 15) * 0.6;
      }
      
      return {
        id: `city_${index}`,
        name: tree.name,
        species: treeType.species,
        description: `${tree.name}`,
        bloomStart: treeType.bloomStart,
        bloomEnd: treeType.bloomEnd,
        allergenicity: treeType.allergenicity,
        latitude: tree.location.latitude,
        longitude: tree.location.longitude,
        height: tree.height || 15, // Стандартная высота, если не указана
        crownDiameter: crownDiameter,
        trunk_diameter: tree.trunk_diameter,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    return formattedTrees;
  } catch (error) {
    console.error('[cityPlantsService] Ошибка при загрузке городских деревьев:', error);
    return [];
  }
} 