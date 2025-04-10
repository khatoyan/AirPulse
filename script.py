
import json
import random

# Географические границы Новосибирска (примерно)
min_lon, max_lon = 82.75, 83.15
min_lat, max_lat = 54.80, 55.15

# Генерация случайных точек
features = []
for i in range(1000):
    lon = random.uniform(min_lon, max_lon)
    lat = random.uniform(min_lat, max_lat)
    
    feature = {
        "type": "Feature",
        "properties": {
            "id": i + 1,
            "name": f"Точка {i + 1}",
            "description": f"Рандомная локация #{i + 1} в Новосибирске"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [round(lon, 6), round(lat, 6)]
        }
    }
    features.append(feature)

# Создание GeoJSON
geojson = {
    "type": "FeatureCollection",
    "features": features
}

# Сохранение в файл
with open('novosibirsk_1000_points.geojson', 'w', encoding='utf-8') as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)

print("Файл novosibirsk_1000_points.geojson успешно создан!")