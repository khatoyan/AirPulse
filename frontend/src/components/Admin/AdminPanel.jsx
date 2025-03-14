import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  LocalFlorist as PlantsIcon, 
  RateReview as ModerationIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import Dashboard from './Dashboard';
import PendingReports from './PendingReports';
import PlantsManagement from './PlantsManagement';

const drawerWidth = 240;

function AdminPanel() {
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Редирект на главную страницу происходит через защищенный маршрут
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AirPulse - Панель администратора
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.name || 'Администратор'}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Меню
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          <ListItem button component={Link} to="/admin">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Обзор" />
          </ListItem>
          <ListItem button component={Link} to="/admin/moderation">
            <ListItemIcon><ModerationIcon /></ListItemIcon>
            <ListItemText primary="Модерация" />
          </ListItem>
          <ListItem button component={Link} to="/admin/plants">
            <ListItemIcon><PlantsIcon /></ListItemIcon>
            <ListItemText primary="Управление растениями" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button component={Link} to="/">
            <ListItemText primary="Вернуться на сайт" />
          </ListItem>
        </List>
      </Drawer>
      
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/moderation" element={<PendingReports />} />
          <Route path="/plants" element={<PlantsManagement />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default AdminPanel; 