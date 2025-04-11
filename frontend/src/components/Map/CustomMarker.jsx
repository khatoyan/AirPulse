import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import plantIcon from '../../assets/icons/plant-marker.svg';
import symptomIcon from '../../assets/icons/symptom-marker.svg';

// Функция для определения иконки на основе типа отчета
const getMarkerIcon = (reportType, options = {}) => {
  const { size = 20 } = options;
  
  let iconUrl;
  
  switch (reportType) {
    case 'plant':
      iconUrl = plantIcon;
      break;
    default:
      iconUrl = symptomIcon;
  }
  
  return L.icon({
    iconUrl,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const CustomMarker = ({ report, onClick }) => {
  const { lat, lng, type } = report;
  
  // Создаем иконку на основе типа отчета
  const icon = getMarkerIcon(type);
  
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(report),
      }}
    />
  );
};

export default CustomMarker; 