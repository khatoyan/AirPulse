import React from 'react';
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
  alpha
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as LogoutIcon,
  Air as AirIcon,
  Login as LoginIcon,
  HowToReg as RegisterIcon
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
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <ElevationScroll>
      <AppBar position="sticky" color="inherit">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 0.5 }}>
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

            {/* Пользовательский блок */}
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
                      display: { xs: 'none', sm: 'flex' },
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
          </Toolbar>
        </Container>
      </AppBar>
    </ElevationScroll>
  );
}

export default Header; 