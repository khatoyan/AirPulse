import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  AlertTitle,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  SevereCold as SymptomsIcon,
  LocalFlorist as AllergenIcon,
  MedicalServices as TreatmentIcon
} from '@mui/icons-material';

function AllergyTestTab() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      id: 'symptoms',
      question: 'Какие симптомы вы испытываете?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Симптомы отсутствуют' },
        { value: 1, label: 'Легкие симптомы (редкое чихание, незначительный зуд)' },
        { value: 2, label: 'Умеренные симптомы (регулярное чихание, заложенность носа, зуд глаз)' },
        { value: 3, label: 'Сильные симптомы (постоянная заложенность, частое чихание, сильный зуд глаз/носа)' }
      ]
    },
    {
      id: 'frequency',
      question: 'Как часто вы испытываете эти симптомы?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Никогда или очень редко' },
        { value: 1, label: 'Иногда (несколько раз в год)' },
        { value: 2, label: 'Часто (несколько раз в месяц)' },
        { value: 3, label: 'Постоянно (каждую неделю или ежедневно)' }
      ]
    },
    {
      id: 'seasonal',
      question: 'Связаны ли ваши симптомы с определенным сезоном?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Нет, симптомы не зависят от времени года' },
        { value: 1, label: 'Симптомы немного усиливаются в определенное время года' },
        { value: 2, label: 'Симптомы значительно сильнее в определенные сезоны' },
        { value: 3, label: 'Симптомы появляются только в определенное время года' }
      ]
    },
    {
      id: 'triggers',
      question: 'Что провоцирует ваши симптомы?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Не знаю, симптомы возникают случайно' },
        { value: 1, label: 'Некоторые ситуации (контакт с животными, пыль)' },
        { value: 2, label: 'Определенные ситуации регулярно вызывают симптомы' },
        { value: 3, label: 'Четко знаю, что вызывает симптомы (пыльца, шерсть и т.д.)' }
      ]
    },
    {
      id: 'impact',
      question: 'Как симптомы влияют на вашу повседневную жизнь?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Не влияют вообще' },
        { value: 1, label: 'Незначительно влияют (редко мешают)' },
        { value: 2, label: 'Умеренно влияют (иногда мешают нормальной деятельности)' },
        { value: 3, label: 'Сильно влияют (регулярно мешают работе, сну, отдыху)' }
      ]
    },
    {
      id: 'medication',
      question: 'Помогают ли вам антигистаминные препараты?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Не принимаю их / не нуждаюсь в них' },
        { value: 1, label: 'Незначительное облегчение' },
        { value: 2, label: 'Умеренное облегчение' },
        { value: 3, label: 'Значительное облегчение' }
      ]
    },
    {
      id: 'family',
      question: 'Есть ли у ваших ближайших родственников аллергия?',
      description: 'Выберите наиболее соответствующий вариант',
      options: [
        { value: 0, label: 'Нет' },
        { value: 1, label: 'Да, у дальних родственников' },
        { value: 2, label: 'Да, у одного из родителей или братьев/сестер' },
        { value: 3, label: 'Да, у обоих родителей или нескольких близких родственников' }
      ]
    }
  ];

  const handleNext = () => {
    if (activeStep === questions.length - 1) {
      calculateResult();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setAnswers({});
    setScore(null);
    setResult(null);
  };

  const handleAnswerChange = (event) => {
    const questionId = questions[activeStep].id;
    setAnswers({
      ...answers,
      [questionId]: parseInt(event.target.value)
    });
  };

  const calculateResult = () => {
    setIsSubmitting(true);

    // Имитация задержки обработки данных
    setTimeout(() => {
      // Расчет общего балла
      const totalScore = Object.values(answers).reduce((sum, value) => sum + value, 0);
      setScore(totalScore);

      // Определение результата на основе общего балла
      let resultCategory;
      if (totalScore <= 5) {
        resultCategory = {
          level: 'low',
          title: 'Низкая вероятность аллергии',
          description: 'Судя по вашим ответам, у вас низкая вероятность аллергического состояния.',
          recommendations: [
            'Продолжайте следить за своим самочувствием',
            'Если симптомы усилятся, пройдите тест повторно',
            'Ведите здоровый образ жизни для поддержания иммунитета'
          ]
        };
      } else if (totalScore <= 10) {
        resultCategory = {
          level: 'medium',
          title: 'Умеренная вероятность аллергии',
          description: 'Ваши ответы указывают на возможное наличие аллергического состояния легкой степени.',
          recommendations: [
            'Обратите внимание на триггеры, вызывающие симптомы',
            'Рассмотрите консультацию аллерголога для подтверждения',
            'Попробуйте безрецептурные антигистаминные препараты при появлении симптомов'
          ]
        };
      } else if (totalScore <= 15) {
        resultCategory = {
          level: 'high',
          title: 'Высокая вероятность аллергии',
          description: 'Ваши ответы указывают на высокую вероятность аллергического состояния.',
          recommendations: [
            'Рекомендуется консультация аллерголога',
            'Рассмотрите возможность проведения аллергопроб для выявления конкретных аллергенов',
            'Избегайте известных вам триггеров и следите за нашим прогнозом уровня аллергенов'
          ]
        };
      } else {
        resultCategory = {
          level: 'severe',
          title: 'Очень высокая вероятность аллергии',
          description: 'Ваши ответы указывают на очень высокую вероятность аллергического состояния.',
          recommendations: [
            'Настоятельно рекомендуется срочная консультация аллерголога',
            'Возможно, вам требуется индивидуальный план лечения',
            'Избегайте аллергенов и используйте нашу карту для мониторинга уровня аллергенов в вашем регионе',
            'Обсудите с врачом возможность иммунотерапии'
          ]
        };
      }

      setResult(resultCategory);
      setIsSubmitting(false);
    }, 1500);
  };

  const isStepComplete = (step) => {
    if (step >= questions.length) return true;
    return questions[step].id in answers;
  };

  const renderQuestion = (question) => {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          {question.question}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {question.description}
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={answers[question.id] !== undefined ? answers[question.id].toString() : ''}
            onChange={handleAnswerChange}
          >
            {question.options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value.toString()}
                control={<Radio />}
                label={option.label}
                sx={{ my: 1 }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>
    );
  };

  const renderResults = () => {
    if (isSubmitting) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6">Анализ ваших ответов...</Typography>
          <Typography variant="body2" color="text.secondary">
            Пожалуйста, подождите, мы обрабатываем результаты теста
          </Typography>
        </Box>
      );
    }

    const getAlertColor = () => {
      switch (result.level) {
        case 'low': return 'success';
        case 'medium': return 'info';
        case 'high': return 'warning';
        case 'severe': return 'error';
        default: return 'info';
      }
    };

    const getScoreColor = () => {
      if (score <= 5) return theme.palette.success.main;
      if (score <= 10) return theme.palette.info.main;
      if (score <= 15) return theme.palette.warning.main;
      return theme.palette.error.main;
    };

    return (
      <Box>
        <Alert severity={getAlertColor()} sx={{ mb: 3 }}>
          <AlertTitle>{result.title}</AlertTitle>
          {result.description}
        </Alert>

        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ваш результат
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: getScoreColor(),
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              mb: 2
            }}>
              {score} / 21
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TreatmentIcon sx={{ mr: 1 }} /> Рекомендации
          </Typography>

          <List>
            {result.recommendations.map((recommendation, index) => (
              <ListItem key={index} sx={{ pl: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon color={getAlertColor()} />
                </ListItemIcon>
                <Typography variant="body1">{recommendation}</Typography>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3, bgcolor: theme.palette.grey[100], p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <InfoIcon fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
              Важно: Этот тест предназначен только для информационных целей и не заменяет профессиональную медицинскую консультацию. Для точного диагноза обратитесь к врачу-аллергологу.
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ bgcolor: theme.palette.primary.light, p: 3, borderRadius: 2, color: '#fff' }}>
          <Typography variant="h6" gutterBottom>
            Мониторинг аллергенов
          </Typography>
          <Typography paragraph>
            Используйте нашу интерактивную карту для отслеживания уровня аллергенов в вашем регионе. 
            Это поможет вам планировать свою активность и минимизировать контакт с аллергенами.
          </Typography>
          <Button variant="contained" color="secondary" sx={{ mt: 1 }}>
            Перейти к карте
          </Button>
        </Box>
      </Box>
    );
  };

  // Компонент для отображения элемента списка
  const ListItem = ({ children, sx = {} }) => (
    <Box component="li" sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, ...sx }}>
      {children}
    </Box>
  );

  // Компонент для отображения иконки элемента списка
  const ListItemIcon = ({ children, sx = {} }) => (
    <Box sx={{ mr: 2, mt: 0.3, ...sx }}>
      {children}
    </Box>
  );

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
        Тест на аллергию
      </Typography>

      <Typography paragraph sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
        Этот тест поможет оценить вероятность наличия у вас аллергического состояния. 
        Ответьте на все вопросы максимально честно для получения более точного результата.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Важно!</AlertTitle>
        Тест не является заменой профессиональной консультации врача-аллерголога. 
        При наличии серьезных симптомов рекомендуется обратиться к специалисту.
      </Alert>

      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {questions.map((question, index) => {
            const stepProps = {};
            const labelProps = {};
            
            return (
              <Step key={index} {...stepProps} completed={isStepComplete(index)}>
                <StepLabel {...labelProps}>Вопрос {index + 1}</StepLabel>
              </Step>
            );
          })}
          <Step>
            <StepLabel>Результат</StepLabel>
          </Step>
        </Stepper>

        <Box sx={{ mt: 4, mb: 2 }}>
          {activeStep === questions.length ? (
            renderResults()
          ) : (
            renderQuestion(questions[activeStep])
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Назад
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === questions.length ? (
            <Button onClick={handleReset} variant="outlined">
              Пройти тест заново
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              variant="contained"
              disabled={questions[activeStep].id in answers === false}
            >
              {activeStep === questions.length - 1 ? 'Завершить' : 'Далее'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default AllergyTestTab; 