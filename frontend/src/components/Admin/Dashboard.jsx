import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  LocalFlorist as PlantsIcon,
  RateReview as PendingIcon,
  Person as UserIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { reportsService, plantsService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPlants: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { getAuthHeader } = useAuthStore();
  
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Получаем данные для статистики
      const [plants, stats] = await Promise.all([
        plantsService.getAllPlants(),
        reportsService.getReportsStats(getAuthHeader())
      ]);
      
      console.log('Полученная статистика:', { plants, stats });
      
      setStats({
        totalPlants: Array.isArray(plants) ? plants.length : 0,
        pendingReports: stats?.pendingCount || 0,
        approvedReports: stats?.approvedCount || 0,
        rejectedReports: stats?.rejectedCount || 0
      });
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
      // Устанавливаем нулевые значения в случае ошибки
      setStats({
        totalPlants: 0,
        pendingReports: 0,
        approvedReports: 0,
        rejectedReports: 0
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  // Карточка со статистикой
  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}.100`, 
            color: `${color}.700`, 
            p: 1, 
            borderRadius: 1,
            mr: 2
          }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" align="center" sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={30} /> : value}
        </Typography>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Обзор системы
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 4 }}>
        Добро пожаловать в административную панель AirPulse! Здесь вы можете управлять растениями и модерировать отчеты пользователей.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Растения в базе"
            value={stats.totalPlants}
            icon={<PlantsIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Отчеты на модерации"
            value={stats.pendingReports}
            icon={<PendingIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Одобренные отчеты"
            value={stats.approvedReports}
            icon={<InfoIcon />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Отклоненные отчеты"
            value={stats.rejectedReports}
            icon={<UserIcon />}
            color="error"
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Быстрый доступ
            </Typography>
            <Typography variant="body1" paragraph>
              Вы можете быстро перейти к следующим разделам:
            </Typography>
            <Typography variant="body2">
              • <strong>Модерация</strong> - Проверка и утверждение отчетов пользователей
            </Typography>
            <Typography variant="body2">
              • <strong>Управление растениями</strong> - Добавление и редактирование данных о растениях
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 