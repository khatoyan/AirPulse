/**
 * Improved Pollen Dispersion Model (Gaussian Approach with Urban Adjustments)
 * Calculates approximate pollen concentration at a target point from a tree source.
 * Incorporates urban dispersion coefficients, tilted plume for settling, and source depletion.
 * NOTE: Uses several simplifications and assumed coefficients. Requires calibration
 * and potentially more complex parametrizations for real-world accuracy.
 */

// --- Constants and Parameters ---
const EARTH_RADIUS_METERS = 6371000;
const REF_HEIGHT_METERS = 10; // Standard wind measurement height
const DEFAULT_TREE_HEIGHT = 10; // meters, if data is missing
const DEFAULT_CROWN_DIAMETER = 5; // meters, used if data is missing in Q estimation
const MIN_SIGMA = 0.5; // Minimum dispersion coefficient value (meters) - increased slightly for urban
const MIN_WIND_SPEED = 0.5; // Minimum wind speed (m/s) for model applicability
const TARGET_HEIGHT_DEFAULT = 1.5; // Default breathing height (meters)

// Approximate settling velocities (m/s) - NEEDS VERIFICATION/REFINEMENT
const SETTLING_VELOCITIES = {
    'Береза': 0.02, 'Клен': 0.03, 'Тополь': 0.015, 'Ясень': 0.025,
    'Сосна': 0.03, 'Ель': 0.035, 'Ива': 0.018, 'default': 0.02
};

// Base emission rates (units/s) for healthy, mature trees in peak season - NEEDS CALIBRATION
const BASE_EMISSION_RATES = {
    'Береза': 500, 'Клен': 200, 'Тополь': 300, 'Ясень': 250,
    'Сосна': 50, 'Ель': 40, 'Ива': 150, 'default': 100
};

// Approximate dry deposition velocities v_d (m/s) - HIGHLY SIMPLIFIED, NEEDS LOCAL DATA
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

// Determines Pasquill-Gifford stability class (A-F) - Unchanged
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
        // Assuming solarOrCloud maps to cloud cover (e.g., 'clear_night', 'cloudy_night')
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


// Wind profile exponent 'p' - Unchanged
function getWindProfileExponent(stabilityClass, terrainType) {
    const p_table = {
        open:     { A: 0.10, B: 0.15, C: 0.20, D: 0.25, E: 0.40, F: 0.60 },
        // Suburban/Urban often have higher roughness, less stability dependence near ground
        suburban: { A: 0.15, B: 0.15, C: 0.20, D: 0.25, E: 0.30, F: 0.30 },
        urban:    { A: 0.15, B: 0.20, C: 0.25, D: 0.30, E: 0.40, F: 0.40 }
    };
    const terrainKey = p_table[terrainType] ? terrainType : 'open';
    const classKey = p_table[terrainKey][stabilityClass] ? stabilityClass : 'D';
    return p_table[terrainKey][classKey];
}

// Wind speed at height H - Unchanged
function getWindSpeedAtHeight(windSpeed10m, H, p) {
    if (H <= 0) H = MIN_SIGMA; // Avoid issues at ground level
    // Ensure H is reasonable if adjusted later (e.g. effective height)
    const effH = Math.max(MIN_SIGMA, H);
    const u_H = windSpeed10m * Math.pow(effH / REF_HEIGHT_METERS, p);
    return Math.max(MIN_WIND_SPEED, u_H);
}

// *** IMPROVED: Dispersion Coefficients with Urban Parametrization ***
function getDispersionCoefficients(distanceX, stabilityClass, terrainType) {
    const x = Math.max(1, distanceX); // Ensure distance is at least 1m

    let sigmaY, sigmaZ;

    // --- Urban Parametrization (Based on Briggs Urban, simplified forms) ---
    // These are examples, actual coefficients vary greatly.
    if (terrainType === 'urban' || terrainType === 'suburban') {
        // Sigma-Y (Horizontal) - Often broader in cities due to buildings
        // Using McElroy-Pooler type form: sigma_y = a * x * (1 + c*x)^-0.5
        // Simplified to power law for consistency: sigma_y = a * x^b
        const urban_sy_coeffs = { A: 0.32, B: 0.32, C: 0.22, D: 0.16, E: 0.11, F: 0.11 };
        const urban_sy_exp = 0.71; // ~ fixed exponent often used for urban sigmaY

        // Sigma-Z (Vertical) - Also affected by urban heat island and roughness
        // Using Briggs urban type form: sigma_z = a * x^b
        const urban_sz_coeffs = { A: 0.24, B: 0.20, C: 0.14, D: 0.10, E: 0.08, F: 0.07 }; // Adjusted coefficients
        const urban_sz_exp    = { A: 0.8, B: 0.75, C: 0.7, D: 0.65, E: 0.6, F: 0.55 }; // Exponents vary with stability

        const sy_a = urban_sy_coeffs[stabilityClass] || urban_sy_coeffs['D'];
        const sz_a = urban_sz_coeffs[stabilityClass] || urban_sz_coeffs['D'];
        const sz_b = urban_sz_exp[stabilityClass] || urban_sz_exp['D'];

        sigmaY = sy_a * Math.pow(x, urban_sy_exp);
        sigmaZ = sz_a * Math.pow(x, sz_b);

        // Apply a slight suburban reduction factor if needed (less intense than full urban)
        if (terrainType === 'suburban') {
             sigmaY *= 0.9;
             sigmaZ *= 0.9;
        }

    } else { // Open Country Parametrization (Original simplified Briggs)
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

// Estimate source emission rate Q (units/s) - Unchanged logic, but ensure parameters are calibrated
function estimateEmissionRateQ(tree, weather, timeOfDay) {
    if (weather.precipitationRate > 0.1) return 0; // Rain stops pollen release

    const species = tree.species || 'default';
    const baseQ = BASE_EMISSION_RATES[species] || BASE_EMISSION_RATES['default'];

    const crownD = tree.crownDiameter || DEFAULT_CROWN_DIAMETER;
    // More pronounced effect of crown size? Maybe pow(1.2) or pow(1.5)
    const crownFactor = Math.min(4.0, Math.pow(Math.max(1, crownD) / DEFAULT_CROWN_DIAMETER, 1.2));

    let ageFactor = 1.0;
    if (tree.ageGroup) {
        const lowerAge = tree.ageGroup.toLowerCase();
        if (lowerAge.includes('молод') || lowerAge.includes('саженец')) ageFactor = 0.1;
        else if (lowerAge.includes('стар') || lowerAge.includes('перестойн')) ageFactor = 0.6;
    }

    let stateFactor = 1.0;
    if (tree.state) {
        if (tree.state === 'УД') stateFactor = 0.7; // Satisfactory
        else if (tree.state === 'НЕУД' || tree.state === 'АВАР') stateFactor = 0.2; // Unsatisfactory/Hazardous
    }

    let humidityFactor = 1.0;
    if (weather.relativeHumidityPercent > 90) humidityFactor = 0.1;
    else if (weather.relativeHumidityPercent > 80) humidityFactor = 0.5;
    else if (weather.relativeHumidityPercent > 70) humidityFactor = 0.8;

    let diurnalFactor = (timeOfDay === 'day') ? 1.0 : 0.2; // Less emission at night

    // Consider temperature effect? Pollen release often peaks at certain temps.
    let tempFactor = 1.0;
    // Example: Reduced emission if too cold or potentially too hot (species dependent)
    // if (weather.temperatureCelsius < 10) tempFactor = 0.5;
    // if (weather.temperatureCelsius > 30) tempFactor = 0.8; // Could vary by species

    const Q = baseQ * crownFactor * ageFactor * stateFactor * humidityFactor * diurnalFactor * tempFactor;
    return Math.max(0, Q);
}

// *** IMPROVED: Source Depletion Factor (Simplified Exponential Decay) ***
function calculateSourceDepletionFactor(distanceX, vd, u_H, H, stabilityClass) {
    // This remains a SIGNIFICANT simplification of deposition processes.
    // Real models use complex integrals or deposition velocity dependent on stability/surface.
    // This form tries to capture the main dependencies: increases with vd*x, decreases with u_H*H (mixing height/dilution)
    if (distanceX <= 0 || vd <= 0 || u_H < MIN_WIND_SPEED || H <= 0) return 1.0;

    // Empirical factor 'C' - might depend weakly on stability (e.g., higher C for stable F, lower for unstable A)
    // Using a constant value here as a placeholder.
    const C_depletion = 0.8; // Needs calibration or derivation from more complex models.

    // Argument of the exponent. Using H as a proxy for mixing depth affecting ground interaction.
    const exponentArg = (C_depletion * vd * distanceX) / (u_H * H);

    // Calculate depletion factor Q(x)/Q(0) = exp(-...)
    const depletionFactor = Math.exp(-exponentArg);

    return Math.max(0.01, Math.min(1, depletionFactor)); // Limit depletion between 1% and 100%
}

// --- Main Calculation Function ---

/**
 * Calculates pollen concentration at target point.
 * @param {object} tree - { species, height, crownDiameter, ageGroup, state, lon, lat }
 * @param {object} target - { lon, lat }
 * @param {object} weather - { windSpeed10m, windDirectionDegrees, temperatureCelsius, relativeHumidityPercent, precipitationRate, cloudCover ('strong_solar', 'clear_night' etc.) }
 * @param {string} timeOfDay - 'day' or 'night'
 * @param {string} terrainType - 'open', 'suburban', 'urban'
 * @param {number} [targetZ=1.5] - Height above ground for concentration calculation (m)
 * @returns {number} Approximate concentration (units/m³)
 */
function calculatePollenConcentrationImproved(
    tree, target, weather, timeOfDay, terrainType, targetZ = TARGET_HEIGHT_DEFAULT
) {
    if (!tree || !target || !weather || !timeOfDay || !terrainType || weather.windSpeed10m < MIN_WIND_SPEED) {
        console.warn("Calculation skipped: Missing input or wind speed too low.", { tree, target, weather, timeOfDay, terrainType });
        return 0;
    }

    const H = tree.height || DEFAULT_TREE_HEIGHT; // Physical source height
    const Q_initial = estimateEmissionRateQ(tree, weather, timeOfDay);
    if (Q_initial <= 0) return 0;

    const stabilityClass = getAtmosphericStabilityClass(weather.windSpeed10m, timeOfDay, weather.cloudCover || 'moderate_solar');
    const windExponent = getWindProfileExponent(stabilityClass, terrainType);
    // Calculate wind speed at physical source height H for transport and dilution
    const u_H = getWindSpeedAtHeight(weather.windSpeed10m, H, windExponent);

    const distance = calculateDistance(tree.lat, tree.lon, target.lat, target.lon);
    // Handle very close distances - Gaussian model breaks down here.
    // Return a high value proportional to Q or use a different near-source model?
    if (distance < 5) { // e.g., within 5 meters
        // Very rough estimate for near-source based on initial emission and some volume
        return Q_initial / (u_H * Math.PI * (DEFAULT_CROWN_DIAMETER/2)**2 * 0.5 + 1); // Avoid div by zero, crude
    }

    const bearingToTarget = calculateBearing(tree.lat, tree.lon, target.lat, target.lon);
    // Wind direction is where it comes FROM, plume goes 180 deg opposite
    const windBearing = (weather.windDirectionDegrees + 180) % 360;

    let angleDiff = bearingToTarget - windBearing;
    // Normalize angle difference to [-180, 180]
    if (angleDiff <= -180) angleDiff += 360;
    if (angleDiff > 180) angleDiff -= 360;
    const angleDiffRad = degreesToRadians(angleDiff);

    // Downwind distance (x) and crosswind distance (y)
    const distanceX = distance * Math.cos(angleDiffRad);
    const distanceY = distance * Math.sin(angleDiffRad);

    // If target is upwind or exactly crosswind at source, concentration is ~0
    if (distanceX <= 1.0) return 0; // Use 1m threshold to avoid issues with sigma calc

    // *** USE IMPROVED Dispersion Coefficients ***
    const { sigmaY, sigmaZ } = getDispersionCoefficients(distanceX, stabilityClass, terrainType);
    if (sigmaY <= MIN_SIGMA || sigmaZ <= MIN_SIGMA) {
         console.warn("Calculation warning: Sigmas too small.", { distanceX, stabilityClass, terrainType, sigmaY, sigmaZ });
         return 0; // Dispersion too small / error
    }

    // Get deposition velocity for the terrain
    const vd = DEPOSITION_VELOCITIES[terrainType] || DEPOSITION_VELOCITIES.default;

    // *** USE IMPROVED Source Depletion ***
    const depletionFactor = calculateSourceDepletionFactor(distanceX, vd, u_H, H, stabilityClass);
    const Q_depleted = Q_initial * depletionFactor;
    if (Q_depleted <= 0) return 0;

    // --- Tilted Plume Calculation for Settling ---
    const vs = SETTLING_VELOCITIES[tree.species || 'default'] || SETTLING_VELOCITIES['default'];
    let H_effective = H;
    if (vs > 0 && u_H > 0) {
        // Calculate the drop in effective plume height due to settling
        const heightDrop = (vs * distanceX) / u_H;
        H_effective = H - heightDrop;
    }
    // Ensure effective height doesn't go below ground or a minimum value
    // Ground level reflection assumes plume stops at z=0
    H_effective = Math.max(0, H_effective); // Plume centerline cannot go below ground

    // --- Gaussian Formula Calculation ---
    // Note: Using u_H (wind speed at physical release height) for dilution term 1/(...)u_H
    // Some models use wind speed averaged over plume depth, but u_H is common.

    const term_y = Math.exp(-(distanceY * distanceY) / (2 * sigmaY * sigmaY));

    // Vertical term with ground reflection, using H_effective due to settling (Tilted Plume)
    const term_z1 = Math.exp(-((targetZ - H_effective) ** 2) / (2 * sigmaZ * sigmaZ));
    const term_z2 = Math.exp(-((targetZ + H_effective) ** 2) / (2 * sigmaZ * sigmaZ));
    const vertical_term = term_z1 + term_z2;

    // Check for potential division by zero or very small numbers
    const denominator = (2 * Math.PI * sigmaY * sigmaZ * u_H);
    if (denominator < 1e-9) { // Avoid potential floating point issues
         console.warn("Calculation warning: Denominator near zero.", { sigmaY, sigmaZ, u_H });
         return 0;
    }

    const concentration = (Q_depleted / denominator) * term_y * vertical_term;

    return Math.max(0, concentration); // Concentration cannot be negative
}


// --- Example Usage ---
const myTree = {
    species: 'Береза', height: 20, crownDiameter: 10, ageGroup: 'взрослое',
    state: 'ХОР', lat: 55.0100, lon: 82.9200
};
const myTarget = { lat: 55.0100, lon: 82.9300 }; // ~600m East
const myWeather = {
    windSpeed10m: 3.5, windDirectionDegrees: 270, // West wind -> East
    temperatureCelsius: 20, relativeHumidityPercent: 50,
    precipitationRate: 0, cloudCover: 'moderate_solar' //'partly_cloudy' maps to moderate?
};
const time = 'day';
const terrain = 'urban'; // Use urban terrain

const concentrationResult = calculatePollenConcentrationImproved(
    myTree, myTarget, myWeather, time, terrain, 1.5 // Calculate for 1.5m height
);

console.log(`--- Improved Model Example (Urban) ---`);
const stability = getAtmosphericStabilityClass(myWeather.windSpeed10m, time, myWeather.cloudCover);
console.log(`Tree: ${myTree.species}, H=${myTree.height}, Dcr=${myTree.crownDiameter}`);
console.log(`Weather: Wind ${myWeather.windSpeed10m} m/s from ${myWeather.windDirectionDegrees} deg, RH ${myWeather.relativeHumidityPercent}%, ${myWeather.cloudCover}, ${time}`);
console.log(`Context: Terrain=${terrain}, Stability=${stability}`);
console.log(`Target: (${myTarget.lat}, ${myTarget.lon}) at ${calculateDistance(myTree.lat, myTree.lon, myTarget.lat, myTarget.lon).toFixed(0)} m`);
console.log(`\nApprox. Concentration at 1.5m: ${concentrationResult.toExponential(3)} units/m³`);

// Example: Night, stable conditions
const weatherNightStable = { ...myWeather, windSpeed10m: 1.5, cloudCover: 'clear_night' };
const timeNight = 'night';
const terrainNight = 'urban'; // Still urban
const stabilityNight = getAtmosphericStabilityClass(weatherNightStable.windSpeed10m, timeNight, weatherNightStable.cloudCover);
const concentrationNight = calculatePollenConcentrationImproved(myTree, myTarget, weatherNightStable, timeNight, terrainNight);
console.log(`\n--- Night Example (Urban, Stable) ---`);
console.log(`Weather: Wind ${weatherNightStable.windSpeed10m} m/s, ${weatherNightStable.cloudCover}, ${timeNight}`);
console.log(`Context: Terrain=${terrainNight}, Stability=${stabilityNight}`);
console.log(`Approx. Concentration at 1.5m (Night, Stable): ${concentrationNight.toExponential(3)} units/m³`);

// Example: Suburban terrain, different stability
const weatherSuburbanDay = { ...myWeather, windSpeed10m: 5.5, cloudCover: 'slight_solar' };
const terrainSuburban = 'suburban';
const stabilitySuburban = getAtmosphericStabilityClass(weatherSuburbanDay.windSpeed10m, time, weatherSuburbanDay.cloudCover);
const concentrationSuburban = calculatePollenConcentrationImproved(myTree, myTarget, weatherSuburbanDay, time, terrainSuburban);
console.log(`\n--- Suburban Example (Day, Neutral/Slightly Unstable) ---`);
console.log(`Weather: Wind ${weatherSuburbanDay.windSpeed10m} m/s, ${weatherSuburbanDay.cloudCover}, ${time}`);
console.log(`Context: Terrain=${terrainSuburban}, Stability=${stabilitySuburban}`);
console.log(`Approx. Concentration at 1.5m (Suburban): ${concentrationSuburban.toExponential(3)} units/m³`);