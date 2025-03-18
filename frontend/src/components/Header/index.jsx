import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Tooltip,
  useScrollTrigger,
  useTheme,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as LogoutIcon,
  Air as AirIcon,
  Login as LoginIcon,
  HowToReg as RegisterIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Map as MapIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

// Эффект добавления тени при прокрутке
function ElevationScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
    sx: {
      transition: 'box-shadow 0.3s ease',
      backdropFilter: trigger ? 'blur(8px)' : 'none',
      backgroundColor: trigger ? (theme) => alpha(theme.palette.background.paper, 0.9) : (theme) => theme.palette.background.paper,
    }
  });
}

function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setDrawerOpen(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawerContent = (
    <Box
      sx={{ width: 280, pt: 1 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AirIcon sx={{ mr: 1, color: 'primary.main', fontSize: '1.8rem' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            AirPulse
          </Typography>
        </Box>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem button component={RouterLink} to="/">
          <ListItemIcon>
            <HomeIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Главная" />
        </ListItem>
        
        <ListItem button component={RouterLink} to="/map">
          <ListItemIcon>
            <MapIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Карта аллергенов" />
        </ListItem>
        
        <ListItem button component={RouterLink} to="/about">
          <ListItemIcon>
            <InfoIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="О проекте" />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {!isAuthenticated ? (
        <List>
          <ListItem button component={RouterLink} to="/login">
            <ListItemIcon>
              <LoginIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Вход" />
          </ListItem>
          
          <ListItem button component={RouterLink} to="/register">
            <ListItemIcon>
              <RegisterIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Регистрация" />
          </ListItem>
        </List>
      ) : (
        <List>
          {isAdmin && (
            <ListItem button component={RouterLink} to="/admin">
              <ListItemIcon>
                <AdminIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Панель администратора" />
            </ListItem>
          )}
          
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Выйти" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <ElevationScroll>
      <AppBar position="sticky" color="inherit">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 0.5 }}>
            {/* Кнопка мобильного меню */}
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Логотип и название */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2 
            }}>
              <AirIcon 
                sx={{ 
                  mr: 1, 
                  color: 'primary.main',
                  fontSize: '2rem'
                }} 
              />
              <Typography
                variant="h6"
                component={RouterLink}
                to="/"
                sx={{
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease-in-out',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                AirPulse
              </Typography>
            </Box>

            {/* Заголовок (только на десктопах) */}
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                flexGrow: 1,
                display: { xs: 'none', md: 'block' }
              }}
            >
              Мониторинг пыльцы и аллергенов
            </Typography>

            {/* Пользовательский блок - только для десктопа */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isAuthenticated ? (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mr: 1.5, 
                        fontWeight: 500,
                        color: 'text.secondary',
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      {user?.name || user?.email || 'Пользователь'}
                    </Typography>
                    <Tooltip title="Учетная запись">
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label="аккаунт пользователя"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        sx={{ 
                          ml: 0.5,
                          border: `2px solid ${theme.palette.primary.light}`,
                          p: 0.2
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                          }}
                        >
                          {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu
                      id="menu-appbar"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      sx={{
                        '& .MuiPaper-root': {
                          borderRadius: 2,
                          mt: 1,
                          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
                          minWidth: 180,
                        }
                      }}
                    >
                      {isAdmin && (
                        <MenuItem 
                          component={RouterLink} 
                          to="/admin" 
                          onClick={handleClose}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.5
                          }}
                        >
                          <AdminIcon fontSize="small" color="primary" />
                          <Typography variant="body2">Панель администратора</Typography>
                        </MenuItem>
                      )}
                      <MenuItem 
                        onClick={handleLogout}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          py: 1.5
                        }}
                      >
                        <LogoutIcon fontSize="small" color="error" />
                        <Typography variant="body2">Выйти</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      component={RouterLink} 
                      to="/register"
                      variant="outlined"
                      color="primary"
                      startIcon={<RegisterIcon />}
                      sx={{ 
                        borderRadius: '20px'
                      }}
                    >
                      Регистрация
                    </Button>
                    <Button 
                      component={RouterLink} 
                      to="/login"
                      variant="contained"
                      color="primary"
                      startIcon={<LoginIcon />}
                      sx={{ borderRadius: '20px' }}
                    >
                      Вход
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            
            {/* На мобильных только аватар если авторизован */}
            {isMobile && isAuthenticated && (
              <Tooltip title="Учетная запись">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label="аккаунт пользователя"
                  onClick={toggleDrawer(true)}
                  sx={{ 
                    ml: 0.5,
                    border: `2px solid ${theme.palette.primary.light}`,
                    p: 0.2
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </Container>
        
        {/* Мобильное боковое меню */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
        >
          {drawerContent}
        </Drawer>
      </AppBar>
    </ElevationScroll>
  );
}

export default Header; 