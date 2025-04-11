import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Container, useTheme } from '@mui/material';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const FloweringCalendar = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const location = useLocation();
  
  // Check if we're on the main calendar page or inside a tab
  const isStandalonePage = location.pathname === '/calendar';

  // Функция для нормализации названий растений
  const normalizePlantName = (name) => {
    if (!name) return '';
    
    let normalized = name.trim().toLowerCase();
    
    // Замена 'е' на 'ё' в названиях растений
    if (normalized.includes('берез')) {
      normalized = normalized.replace('берез', 'берёз');
    }
    
    return normalized;
  };

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/plants`);
        
        // Удаляем дубликаты растений, используя Map с именем растения как ключ
        const uniquePlantMap = new Map();
        
        // Стандартизируем названия растений
        const standardizedPlants = response.data.map(plant => {
          if (plant.name.includes('Береза')) {
            return { ...plant, name: plant.name.replace('Береза', 'Берёза') };
          }
          return plant;
        });
        
        standardizedPlants.forEach(plant => {
          const normalizedName = normalizePlantName(plant.name);
          
          // Если растение с таким именем еще не добавлено или текущее имеет более полные данные
          if (!uniquePlantMap.has(normalizedName) || 
              (!uniquePlantMap.get(normalizedName).bloomStart && plant.bloomStart)) {
            uniquePlantMap.set(normalizedName, plant);
          }
        });
        
        // Преобразуем Map обратно в массив и сортируем по имени
        const uniquePlants = Array.from(uniquePlantMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name, 'ru')
        );
        
        console.log(`Получено ${response.data.length} растений, после удаления дубликатов: ${uniquePlants.length}`);
        setPlants(uniquePlants);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching plants data:', error);
        setLoading(false);
      }
    };

    fetchPlants();
  }, []);

  // Helper function to parse month strings into numeric values
  const getMonthNumber = (monthStr) => {
    if (!monthStr) return -1;
    return months.findIndex(m => monthStr.toLowerCase().includes(m.toLowerCase()));
  };

  // Determine if plant is currently blooming
  const isCurrentlyBlooming = (plant) => {
    if (!plant.bloomStart || !plant.bloomEnd) return false;
    
    const currentMonth = new Date().getMonth();
    const startMonth = getMonthNumber(plant.bloomStart);
    const endMonth = getMonthNumber(plant.bloomEnd);
    
    if (startMonth === -1 || endMonth === -1) return false;
    
    if (startMonth <= endMonth) {
      return currentMonth >= startMonth && currentMonth <= endMonth;
    } else {
      // Handle cases that span year boundaries (like Dec to Feb)
      return currentMonth >= startMonth || currentMonth <= endMonth;
    }
  };

  const calendarContent = (
    <Box sx={{ mt: 2, overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', mb: 1 }}>
        <Box sx={{ width: '200px' }}></Box>
        {months.map((month) => (
          <Box 
            key={month} 
            sx={{ 
              flex: 1, 
              textAlign: 'center',
              fontWeight: 'bold',
              minWidth: '60px'
            }}
          >
            {month}
          </Box>
        ))}
      </Box>

      {plants.map((plant) => (
        <Box key={plant.id} sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
          <Box sx={{ 
            width: '200px', 
            pr: 2, 
            fontWeight: 'medium',
            color: isCurrentlyBlooming(plant) ? theme.palette.secondary.main : 'inherit'
          }}>
            {plant.name}
          </Box>
          
          {months.map((month, index) => {
            const startMonth = getMonthNumber(plant.bloomStart);
            const endMonth = getMonthNumber(plant.bloomEnd);
            let isInSeason = false;
            
            if (startMonth !== -1 && endMonth !== -1) {
              if (startMonth <= endMonth) {
                isInSeason = index >= startMonth && index <= endMonth;
              } else {
                isInSeason = index >= startMonth || index <= endMonth;
              }
            }
            
            return (
              <Box 
                key={`${plant.id}-${month}`} 
                sx={{ 
                  flex: 1,
                  height: '30px',
                  backgroundColor: isInSeason ? theme.palette.secondary.main : 'transparent',
                  opacity: isInSeason ? 0.8 : 0.1,
                  borderRadius: '4px',
                  minWidth: '60px',
                  mx: 0.5
                }}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );

  // If it's a standalone page, wrap it in a container
  if (isStandalonePage) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Календарь цветения растений
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Календарь показывает периоды цветения растений, вызывающих аллергические реакции.
            Текущий месяц цветения выделен цветом. Планируйте свои действия в соответствии с периодами цветения аллергенных растений.
          </Typography>
          
          {loading ? (
            <Typography>Загрузка данных...</Typography>
          ) : (
            calendarContent
          )}
        </Paper>
      </Container>
    );
  }
  
  // For tab view, use the original design
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, backgroundColor: theme.palette.background.paper }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Календарь цветения растений
      </Typography>
      
      {loading ? (
        <Typography>Загрузка данных...</Typography>
      ) : (
        calendarContent
      )}
    </Paper>
  );
};

export default FloweringCalendar; 