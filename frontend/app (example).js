/*const initialMarkers = [
    // Район площади Ленина
    {
        id: "1",
        lat: 55.0307,
        lng: 82.9200,
        type: "plant",
        plantType: "береза",
        severity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "2",
        lat: 55.0309,
        lng: 82.9205,
        type: "symptom",
        severity: 65,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Чихание"
    },
    {
        id: "3",
        lat: 55.0311,
        lng: 82.9198,
        type: "plant",
        plantType: "тополь",
        severity: 80,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    // Красный проспект
    {
        id: "4",
        lat: 55.0315,
        lng: 82.9203,
        type: "symptom",
        severity: 70,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Заложенность носа"
    },
    {
        id: "5",
        lat: 55.0320,
        lng: 82.9201,
        type: "plant",
        plantType: "амброзия",
        severity: 90,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    // Вокруг оперного театра
    {
        id: "6",
        lat: 55.0305,
        lng: 82.9215,
        type: "symptom",
        severity: 55,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Слезятся глаза"
    },
    {
        id: "7",
        lat: 55.0308,
        lng: 82.9220,
        type: "plant",
        plantType: "береза",
        severity: 85,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "8",
        lat: 55.0312,
        lng: 82.9218,
        type: "symptom",
        severity: 60,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Кашель"
    },
    // Улица Ленина
    {
        id: "9",
        lat: 55.0302,
        lng: 82.9225,
        type: "plant",
        plantType: "тополь",
        severity: 70,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "10",
        lat: 55.0300,
        lng: 82.9230,
        type: "symptom",
        severity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Астма"
    },
    // Продолжаем для других улиц...
    {
        id: "11",
        lat: 55.0295,
        lng: 82.9235,
        type: "plant",
        plantType: "береза",
        severity: 65,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "12",
        lat: 55.0293,
        lng: 82.9240,
        type: "symptom",
        severity: 80,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Сильная аллергия"
    },
    {
        id: "13",
        lat: 55.0290,
        lng: 82.9245,
        type: "plant",
        plantType: "тополь",
        severity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "14",
        lat: 55.0288,
        lng: 82.9250,
        type: "symptom",
        severity: 70,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Зуд в горле"
    },
    // Добавляем точки вокруг центральной части
    {
        id: "15",
        lat: 55.0285,lng: 82.9255,
        type: "plant",
        plantType: "амброзия",
        severity: 85,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    // ... продолжаем до 50 точек с небольшими изменениями координат
    {
        id: "16",
        lat: 55.0283,
        lng: 82.9260,
        type: "symptom",
        severity: 60,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Легкая аллергия"
    },
    {
        id: "17",
        lat: 55.0280,
        lng: 82.9265,
        type: "plant",
        plantType: "береза",
        severity: 70,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "18",
        lat: 55.0278,
        lng: 82.9270,
        type: "symptom",
        severity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Насморк"
    },
    {
        id: "19",
        lat: 55.0275,
        lng: 82.9275,
        type: "plant",
        plantType: "тополь",
        severity: 80,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    },
    {
        id: "20",
        lat: 55.0273,
        lng: 82.9280,
        type: "symptom",
        severity: 65,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: false,
        description: "Першение в горле"
    },
    {
        id: "21",
        lat: 55.0270,
        lng: 82.9285,
        type: "plant",
        plantType: "береза",
        severity: 75,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        verified: true
    }
]*/


function generateTestPoints(count = 1000) {
    // Определяем границы центральной части Новосибирска
    const bounds = {
        lat: {
            min: 55.0200,
            max: 55.0400
        },
        lng: {
            min: 82.9100,
            max: 82.9500
        }
    };

    // Массив типов растений
    const plantTypes = ['береза', 'тополь', 'амброзия', 'ольха', 'клен'];
    
    // Массив возможных симптомов
    const symptoms = [
        'Чихание и насморк',
        'Заложенность носа',
        'Слезятся глаза',
        'Кашель',
        'Затрудненное дыхание',
        'Першение в горле',
        'Головная боль',
        'Зуд в носу',
        'Астматические симптомы',
        'Общая слабость'
    ];

    // Создаем кластеры (центры концентрации)
    const clusters = [
        { lat: 55.0284, lng: 82.9357, name: 'Площадь Ленина' },     // Площадь Ленина
        { lat: 55.0259, lng: 82.9409, name: 'Оперный театр' },      // Оперный театр
        { lat: 55.0298, lng: 82.9275, name: 'Центральный рынок' },  // Центральный рынок
        { lat: 55.0312, lng: 82.9486, name: 'Березовая роща' },     // Березовая роща
        { lat: 55.0342, lng: 82.9377, name: 'Площадь Калинина' }    // Площадь Калинина
    ];

    const points = [];
    const now = new Date();
    const dayStart = new Date(now.setHours(0,0,0,0));

    for (let i = 0; i < count; i++) {
        // Выбираем случайный кластер
        const cluster = clusters[Math.floor(Math.random() * clusters.length)];
        
        // Генерируем точку рядом с кластером (в радиусе ~500 метров)
        const radius = Math.random() * 0.005; // примерно 500 метров
        const angle = Math.random() * 2 * Math.PI;
        const lat = cluster.lat + radius * Math.cos(angle);
        const lng = cluster.lng + radius * Math.sin(angle);

        // Генерируем случайное время в течение дня
        const startHour = Math.floor(Math.random() * 24);
        const duration = Math.floor(Math.random() * 8) + 1; // длительность 1-8 часов
        const startTime = new Date(dayStart);
        startTime.setHours(startHour);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + duration);

        // Определяем тип точки (растение или симптом)
        const isPlant = Math.random() < 0.6; // 60% точек - растения

        const point = {
            id: (i + 1).toString(),
            lat: lat,
            lng: lng,
            type: isPlant ? 'plant' : 'symptom',
            severity: Math.floor(Math.random() * 60) + 40, // от 40 до 99
            startTime: startTime,
            endTime: endTime,
            verified: Math.random() < 0.7, // 70% точек проверены
            cluster: cluster.name
        };

        if (isPlant) {
            point.plantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
        } else {
            point.description = symptoms[Math.floor(Math.random() * symptoms.length)];
        }

        points.push(point);
    }

    // Добавляем несколько "горячих" точек с высокой концентрацией
    clusters.forEach(cluster => {
        // Добавляем 10 точек с высокой severity вокруг каждого кластера
        for (let i = 0; i < 10; i++) {
            const radius = Math.random() * 0.001; // Очень близко к центру кластера
            const angle = Math.random() * 2 * Math.PI;
            const lat = cluster.lat + radius * Math.cos(angle);
            const lng = cluster.lng + radius * Math.sin(angle);

            points.push({
                id: `hot-${cluster.name}-${i}`,
                lat: lat,
                lng: lng,
                type: Math.random() < 0.5 ? 'plant' : 'symptom',
                severity: Math.floor(Math.random() * 20) + 80, // от 80 до 99
                startTime: new Date(dayStart.setHours(Math.floor(Math.random() * 24))),
                endTime: new Date(dayStart.setHours(Math.floor(Math.random() * 24))),
                verified: true,
                plantType: plantTypes[Math.floor(Math.random() * plantTypes.length)],
                description: symptoms[Math.floor(Math.random() * symptoms.length)],
                cluster: cluster.name
            });
        }
    });

    return points;
}

// Использование:
const initialMarkers = generateTestPoints(1000);


// Глобальные переменные
let map;
let heatLayer;
let plantLayer;
let symptomsLayer;
let currentTimeInterval;
let isAddingMarker = false;
let userMarkers = [];

// Константы
const NOVOSIBIRSK_CENTER = [55.0084, 82.9357];
const DEFAULT_ZOOM = 13;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeLayers();
    initializeTimeControls();
    initializeEventListeners();
    loadInitialData();
});


function initializeMap() {
    map = L.map('map').setView(NOVOSIBIRSK_CENTER, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Добавляем базовый зеленый слой
    const baseGreenLayer = L.rectangle(map.getBounds(), {
        color: 'rgba(0, 255, 127, 1)',
        fillColor: 'rgba(0, 255, 127, 1)',
        fillOpacity: 0.15,
        stroke: false
    }).addTo(map);

    map.on('moveend', function() {
        baseGreenLayer.setBounds(map.getBounds());
    });
}


// Инициализация слоев
function initializeLayers() {
    plantLayer = L.layerGroup().addTo(map);
    symptomsLayer = L.layerGroup().addTo(map);
}

// Инициализация временных контролов
function initializeTimeControls() {
    const timeSlider = document.getElementById('timeSlider');
    const currentTimeDisplay = document.getElementById('currentTime');
    
    // Установка начального времени
    const now = new Date();
    timeSlider.value = now.getHours() + now.getMinutes() / 60;
    updateTimeDisplay(timeSlider.value);
    
    timeSlider.addEventListener('input', function() {
        updateTimeDisplay(this.value);
        updateMap(getSelectedDateTime());
    });
}

// Обновление отображения времени
function updateTimeDisplay(value) {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    document.getElementById('currentTime').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Получение выбранной даты и времени
function getSelectedDateTime() {
    const timeValue = document.getElementById('timeSlider').value;
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        Math.floor(timeValue),
        Math.round((timeValue % 1) * 60)
    );
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    document.getElementById('playButton').addEventListener('click', togglePlayback);
    document.getElementById('nowButton').addEventListener('click', setCurrentTime);
    document.getElementById('showPlants').addEventListener('change', function() {
        toggleLayer(plantLayer, this.checked);
    });
    document.getElementById('showSymptoms').addEventListener('change', function() {
        toggleLayer(symptomsLayer, this.checked);
    });
    document.getElementById('addMarker').addEventListener('click', enableMarkerAddition);
}


function loadInitialData() {
    updateMap(new Date());
}


// Обновление карты

function updateMap(selectedTime) {
    clearLayers();
    
    // Объединяем начальные и пользовательские метки
    const allMarkers = [...initialMarkers, ...userMarkers];
    
    const activePoints = allMarkers.filter(point => 
        point.startTime <= selectedTime && 
        point.endTime >= selectedTime
    );
    
    // Сначала обновляем тепловую карту
    updateHeatmap(activePoints);
    
    // Затем добавляем маркеры
    activePoints.forEach(point => {
        addPointToMap(point);
    });
}

// Добавление точки на карту
function addPointToMap(point) {
    const marker = createMarker(point);
    if (point.type === 'plant') {
        plantLayer.addLayer(marker);
    } else {
        symptomsLayer.addLayer(marker);
    }
}

// Создание маркера
function createMarker(point) {
    const marker = L.marker([point.lat, point.lng]);
    
    const popupContent = `
        <div class="popup">
            <h3>${point.type === 'plant' ? point.plantType : 'Симптом'}</h3>
            <p>Уровень: ${point.severity}/100</p>
            ${point.description ? `<p>Описание: ${point.description}</p>` : ''}
            <p>Добавлено: ${point.startTime.toLocaleTimeString()}</p>
            <p>Активно до: ${point.endTime.toLocaleTimeString()}</p>
            ${point.verified ? '<span class="verified">✓ Проверено</span>' : ''}
        </div>
    `;
    
    marker.bindPopup(popupContent);
    return marker;
}



function updateMap(selectedTime) {
    clearLayers();
    
    const allMarkers = [...initialMarkers, ...userMarkers];
    const activePoints = allMarkers.filter(point => 
        point.startTime <= selectedTime && 
        point.endTime >= selectedTime
    );
    
    // Обновляем тепловую карту
    const heatData = activePoints.map(point => [
        point.lat,
        point.lng,
        point.severity
    ]);

    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
    
    heatLayer = L.heatLayer(heatData, {
        radius: 50,
        blur: 70,
        maxZoom: 18,
        minOpacity: 0.3,
        max: 1.0,
        gradient: {
            0.0: 'rgba(0, 255, 0, 0)',           // Прозрачный зеленый
            0.2: 'rgba(150, 255, 0, 0.15)',      // Светло-зеленый
            0.4: 'rgba(255, 255, 0, 0.2)',       // Желтый
            0.6: 'rgba(255, 200, 100, 0.25)',    // Светло-оранжевый
            0.8: 'rgba(255, 140, 0, 0.3)',       // Темно-оранжевый
            1.0: 'rgba(255, 120, 0, 0.35)'       // Еще более темный оранжевый
        }
    }).addTo(map);

    // Добавляем маркеры с низкой прозрачностью
    activePoints.forEach(point => {
        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 3,
            color: 'rgba(255, 0, 0, 0.1)',
            fillColor: 'rgba(255, 0, 0, 0.1)',
            fillOpacity: 0.1,
            weight: 1
        });
        
        if (point.type === 'plant') {
            plantLayer.addLayer(marker);
        } else {
            symptomsLayer.addLayer(marker);
        }
        
        // Добавляем попап при клике
        const popupContent = `
            <div class="popup">
                <h3>${point.type === 'plant' ? point.plantType : 'Симптом'}</h3>
                <p>Уровень: ${point.severity}/100</p>
                ${point.description ? `<p>Описание: ${point.description}</p>` : ''}
                <p>Добавлено: ${point.startTime.toLocaleTimeString()}</p>
                <p>Активно до: ${point.endTime.toLocaleTimeString()}</p>
                ${point.verified ? '<span class="verified">✓ Проверено</span>' : ''}
            </div>
        `;
        marker.bindPopup(popupContent);
    });
}


function clearLayers() {
    plantLayer.clearLayers();
    symptomsLayer.clearLayers();
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
}


// Переключение слоя
function toggleLayer(layer, visible) {
    if (visible) {
        map.addLayer(layer);
    } else {
        map.removeLayer(layer);
    }
}

// Воспроизведение времени
function togglePlayback() {
    if (currentTimeInterval) {
        clearInterval(currentTimeInterval);
        currentTimeInterval = null;
        document.getElementById('playButton').textContent = '▶️ Воспроизвести';
    } else {
        currentTimeInterval = setInterval(() => {
            const timeSlider = document.getElementById('timeSlider');
            let newValue = parseFloat(timeSlider.value) + 0.5;
            if (newValue >= 24) newValue = 0;
            timeSlider.value = newValue;
            updateTimeDisplay(newValue);
            updateMap(getSelectedDateTime());
        }, 1000);
        document.getElementById('playButton').textContent = '⏸️ Пауза';
    }
}

// Установка текущего времени
function setCurrentTime() {
    const now = new Date();
    const timeValue = now.getHours() + now.getMinutes() / 60;
    document.getElementById('timeSlider').value = timeValue;
    updateTimeDisplay(timeValue);
    updateMap(now);
}

// Включение режима добавления меток
function enableMarkerAddition() {
    isAddingMarker = true;
    map.getContainer().style.cursor = 'crosshair';
}

// Форма добавления метки
function showAddMarkerForm(latlng) {
    const form = document.createElement('div');
    form.innerHTML = `
        <div class="marker-form" style="position: absolute; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); background: white; padding: 20px; 
            border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;">
            <h3>Добавить метку</h3>
            <select id="markerType">
                <option value="symptom">Симптом</option>
                <option value="plant">Растение</option>
            </select>
            <select id="plantType" style="display: none;">
                <option value="береза">Береза</option>
                <option value="тополь">Тополь</option>
                <option value="амброзия">Амброзия</option>
            </select>
            <input type="text" id="description" placeholder="Описание">
            <input type="range" id="severity" min="0" max="100" value="50">
            <div>Уровень: <span id="severityValue">50</span></div>
            <button onclick="saveMarker(${latlng.lat}, ${latlng.lng})">Сохранить</button>
            <button onclick="cancelMarkerAdd()">Отмена</button>
        </div>
    `;
    document.body.appendChild(form);

    document.getElementById('markerType').addEventListener('change', function() {
        document.getElementById('plantType').style.display = 
            this.value === 'plant' ? 'block' : 'none';
        });
    
        document.getElementById('severity').addEventListener('input', function() {
            document.getElementById('severityValue').textContent = this.value;
        });
    }
    
    // Сохранение новой метки
    function saveMarker(lat, lng) {
        const type = document.getElementById('markerType').value;
        const severity = parseInt(document.getElementById('severity').value);
        const description = document.getElementById('description').value;
    
        const newMarker = {
            id: Date.now().toString(),
            lat: lat,
            lng: lng,
            type: type,
            severity: severity,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // +1 час
            verified: false,
            description: description
        };
    
        if (type === 'plant') {
            newMarker.plantType = document.getElementById('plantType').value;
        }
    
        userMarkers.push(newMarker);
        updateMap(getSelectedDateTime());
        cancelMarkerAdd();
    }
    
    // Отмена добавления метки
    function cancelMarkerAdd() {
        const form = document.querySelector('.marker-form');
        if (form) {
            form.parentElement.remove();
        }
}