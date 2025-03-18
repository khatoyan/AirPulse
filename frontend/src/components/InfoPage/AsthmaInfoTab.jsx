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
  Alert,
  AlertTitle,
  Chip,
  Paper,
  useTheme
} from '@mui/material';
import {
  Coronavirus as TriggerIcon,
  Warning as WarningIcon,
  MonitorHeart as MonitoringIcon,
  Biotech as DiagnosisIcon,
  MedicalServices as TreatmentIcon,
  Air as BreathingIcon,
  FitnessCenter as ExerciseIcon,
  SevereCold as SymptomIcon,
  Psychology as MentalHealthIcon
} from '@mui/icons-material';

function AsthmaInfoTab() {
  const theme = useTheme();

  const symptoms = [
    { title: "Одышка", description: "Чувство нехватки воздуха, затрудненное дыхание" },
    { title: "Свистящее дыхание", description: "Шумное дыхание со свистом или хрипами при выдохе" },
    { title: "Стеснение в груди", description: "Ощущение сдавливания или тяжести в груди" },
    { title: "Кашель", description: "Особенно ночью, при физической нагрузке или на холодном воздухе" },
    { title: "Одышка при нагрузке", description: "Затрудненное дыхание во время физической активности" },
    { title: "Нарушения сна", description: "Пробуждение из-за кашля, одышки или стеснения в груди" }
  ];

  const triggers = [
    { 
      title: "Аллергены", 
      icon: <TriggerIcon color="primary" />,
      description: "Пыльца растений, пылевые клещи, плесень, шерсть животных" 
    },
    { 
      title: "Респираторные инфекции", 
      icon: <TriggerIcon color="primary" />,
      description: "Простуда, грипп, синусит и другие инфекции дыхательных путей" 
    },
    { 
      title: "Раздражители", 
      icon: <TriggerIcon color="primary" />,
      description: "Табачный дым, загрязнение воздуха, сильные запахи, химические вещества" 
    },
    { 
      title: "Физическая нагрузка", 
      icon: <TriggerIcon color="primary" />,
      description: "Особенно в холодную и сухую погоду" 
    },
    { 
      title: "Погодные условия", 
      icon: <TriggerIcon color="primary" />,
      description: "Холодный воздух, резкие перепады температуры, влажность" 
    },
    { 
      title: "Эмоции и стресс", 
      icon: <TriggerIcon color="primary" />,
      description: "Сильные эмоции, стресс могут вызвать гипервентиляцию и спазм бронхов" 
    }
  ];

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Что такое астма?
      </Typography>
      
      <Typography paragraph sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
        Астма – это хроническое заболевание дыхательных путей, характеризующееся воспалением и сужением бронхов. 
        При астме дыхательные пути становятся сверхчувствительными и реагируют на определенные триггеры усилением 
        воспаления, что приводит к затруднению дыхания. В большинстве случаев астма хорошо поддается контролю при 
        правильном лечении.
      </Typography>

      <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
        <AlertTitle>Связь с аллергией</AlertTitle>
        У многих людей астма тесно связана с аллергическими реакциями. Такую форму часто называют аллергической 
        астмой. При этом те же аллергены, которые вызывают насморк или конъюнктивит, могут спровоцировать и 
        приступ астмы.
      </Alert>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <SymptomIcon sx={{ mr: 1 }} /> Основные симптомы астмы
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {symptoms.map((symptom, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {symptom.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {symptom.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>Важно!</AlertTitle>
        Симптомы могут различаться по интенсивности и частоте. Иногда астма проявляется только периодическими 
        симптомами, а иногда может стать хронической проблемой, требующей ежедневного контроля.
      </Alert>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Основные триггеры астмы
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {triggers.map((trigger, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {trigger.icon}
                  <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {trigger.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {trigger.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <DiagnosisIcon sx={{ mr: 1 }} /> Диагностика астмы
      </Typography>

      <Typography paragraph>
        Диагноз астмы устанавливается на основании:
      </Typography>

      <List>
        <ListItem>
          <ListItemIcon><Chip label="1" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Спирометрия" 
            secondary="Исследование функции внешнего дыхания для оценки объема и скорости выдыхаемого воздуха" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Chip label="2" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Бронхопровокационные тесты" 
            secondary="Проверка реакции дыхательных путей на определенные стимулы" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Chip label="3" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Аллергологические тесты" 
            secondary="Для выявления аллергических реакций, если предполагается аллергическая астма" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon><Chip label="4" color="primary" size="small" /></ListItemIcon>
          <ListItemText 
            primary="Анализы крови" 
            secondary="Для оценки уровня воспаления и выявления аллергии" 
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
        <TreatmentIcon sx={{ mr: 1 }} /> Лечение астмы
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Медикаментозное лечение</Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Быстродействующие ингаляторы (бронходилататоры)" 
                secondary="Для быстрого облегчения симптомов во время приступа" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Ингаляционные кортикостероиды" 
                secondary="Для долгосрочного контроля воспаления дыхательных путей" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Комбинированные препараты" 
                secondary="Сочетают кортикостероиды и бронходилататоры длительного действия" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Модификаторы лейкотриенов" 
                secondary="Блокируют действие химических веществ, вызывающих воспаление" 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Биологическая терапия" 
                secondary="Для тяжелых форм астмы, которые плохо поддаются другим методам лечения" 
              />
            </ListItem>
          </List>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Самоконтроль и профилактика</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><MonitoringIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Регулярно измеряйте пиковую скорость выдоха с помощью пикфлоуметра" />
            </ListItem>
            <ListItem>
              <ListItemIcon><WarningIcon color="warning" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Выявите и избегайте ваших индивидуальных триггеров" />
            </ListItem>
            <ListItem>
              <ListItemIcon><BreathingIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Научитесь правильно дышать и расслабляться во время приступа" />
            </ListItem>
            <ListItem>
              <ListItemIcon><ExerciseIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Регулярно занимайтесь специальными дыхательными упражнениями" />
            </ListItem>
            <ListItem>
              <ListItemIcon><MentalHealthIcon color="primary" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Управляйте стрессом через медитацию, йогу или другие техники релаксации" />
            </ListItem>
          </List>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        План действий при астме
      </Typography>

      <Typography paragraph>
        Важно разработать персональный план действий при астме совместно с вашим врачом. Этот план должен включать:
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              height: '100%',
              bgcolor: theme.palette.success.light,
              color: theme.palette.success.contrastText
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">Зеленая зона</Typography>
            <Typography variant="body2">
              • Симптомы отсутствуют<br />
              • Нормальное дыхание<br />
              • Можно заниматься обычной деятельностью<br />
              • Пиковая скорость выдоха 80-100% от персонального лучшего
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Действия: Продолжать принимать поддерживающие препараты по плану
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              height: '100%',
              bgcolor: theme.palette.warning.light,
              color: theme.palette.warning.contrastText
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">Желтая зона</Typography>
            <Typography variant="body2">
              • Появились симптомы: кашель, хрипы, стеснение в груди<br />
              • Затруднена обычная активность<br />
              • Пробуждение ночью из-за симптомов<br />
              • Пиковая скорость выдоха 50-80% от персонального лучшего
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Действия: Использовать бронходилататор быстрого действия, временно усилить базовую терапию по рекомендации врача
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              height: '100%',
              bgcolor: theme.palette.error.light,
              color: theme.palette.error.contrastText
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="bold">Красная зона</Typography>
            <Typography variant="body2">
              • Тяжелая одышка, затрудненная речь<br />
              • Быстродействующие препараты не помогают<br />
              • Невозможно выполнять обычную деятельность<br />
              • Пиковая скорость выдоха менее 50% от персонального лучшего
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Действия: Немедленно использовать бронходилататор быстрого действия и немедленно обратиться за медицинской помощью
            </Typography>
          </Paper>
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
          <MonitoringIcon sx={{ mr: 1 }} /> Мониторинг аллергенов для контроля астмы
        </Typography>
        <Typography>
          Если у вас аллергическая астма, используйте нашу карту для мониторинга аллергенов в воздухе. 
          Планируйте свою активность в дни с низкой концентрацией аллергенов и принимайте превентивные меры 
          в дни с высоким содержанием аллергенов.
        </Typography>
      </Box>
    </Box>
  );
}

export default AsthmaInfoTab; 