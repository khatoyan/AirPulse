import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon,
  ListItemText,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  useTheme
} from '@mui/material';
import {
  LocalFlorist as PollenIcon,
  Pets as PetsIcon,
  CleaningServices as DustIcon,
  Restaurant as FoodIcon,
  Medication as MedicationIcon,
  SevereCold as SymptomsIcon,
  Air as AirQualityIcon,
  FactCheck as DiagnosisIcon,
  Healing as TreatmentIcon
} from '@mui/icons-material';

function AllergyInfoTab() {
  const theme = useTheme();

  const allergenTypes = [
    { 
      title: "Пыльца растений", 
      icon: <PollenIcon color="primary" />,
      description: "Пыльца деревьев (береза, ольха, дуб), злаковых (тимофеевка, райграс) и сорных трав (амброзия, полынь)",
      season: "Весна-лето",
      symptoms: "Ринит, конъюнктивит, иногда астма" 
    },
    { 
      title: "Животные", 
      icon: <PetsIcon color="primary" />,
      description: "Шерсть, перхоть, слюна и моча домашних животных, особенно кошек и собак",
      season: "Круглый год",
      symptoms: "Ринит, конъюнктивит, астма, кожные реакции" 
    },
    { 
      title: "Пылевые клещи", 
      icon: <DustIcon color="primary" />,
      description: "Микроскопические клещи, живущие в домашней пыли, постельном белье, мягкой мебели и коврах",
      season: "Круглый год (хуже зимой при отоплении)",
      symptoms: "Ринит, астма, иногда экзема" 
    },
    { 
      title: "Пищевые продукты", 
      icon: <FoodIcon color="primary" />,
      description: "Орехи, молоко, яйца, рыба, моллюски, пшеница, соя и др.",
      season: "Круглый год",
      symptoms: "От легкого зуда во рту до анафилаксии" 
    },
    { 
      title: "Лекарства", 
      icon: <MedicationIcon color="primary" />,
      description: "Пенициллин, сульфаниламиды, нестероидные противовоспалительные препараты",
      season: "При приеме препарата",
      symptoms: "От кожных реакций до анафилактического шока" 
    }
  ];

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Что такое аллергия?
      </Typography>
      
      <Typography paragraph sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
        Аллергия — это повышенная чувствительность иммунной системы к определенным веществам (аллергенам), 
        которые обычно безвредны для большинства людей. Когда аллерген попадает в организм человека с 
        аллергией, иммунная система вырабатывает антитела, что приводит к выделению веществ, вызывающих
        типичные симптомы аллергии.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <SymptomsIcon sx={{ mr: 1 }} /> Основные симптомы аллергии
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <List>
            <ListItem>
              <ListItemIcon>
                <Chip label="1" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Ринит (насморк)" 
                secondary="Заложенность носа, чихание, зуд, прозрачные выделения" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Chip label="2" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Конъюнктивит" 
                secondary="Покраснение глаз, слезотечение, зуд, отечность век" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Chip label="3" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Кожные реакции" 
                secondary="Сыпь, крапивница, зуд, покраснение, экзема" 
              />
            </ListItem>
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <List>
            <ListItem>
              <ListItemIcon>
                <Chip label="4" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Респираторные симптомы" 
                secondary="Кашель, стеснение в груди, хрипы, затрудненное дыхание" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Chip label="5" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Пищеварительные реакции" 
                secondary="Тошнота, рвота, диарея, боли в животе" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Chip label="6" color="primary" size="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Анафилаксия" 
                secondary="Тяжелая, потенциально опасная для жизни реакция с отеком дыхательных путей и падением давления" 
              />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Основные типы аллергенов
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {allergenTypes.map((type, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {type.icon}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {type.title}
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph color="text.secondary">
                  {type.description}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <strong>Сезон:</strong> <span style={{ marginLeft: '4px' }}>{type.season}</span>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <strong>Симптомы:</strong> <span style={{ marginLeft: '4px' }}>{type.symptoms}</span>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <DiagnosisIcon sx={{ mr: 1 }} /> Диагностика аллергии
      </Typography>

      <Typography paragraph>
        Для диагностики аллергии врачи используют различные методы:
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon><Chip label="1" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Кожные пробы" 
            secondary="Небольшие количества предполагаемых аллергенов вводятся под кожу, и врач наблюдает за реакцией" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Chip label="2" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Анализ крови на IgE-антитела" 
            secondary="Проверяет уровень антител, специфичных для определенных аллергенов" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Chip label="3" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Элиминационные диеты" 
            secondary="Исключение определенных продуктов из рациона с последующим их постепенным возвращением для выявления пищевой аллергии" 
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <TreatmentIcon sx={{ mr: 1 }} /> Лечение и профилактика
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Медикаментозное лечение</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Антигистаминные препараты – блокируют действие гистамина" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Деконгестанты – помогают облегчить заложенность носа" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Кортикостероиды – уменьшают воспаление" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Иммунотерапия – постепенное введение аллергена для снижения чувствительности" />
            </ListItem>
          </List>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Профилактика и самопомощь</Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Избегайте известных аллергенов" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Используйте очистители воздуха в помещении" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Регулярно проводите влажную уборку для удаления пыли" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Следите за прогнозами пыления растений на нашей карте" />
            </ListItem>
            <ListItem>
              <ListItemText primary="При наличии домашних животных, регулярно купайте их и ограничьте их доступ в спальню" />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Box 
        sx={{ 
          bgcolor: theme.palette.primary.light, 
          p: 3, 
          mt: 3, 
          borderRadius: 2,
          color: '#fff'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AirQualityIcon sx={{ mr: 1 }} /> Мониторинг аллергенов
        </Typography>
        <Typography>
          Используйте нашу карту для отслеживания концентрации пыльцы и других аллергенов в вашем регионе. 
          Своевременная информация поможет вам лучше планировать свою активность и предпринимать превентивные меры.
        </Typography>
      </Box>
    </Box>
  );
}

export default AllergyInfoTab; 