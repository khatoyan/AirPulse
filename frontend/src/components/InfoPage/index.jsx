import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  Typography, 
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  Biotech as AsthmaIcon,
  Quiz as TestIcon,
  QuestionAnswer as FAQIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

// Основной компонент информационной страницы
function InfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Определяем текущую вкладку на основе URL
  const getTabValue = () => {
    const path = location.pathname;
    if (path === '/info' || path === '/info/allergy') return 0;
    if (path === '/info/asthma') return 1;
    if (path === '/info/test') return 2;
    if (path === '/info/faq') return 3;
    if (path === '/info/calendar') return 4;
    return 0;
  };

  const [tabValue, setTabValue] = useState(getTabValue());

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/info/allergy');
        break;
      case 1:
        navigate('/info/asthma');
        break;
      case 2:
        navigate('/info/test');
        break;
      case 3:
        navigate('/info/faq');
        break;
      case 4:
        navigate('/info/calendar');
        break;
      default:
        navigate('/info/allergy');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3, 
          mb: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white', 
            borderTopLeftRadius: 12, 
            borderTopRightRadius: 12 
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Информация об аллергии и астме
          </Typography>
          <Typography variant="subtitle1">
            Полезные материалы, тесты и рекомендации для людей с респираторными проблемами
          </Typography>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
            centered={!isMobile}
            sx={{ 
              '& .MuiTab-root': { 
                py: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 600
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              }
            }}
          >
            <Tab 
              label={isMobile ? "Аллергия" : "Об аллергии"} 
              icon={<HealthIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={isMobile ? "Астма" : "Об астме"} 
              icon={<AsthmaIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={isMobile ? "Тест" : "Тест на аллергию"} 
              icon={<TestIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="FAQ" 
              icon={<FAQIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={isMobile ? "Календарь" : "Календарь цветения"} 
              icon={<CalendarIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Paper>
    </Container>
  );
}

export default InfoPage; 