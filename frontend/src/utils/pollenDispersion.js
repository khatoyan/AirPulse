// Функция для расчета распространения пыльцы на основе уточненной физической модели
// Модифицированная модель Лагранжа для атмосферной дисперсии с учетом турбулентности
// На основе научных публикаций: 
// - Sofiev et al. (2013) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Siljamo et al. (2008) A numerical model of birch pollen emission and dispersion in the atmosphere
// - Helbig et al. (2004) Numerical modelling of pollen dispersion on the regional scale

// Данные о периодах цветения основных аллергенных растений (месяцы начала и конца цветения)
// Источник: Календарь цветения аллергенных растений
const FLOWERING_PERIODS = {
  'береза': { start: 4, end: 5 },    // Апрель-Май
  'ольха': { start: 3, end: 4 },     // Март-Апрель
  'дуб': { start: 4, end: 6 },       // Апрель-Июнь
  'тополь': { start: 3, end: 5 },    // Март-Май
  'ива': { start: 3, end: 5 },       // Март-Май
  'орешник': { start: 2, end: 4 },   // Февраль-Апрель
  'ясень': { start: 4, end: 5 },     // Апрель-Май
  'клен': { start: 4, end: 5 },      // Апрель-Май
  'вяз': { start: 3, end: 5 },       // Март-Май
  'амброзия': { start: 7, end: 10 }, // Июль-Октябрь
  'полынь': { start: 7, end: 9 },    // Июль-Сентябрь
  'лебеда': { start: 6, end: 9 },    // Июнь-Сентябрь
  'крапива': { start: 6, end: 9 },   // Июнь-Сентябрь
  'подорожник': { start: 5, end: 9 }, // Май-Сентябрь
  'злаковые': { start: 5, end: 9 },  // Май-Сентябрь
  'тимофеевка': { start: 6, end: 8 }, // Июнь-Август
  'овсяница': { start: 5, end: 8 },  // Май-Август
  'райграс': { start: 5, end: 9 },   // Май-Сентябрь
  'мятлик': { start: 5, end: 8 },    // Май-Август
  // Добавьте другие растения при необходимости
};

// --- Constants and Parameters for Gaussian Dispersion Model ---
const EARTH_RADIUS_METERS = 6371000;
const REF_HEIGHT_METERS = 10; // Standard wind measurement height
const MIN_SIGMA = 0.5; // Minimum dispersion coefficient value (meters)
const MIN_WIND_SPEED = 0.5; // Minimum wind speed (m/s) for model applicability
const TARGET_HEIGHT_DEFAULT = 1.5; // Default breathing height (meters)

// Default values for missing tree data by species
const DEFAULT_TREE_PARAMS = {
  'береза': { height: 15, crownDiameter: 8, age: 'взрослое' },
  'клен': { height: 20, crownDiameter: 10, age: 'взрослое' },
  'тополь': { height: 25, crownDiameter: 12, age: 'взрослое' },
  'ясень': { height: 18, crownDiameter: 9, age: 'взрослое' },
  'сосна': { height: 22, crownDiameter: 6, age: 'взрослое' },
  'ель': { height: 20, crownDiameter: 5, age: 'взрослое' },
  'ива': { height: 12, crownDiameter: 7, age: 'взрослое' },
  'дуб': { height: 20, crownDiameter: 15, age: 'взрослое' },
  'вяз': { height: 16, crownDiameter: 8, age: 'взрослое' },
  'лиственница': { height: 25, crownDiameter: 7, age: 'взрослое' },
  'рябина': { height: 10, crownDiameter: 6, age: 'взрослое' },
  'липа': { height: 20, crownDiameter: 12, age: 'взрослое' },
  'default': { height: 15, crownDiameter: 6, age: 'взрослое' }
};

// Approximate settling velocities (m/s)
const SETTLING_VELOCITIES = {
  'береза': 0.02, 'клен': 0.03, 'тополь': 0.015, 'ясень': 0.025,
  'сосна': 0.03, 'ель': 0.035, 'ива': 0.018, 'дуб': 0.022,
  'вяз': 0.02, 'лиственница': 0.028, 'рябина': 0.02, 'липа': 0.02,
  'default': 0.02
};

// Base emission rates (units/s) for healthy, mature trees in peak season
const BASE_EMISSION_RATES = {
  'береза': 500, 'клен': 200, 'тополь': 300, 'ясень': 250,
  'сосна': 50, 'ель': 40, 'ива': 150, 'дуб': 400,
  'вяз': 180, 'лиственница': 60, 'рябина': 120, 'липа': 300,
  'default': 100
};

// Approximate dry deposition velocities v_d (m/s)
const DEPOSITION_VELOCITIES = {
  open: 0.01, suburban: 0.015, urban: 0.02, default: 0.01
};

// --- Geometric Helper Functions ---
function degreesToRadians(degrees) { return degrees * Math.PI / 180; }
function radiansToDegrees(radians) { return radians * 180 / Math.PI; }

function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = degreesToRadians(lat1);
  const lambda1 = degreesToRadians(lon1);
  const phi2 = degreesToRadians(lat2);
  const lambda2 = degreesToRadians(lon2);
  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  const theta = Math.atan2(y, x);
  return (radiansToDegrees(theta) + 360) % 360;
}

// --- Meteorological & Physical Functions ---
function getAtmosphericStabilityClass(windSpeed10m, timeOfDay, solarOrCloud) {
  const u = windSpeed10m;
  // Simplified logic based on wind, time, and insolation/cloud cover
  if (timeOfDay === 'day') {
    if (u < 2) {
      if (solarOrCloud === 'strong_solar') return 'A';
      if (solarOrCloud === 'moderate_solar') return 'B';
      if (solarOrCloud === 'slight_solar') return 'C';
    } else if (u < 3) {
      if (solarOrCloud === 'strong_solar') return 'B';
      if (solarOrCloud === 'moderate_solar') return 'B';
      if (solarOrCloud === 'slight_solar') return 'C';
    } else if (u < 5) {
      if (solarOrCloud === 'strong_solar') return 'C';
      if (solarOrCloud === 'moderate_solar') return 'C';
      if (solarOrCloud === 'slight_solar') return 'D';
    } else if (u < 6) {
      if (solarOrCloud === 'strong_solar') return 'C';
      if (solarOrCloud === 'moderate_solar') return 'D';
      if (solarOrCloud === 'slight_solar') return 'D';
    } else { // >= 6
      if (solarOrCloud === 'strong_solar') return 'D';
      if (solarOrCloud === 'moderate_solar') return 'D';
      if (solarOrCloud === 'slight_solar') return 'D';
    }
    if (solarOrCloud === 'cloudy_overcast') return 'D'; // Overcast day -> Neutral
  } else { // night
    if (solarOrCloud === 'clear_night') { // <= 3/8 clouds
      if (u < 2) return 'F'; // Very stable
      if (u < 3) return 'E'; // Stable
      return 'D'; // Neutral near ground at higher wind
    } else { // > 4/8 clouds (cloudy_night)
      if (u < 3) return 'E'; // Stable suppressed by clouds
      if (u < 5) return 'D'; // Neutral
      return 'D'; // Neutral
    }
  }
  // Fallback to Neutral if inputs are unclear
  return 'D';
}

// Wind profile exponent 'p'
function getWindProfileExponent(stabilityClass, terrainType) {
  const p_table = {
    open:     { A: 0.10, B: 0.15, C: 0.20, D: 0.25, E: 0.40, F: 0.60 },
    suburban: { A: 0.15, B: 0.15, C: 0.20, D: 0.25, E: 0.30, F: 0.30 },
    urban:    { A: 0.15, B: 0.20, C: 0.25, D: 0.30, E: 0.40, F: 0.40 }
  };
  const terrainKey = p_table[terrainType] ? terrainType : 'open';
  const classKey = p_table[terrainKey][stabilityClass] ? stabilityClass : 'D';
  return p_table[terrainKey][classKey];
}

// Wind speed at height H
function getWindSpeedAtHeight(windSpeed10m, H, p) {
  if (H <= 0) H = MIN_SIGMA; // Avoid issues at ground level
  const effH = Math.max(MIN_SIGMA, H);
  const u_H = windSpeed10m * Math.pow(effH / REF_HEIGHT_METERS, p);
  return Math.max(MIN_WIND_SPEED, u_H);
}

// Dispersion Coefficients with Urban Parametrization
function getDispersionCoefficients(distanceX, stabilityClass, terrainType) {
  const x = Math.max(1, distanceX); // Ensure distance is at least 1m
  let sigmaY, sigmaZ;

  if (terrainType === 'urban' || terrainType === 'suburban') {
    // Sigma-Y (Horizontal) - Often broader in cities due to buildings
    const urban_sy_coeffs = { A: 0.32, B: 0.32, C: 0.22, D: 0.16, E: 0.11, F: 0.11 };
    const urban_sy_exp = 0.71; // ~ fixed exponent often used for urban sigmaY

    // Sigma-Z (Vertical) - Also affected by urban heat island and roughness
    const urban_sz_coeffs = { A: 0.24, B: 0.20, C: 0.14, D: 0.10, E: 0.08, F: 0.07 };
    const urban_sz_exp    = { A: 0.8, B: 0.75, C: 0.7, D: 0.65, E: 0.6, F: 0.55 };

    const sy_a = urban_sy_coeffs[stabilityClass] || urban_sy_coeffs['D'];
    const sz_a = urban_sz_coeffs[stabilityClass] || urban_sz_coeffs['D'];
    const sz_b = urban_sz_exp[stabilityClass] || urban_sz_exp['D'];

    sigmaY = sy_a * Math.pow(x, urban_sy_exp);
    sigmaZ = sz_a * Math.pow(x, sz_b);

    // Apply a slight suburban reduction factor if needed
    if (terrainType === 'suburban') {
      sigmaY *= 0.9;
      sigmaZ *= 0.9;
    }
  } else { // Open Country Parametrization
    const sy_coeffs_open = { A: 0.22, B: 0.16, C: 0.11, D: 0.08, E: 0.06, F: 0.04 };
    const sy_exp_open    = 0.9; // Simplified: b ~ 0.9
    const sz_coeffs_open = { A: 0.20, B: 0.12, C: 0.08, D: 0.06, E: 0.03, F: 0.016 };
    const sz_exp_open    = { A: 0.9, B: 0.9, C: 0.85, D: 0.8, E: 0.7, F: 0.65 };

    const sy_a = sy_coeffs_open[stabilityClass] || sy_coeffs_open['D'];
    const sy_b = sy_exp_open;
    const sz_a = sz_coeffs_open[stabilityClass] || sz_coeffs_open['D'];
    const sz_b = sz_exp_open[stabilityClass] || sz_exp_open['D'];

    sigmaY = sy_a * Math.pow(x, sy_b);
    sigmaZ = sz_a * Math.pow(x, sz_b);
  }

  return {
    sigmaY: Math.max(MIN_SIGMA, sigmaY),
    sigmaZ: Math.max(MIN_SIGMA, sigmaZ)
  };
}

// Estimate source emission rate Q (units/s)
function estimateEmissionRateQ(tree, weather, timeOfDay) {
  if (!tree) return 0;
  if (weather && weather.precipitation > 0.1) return 0; // Rain stops pollen release

  // Нормализуем название породы дерева
  let speciesNormalized = 'default';
  if (tree.species) {
    speciesNormalized = tree.species.toLowerCase();
  } else if (tree.allergen) {
    speciesNormalized = tree.allergen.toLowerCase();
  } else if (tree.plantType) {
    speciesNormalized = tree.plantType.toLowerCase();
  }
  
  // Ищем соответствие в базе видов
  let species = 'default';
  for (const knownSpecies of Object.keys(BASE_EMISSION_RATES)) {
    if (speciesNormalized.includes(knownSpecies) || knownSpecies.includes(speciesNormalized)) {
      species = knownSpecies;
      break;
    }
  }
  
  const baseQ = BASE_EMISSION_RATES[species] || BASE_EMISSION_RATES['default'];

  // Используем диаметр кроны из данных или берем стандартный для породы
  let crownD = tree.crownDiameter;
  if (!crownD && DEFAULT_TREE_PARAMS[species]) {
    crownD = DEFAULT_TREE_PARAMS[species].crownDiameter;
  } else if (!crownD) {
    crownD = DEFAULT_TREE_PARAMS['default'].crownDiameter;
  }

  // Более выраженный эффект размера кроны
  const crownFactor = Math.min(4.0, Math.pow(Math.max(1, crownD) / 5, 1.2));

  // Определяем возрастной коэффициент
  let ageFactor = 1.0;
  let ageGroup = tree.ageGroup || (DEFAULT_TREE_PARAMS[species] ? DEFAULT_TREE_PARAMS[species].age : 'взрослое');
  
  if (ageGroup) {
    const lowerAge = String(ageGroup).toLowerCase();
    if (lowerAge.includes('молод') || lowerAge.includes('саженец')) ageFactor = 0.1;
    else if (lowerAge.includes('стар') || lowerAge.includes('перестойн')) ageFactor = 0.6;
  }

  // Определяем коэффициент состояния дерева
  let stateFactor = 1.0;
  if (tree.state) {
    if (tree.state === 'УД') stateFactor = 0.7; // Satisfactory
    else if (tree.state === 'НЕУД' || tree.state === 'АВАР') stateFactor = 0.2; // Unsatisfactory/Hazardous
  }

  // Влажность воздуха
  let humidityFactor = 1.0;
  if (weather && weather.humidity !== undefined) {
    if (weather.humidity > 90) humidityFactor = 0.1;
    else if (weather.humidity > 80) humidityFactor = 0.5;
    else if (weather.humidity > 70) humidityFactor = 0.8;
  }

  // День или ночь
  let diurnalFactor = (timeOfDay === 'day') ? 1.0 : 0.2; // Less emission at night

  // Влияние температуры
  let tempFactor = 1.0;
  if (weather && weather.temperature !== undefined) {
    if (weather.temperature < 10) tempFactor = 0.5;
    if (weather.temperature > 30) tempFactor = 0.8;
  }

  const Q = baseQ * crownFactor * ageFactor * stateFactor * humidityFactor * diurnalFactor * tempFactor;
  return Math.max(0, Q);
}

// Source Depletion Factor (Simplified Exponential Decay)
function calculateSourceDepletionFactor(distanceX, vd, u_H, H, stabilityClass) {
  if (distanceX <= 0 || vd <= 0 || u_H < MIN_WIND_SPEED || H <= 0) return 1.0;

  const C_depletion = 0.8;
  const exponentArg = (C_depletion * vd * distanceX) / (u_H * H);
  const depletionFactor = Math.exp(-exponentArg);

  return Math.max(0.01, Math.min(1, depletionFactor));
}

// Функция для расчета концентрации по модели Гаусса
function calculatePollenConcentrationGaussian(tree, target, weather, timeOfDay, terrainType, targetZ = TARGET_HEIGHT_DEFAULT) {
  if (!tree || !target || !weather || !timeOfDay || !terrainType) {
    return 0;
  }

  // Get tree height or use default for the species
  let speciesNormalized = 'default';
  if (tree.species) {
    speciesNormalized = tree.species.toLowerCase();
  } else if (tree.allergen) {
    speciesNormalized = tree.allergen.toLowerCase();
  } else if (tree.plantType) {
    speciesNormalized = tree.plantType.toLowerCase();
  }
  
  // Find matching species
  let species = 'default';
  for (const knownSpecies of Object.keys(DEFAULT_TREE_PARAMS)) {
    if (speciesNormalized.includes(knownSpecies) || knownSpecies.includes(speciesNormalized)) {
      species = knownSpecies;
      break;
    }
  }
  
  const treeHeight = tree.height || (DEFAULT_TREE_PARAMS[species] ? DEFAULT_TREE_PARAMS[species].height : DEFAULT_TREE_PARAMS['default'].height);
  
  // Get or estimate emission rate
  const Q_initial = estimateEmissionRateQ(tree, weather, timeOfDay);
  if (Q_initial <= 0) return 0;

  const safeWindSpeed = typeof weather.windSpeed === 'number' && !isNaN(weather.windSpeed) ? 
    Math.max(MIN_WIND_SPEED, weather.windSpeed) : MIN_WIND_SPEED;
  
  const safeWindDirection = typeof weather.windDirection === 'number' && !isNaN(weather.windDirection) ? 
    weather.windDirection : 0;
  
  let cloudCover = 'moderate_solar';
  if (weather.description) {
    const desc = weather.description.toLowerCase();
    if (desc.includes('clear') || desc.includes('ясно')) {
      cloudCover = timeOfDay === 'day' ? 'strong_solar' : 'clear_night';
    } else if (desc.includes('cloud') || desc.includes('облач')) {
      cloudCover = timeOfDay === 'day' ? 'slight_solar' : 'cloudy_night';
    } else if (desc.includes('overcast') || desc.includes('пасмурн')) {
      cloudCover = 'cloudy_overcast';
    }
  }
  
  const stabilityClass = getAtmosphericStabilityClass(safeWindSpeed, timeOfDay, cloudCover);
  const windExponent = getWindProfileExponent(stabilityClass, terrainType);
  const u_H = getWindSpeedAtHeight(safeWindSpeed, treeHeight, windExponent);

  // Calculate distance and bearing
  const distance = calculateDistance(tree.latitude, tree.longitude, target.latitude, target.longitude);
  
  // For very close distances, use a simplified model
  if (distance < 5) {
    const crownD = tree.crownDiameter || (DEFAULT_TREE_PARAMS[species] ? 
      DEFAULT_TREE_PARAMS[species].crownDiameter : DEFAULT_TREE_PARAMS['default'].crownDiameter);
    return Q_initial / (u_H * Math.PI * (crownD/2)**2 * 0.5 + 1);
  }

  const bearingToTarget = calculateBearing(tree.latitude, tree.longitude, target.latitude, target.longitude);
  const windBearing = (safeWindDirection + 180) % 360;

  let angleDiff = bearingToTarget - windBearing;
  if (angleDiff <= -180) angleDiff += 360;
  if (angleDiff > 180) angleDiff -= 360;
  const angleDiffRad = degreesToRadians(angleDiff);

  // Downwind and crosswind distances
  const distanceX = distance * Math.cos(angleDiffRad);
  const distanceY = distance * Math.sin(angleDiffRad);

  // If target is upwind or exactly crosswind, concentration is ~0
  if (distanceX <= 1.0) return 0;

  // Get dispersion coefficients
  const { sigmaY, sigmaZ } = getDispersionCoefficients(distanceX, stabilityClass, terrainType);
  if (sigmaY <= MIN_SIGMA || sigmaZ <= MIN_SIGMA) return 0;

  // Get deposition velocity and calculate source depletion
  const vd = DEPOSITION_VELOCITIES[terrainType] || DEPOSITION_VELOCITIES.default;
  const depletionFactor = calculateSourceDepletionFactor(distanceX, vd, u_H, treeHeight, stabilityClass);
  const Q_depleted = Q_initial * depletionFactor;
  if (Q_depleted <= 0) return 0;

  // Account for settling velocity
  const vs = SETTLING_VELOCITIES[species] || SETTLING_VELOCITIES['default'];
  let H_effective = treeHeight;
  if (vs > 0 && u_H > 0) {
    const heightDrop = (vs * distanceX) / u_H;
    H_effective = treeHeight - heightDrop;
  }
  H_effective = Math.max(0, H_effective);

  // Calculate Gaussian concentration
  const term_y = Math.exp(-(distanceY * distanceY) / (2 * sigmaY * sigmaY));
  const term_z1 = Math.exp(-((targetZ - H_effective) ** 2) / (2 * sigmaZ * sigmaZ));
  const term_z2 = Math.exp(-((targetZ + H_effective) ** 2) / (2 * sigmaZ * sigmaZ));
  const vertical_term = term_z1 + term_z2;

  const denominator = (2 * Math.PI * sigmaY * sigmaZ * u_H);
  if (denominator < 1e-9) return 0;

  const concentration = (Q_depleted / denominator) * term_y * vertical_term;
  return Math.max(0, concentration);
}

// Функция проверки, находится ли растение в периоде цветения
const isPlantFlowering = (plantType, currentDate = new Date()) => {
  // Если тип растения не указан или не найден в базе данных периодов цветения, 
  // предполагаем, что это не растение или неизвестный тип (возвращаем true для безопасности)
  if (!plantType || typeof plantType !== 'string') return true;
  
  // Нормализуем имя растения (убираем пробелы, приводим к нижнему регистру)
  const normalizedPlantType = plantType.trim().toLowerCase();
  
  // Для симптомов и других типов отчетов (не растения) всегда возвращаем true
  if (normalizedPlantType === 'unknown' || 
      normalizedPlantType === 'симптом' || 
      normalizedPlantType === 'symptom') {
    return true;
  }
  
  // Ищем соответствие в базе данных периодов цветения
  let period = null;
  
  // Проходим по всем известным растениям и ищем частичное совпадение
  for (const [plant, flowPeriod] of Object.entries(FLOWERING_PERIODS)) {
    if (normalizedPlantType.includes(plant) || plant.includes(normalizedPlantType)) {
      period = flowPeriod;
      break;
    }
  }
  
  // Если период не найден, предполагаем, что растение может цвести (возвращаем true для безопасности)
  if (!period) return true;
  
  // Получаем текущий месяц (1-12)
  const currentMonth = currentDate.getMonth() + 1;
  
  // Проверяем, находится ли текущий месяц в периоде цветения
  if (period.start <= period.end) {
    // Обычный период (например, Апрель-Июнь)
    return currentMonth >= period.start && currentMonth <= period.end;
  } else {
    // Период, переходящий через конец года (например, Ноябрь-Февраль)
    return currentMonth >= period.start || currentMonth <= period.end;
  }
};

// Функции расчета коэффициентов влияния погодных факторов
const getTemperatureCoefficient = (temperature) => {
  if (temperature === undefined || temperature === null) return 1.0;
  
  if (temperature < 5) return 0.6;  // снижение при низких температурах
  if (temperature > 35) return 0.7; // снижение при высоких температурах
  if (temperature >= 20 && temperature <= 25) return 1.4; // усиление при оптимальной температуре
  return 1.0; // нейтральное влияние
};

const getHumidityCoefficient = (humidity) => {
  if (humidity === undefined || humidity === null) return 1.0;
  
  if (humidity > 80) return 0.5; // значительное снижение при высокой влажности
  if (humidity < 30) return 1.3; // усиление при низкой влажности
  if (humidity >= 40 && humidity <= 60) return 1.2; // умеренное усиление при оптимальной влажности
  return 1.0; // нейтральное влияние
};

const getRainCoefficient = (precipitation) => {
  if (precipitation === undefined || precipitation === null) return 1.0;
  
  if (precipitation > 5) return 0.4; // сильное снижение при дожде
  if (precipitation > 0 && precipitation <= 5) return 0.7; // умеренное снижение при небольшом дожде
  return 1.0; // без осадков - нейтральное влияние
};

// Основная функция расчета распространения пыльцы
export const calculatePollenDispersion = (reports, windSpeed, windDirection, timeIndex = null, weatherData = {}) => {
  // Проверка входных параметров
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    console.warn('Нет отчетов для расчета распространения пыльцы');
    return [];
  }
  
  // Гарантируем, что windSpeed и windDirection - числа
  const safeWindSpeed = typeof windSpeed === 'number' && !isNaN(windSpeed) ? windSpeed : 0;
  const safeWindDirection = typeof windDirection === 'number' && !isNaN(windDirection) ? windDirection : 0;
  
  if (safeWindSpeed !== windSpeed || safeWindDirection !== windDirection) {
    console.warn('Скорректированы параметры ветра:', {
      исходная_скорость: windSpeed,
      исправленная_скорость: safeWindSpeed,
      исходное_направление: windDirection,
      исправленное_направление: safeWindDirection
    });
  }
  
  // Лимитируем количество точек для производительности
  const maxSourcePoints = 50;
  const limitedReports = reports.length > maxSourcePoints 
    ? reports.slice(0, maxSourcePoints) 
    : reports;

  console.log(`Расчет распространения пыльцы для ${limitedReports.length} отчетов с ветром ${safeWindSpeed} м/с, ${safeWindDirection}°`);
  
  if (timeIndex !== null) {
    console.log(`Расчет для временной точки ${timeIndex}`);
  }
  
  // Определяем тип местности (для коэффициентов дисперсии)
  // По умолчанию используем suburban как промежуточный вариант
  const terrainType = weatherData.terrainType || 'suburban';
  
  // Определяем время дня
  const currentHour = new Date().getHours();
  const timeOfDay = (currentHour >= 7 && currentHour <= 19) ? 'day' : 'night';
  
  // Создаем объект погоды для передачи в модель Гаусса
  const weather = {
    windSpeed: safeWindSpeed,
    windDirection: safeWindDirection,
    temperature: weatherData.temperature,
    humidity: weatherData.humidity,
    precipitation: weatherData.precipitation || 0,
    pressure: weatherData.pressure,
    description: weatherData.description
  };
  
  // Создаем массив для рассчитанных точек
  const dispersedPoints = [];
  
  // Получаем текущую дату для проверки периода цветения
  const currentDate = new Date();
  
  try {
    // Для каждого исходного отчета
    limitedReports.forEach(report => {
      // Проверяем, что у отчета есть координаты
      if (!report || !report.latitude || !report.longitude) {
        return; // Пропускаем отчеты без координат
      }
    
      const lat = parseFloat(report.latitude);
      const lng = parseFloat(report.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn('Некорректные координаты:', { lat, lng });
        return;
      }
      
      // Определяем тип аллергена и интенсивность
      const allergenType = report.allergen || report.plantType || 'unknown';
      const intensity = Math.min(Math.max(report.severity || 5, 1), 5); // Ограничиваем интенсивность от 1 до 5
      
      // ВАЖНО: Проверяем, находится ли растение в периоде цветения
      // Если это растение и оно не цветет сейчас - не генерируем точки распространения
      if (report.type === 'plant' && !isPlantFlowering(allergenType, currentDate)) {
        console.log(`Растение ${allergenType} не цветет в текущем месяце, пропускаем расчет распространения`);
        return;
      }
      
      // Подготавливаем объект дерева/источника для модели Гаусса
      const treeSource = {
        species: allergenType,
        allergen: allergenType,
        plantType: allergenType,
        latitude: lat,
        longitude: lng,
        height: report.height,
        crownDiameter: report.crownDiameter,
        ageGroup: report.ageGroup,
        state: report.state,
        severity: intensity
      };
      
      // Определяем количество генерируемых точек для этого источника
      // Используем больше точек для улучшения визуализации
      const pointsPerSource = 20;
      
      // Радиус расчета концентрации
      const maxDistance = Math.max(500, safeWindSpeed * 500); // Минимум 500м, увеличивается с силой ветра
      
      // Генерируем сетку точек для расчета концентрации
      for (let i = 0; i < pointsPerSource; i++) {
        // Для более реалистичной дисперсии используем:
        // 1. Преимущественное распространение по ветру (downwind)
        // 2. Меньшее распространение против ветра (upwind)
        // 3. Среднее распространение перпендикулярно ветру (crosswind)
        
        // Случайное направление с биасом по ветру 
        let randomAngle;
        const r = Math.random();
        if (r < 0.7) {
          // 70% точек в направлении ветра +/- 45 градусов
          randomAngle = degreesToRadians(safeWindDirection + 180 + (Math.random() * 90 - 45));
        } else if (r < 0.9) {
          // 20% точек перпендикулярно ветру +/- 30 градусов
          const perpDirection = (safeWindDirection + 180 + 90) % 360;
          randomAngle = degreesToRadians(perpDirection + (Math.random() * 60 - 30));
        } else {
          // 10% точек против ветра +/- 30 градусов (меньшая дистанция)
          randomAngle = degreesToRadians(safeWindDirection + (Math.random() * 60 - 30));
        }
        
        // Расстояние от источника, распределенное по экспоненте (больше точек ближе к источнику)
        // Для точек против ветра используем меньшее расстояние
        const distanceScale = (r < 0.9) ? 1.0 : 0.3; // Уменьшенная дистанция против ветра
        const distanceFactor = Math.pow(Math.random(), 0.7); // Смещение распределения к меньшим значениям
        const distance = maxDistance * distanceFactor * distanceScale;
        
        // Рассчитываем новые координаты
        const dx = Math.sin(randomAngle) * distance;
        const dy = Math.cos(randomAngle) * distance;
        
        // Преобразуем смещение в градусы
        const latFactor = 1 / 111000; // примерно 111 км на градус широты
        const lngFactor = 1 / (111000 * Math.cos((lat * Math.PI) / 180)); // поправка на долготу
        
        const newLat = lat + dy * latFactor;
        const newLng = lng + dx * lngFactor;
        
        // Проверяем валидность новых координат
        if (isNaN(newLat) || isNaN(newLng)) {
          console.warn('Некорректные координаты после расчета:', { newLat, newLng });
          continue;
        }
        
        // Создаем объект целевой точки для расчета концентрации
        const targetPoint = {
          latitude: newLat,
          longitude: newLng
        };
        
        // Вычисляем концентрацию пыльцы в точке по модели Гаусса
        const concentration = calculatePollenConcentrationGaussian(
          treeSource,
          targetPoint,
          weather,
          timeOfDay,
          terrainType
        );
        
        // Если концентрация слишком мала, пропускаем точку
        if (concentration < 0.01) continue;
        
        // Преобразуем концентрацию в шкалу интенсивности от 1 до 5
        // Используем логарифмическую шкалу для лучшего распределения
        const concentrationScale = Math.log10(concentration + 1) * 2;
        const newIntensity = Math.max(1, Math.min(5, Math.ceil(concentrationScale)));
        
        // Добавляем точку в массив только если есть значимая концентрация
        if (newIntensity >= 1) {
          dispersedPoints.push({
            latitude: newLat,
            longitude: newLng,
            type: 'calculated',
            severity: newIntensity,
            allergen: allergenType,
            parentAllergen: allergenType,
            isCalculated: true,
            timestamp: report.timestamp || new Date().toISOString(),
            weatherFactors: {
              temperature: weather.temperature,
              humidity: weather.humidity,
              precipitation: weather.precipitation,
              windSpeed: safeWindSpeed,
              windDirection: safeWindDirection,
              concentration: concentration.toExponential(3),
              stabilityClass: getAtmosphericStabilityClass(
                safeWindSpeed, 
                timeOfDay, 
                weather.description ? 
                  (weather.description.toLowerCase().includes('clear') ? 'strong_solar' : 'moderate_solar') 
                  : 'moderate_solar'
              )
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('Ошибка при расчете распространения пыльцы:', error);
    return [];
  }
  
  console.log(`Сгенерировано ${dispersedPoints.length} точек распространения по модели Гаусса`);
  return dispersedPoints;
};

// Оптимизированная функция для объединения перекрывающихся зон
export const mergeOverlappingZones = (points, radius = 100) => {
  if (!points || points.length === 0) return [];

  // Фильтруем невалидные точки
  const validPoints = points.filter(point => 
    typeof point.latitude === 'number' && 
    typeof point.longitude === 'number' && 
    !isNaN(point.latitude) && 
    !isNaN(point.longitude)
  );
  
  if (validPoints.length === 0) return [];

  // Используем пространственную индексацию для ускорения поиска соседей
  // Оптимизированная сетка для 2D пространства
  const GRID_SIZE = radius * 2;
  const grid = new Map();
  
  // Помещаем точки в сетку с оптимизированной структурой данных
  validPoints.forEach((point, i) => {
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    const key = `${gridX},${gridY}`;
    
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push({ point, index: i });
  });
  
  const merged = [];
  const processed = new Set();
  
  // Оптимизированная обработка каждой точки
  validPoints.forEach((point, i) => {
    if (processed.has(i)) return;
    
    let cluster = [{ point, weight: point.severity || 1 }];
    let totalWeight = point.severity || 1;
    processed.add(i);
    
    // Поиск соседей в 9 ячейках сетки (текущая + 8 окружающих)
    const gridX = Math.floor(point.longitude / GRID_SIZE);
    const gridY = Math.floor(point.latitude / GRID_SIZE);
    
    // Оптимизированный поиск соседей
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cellPoints = grid.get(key) || [];
        
        // Используем раннее прерывание для оптимизации
        if (cellPoints.length === 0) continue;
        
        for (const { point: neighbor, index: j } of cellPoints) {
          if (i !== j && !processed.has(j)) {
            const distance = getDistance(point, neighbor);
            
            if (distance <= radius) {
              cluster.push({ point: neighbor, weight: neighbor.severity || 1 });
              totalWeight += (neighbor.severity || 1);
              processed.add(j);
            }
          }
        }
      }
    }
    
    // Если нашли кластер, вычисляем средневзвешенную точку
    if (cluster.length > 1) {
      const mergedPoint = { ...point };
      
      // Оптимизированный расчет средневзвешенных координат
      const latSum = cluster.reduce((sum, item) => sum + (item.point.latitude * item.weight), 0);
      const lngSum = cluster.reduce((sum, item) => sum + (item.point.longitude * item.weight), 0);
      
      mergedPoint.latitude = latSum / Math.max(0.1, totalWeight);
      mergedPoint.longitude = lngSum / Math.max(0.1, totalWeight);
      
      // Проверка на валидность
      if (isNaN(mergedPoint.latitude) || isNaN(mergedPoint.longitude)) {
        console.warn('Невалидные координаты после слияния:', mergedPoint);
        return;
      }
      
      // Оптимизированный расчет средней интенсивности с учетом весов
      mergedPoint.severity = Math.min(100, 
        cluster.reduce((sum, item) => sum + (item.point.severity || 1) * item.weight, 0) / totalWeight
      );
      
      merged.push(mergedPoint);
    } else {
      merged.push(point);
    }
  });
  
  return merged;
};

// Вспомогательная функция для расчета расстояния между точками
// Оптимизирована для скорости - использует приближенную формулу при малых расстояниях
const getDistance = (point1, point2) => {
  // Проверка валидности точек
  if (!point1 || !point2 || 
      typeof point1.latitude !== 'number' || typeof point1.longitude !== 'number' ||
      typeof point2.latitude !== 'number' || typeof point2.longitude !== 'number' ||
      isNaN(point1.latitude) || isNaN(point1.longitude) ||
      isNaN(point2.latitude) || isNaN(point2.longitude)) {
    return Infinity; // Невалидные точки считаем бесконечно удаленными
  }

  // Для близких точек используем упрощенную формулу (быстрее)
  const deltaLat = Math.abs(point1.latitude - point2.latitude);
  const deltaLng = Math.abs(point1.longitude - point2.longitude);
  
  if (deltaLat < 0.01 && deltaLng < 0.01) {
    // Приближение для малых расстояний (в метрах)
    const cosLat = Math.max(0.01, Math.cos(point1.latitude * Math.PI / 180));
    const dx = deltaLng * 111111 * cosLat;
    const dy = deltaLat * 111111;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Для больших расстояний используем точную формулу Хаверсина
  const R = 6371e3; // радиус Земли в метрах
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}; 