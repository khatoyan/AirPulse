import React from 'react';
import { Box, Container, Typography, Link, Grid, Stack, IconButton, Divider, useTheme } from '@mui/material';
import { 
  Air as AirIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: { xs: 4, md: 6 },
        mt: 'auto',
        backgroundColor: theme.palette.grey[50],
        borderTop: `1px solid ${theme.palette.grey[200]}`,
        color: theme.palette.text.secondary
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Логотип и название */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AirIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" color="text.primary" fontWeight={600}>
                AirPulse
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, maxWidth: 300 }}>
              Мониторинг качества воздуха для людей с аллергией. Данные о пыльце растений и качестве воздуха в режиме реального времени.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton 
                size="small"
                aria-label="facebook"
                sx={{
                  color: theme.palette.grey[500],
                  '&:hover': { color: '#1877F2', bgcolor: 'rgba(24, 119, 242, 0.08)' },
                  transition: 'all 0.2s'
                }}
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                aria-label="twitter"
                sx={{
                  color: theme.palette.grey[500],
                  '&:hover': { color: '#1DA1F2', bgcolor: 'rgba(29, 161, 242, 0.08)' },
                  transition: 'all 0.2s'
                }}
              >
                <TwitterIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                aria-label="instagram"
                sx={{
                  color: theme.palette.grey[500],
                  '&:hover': { color: '#E4405F', bgcolor: 'rgba(228, 64, 95, 0.08)' },
                  transition: 'all 0.2s'
                }}
              >
                <InstagramIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          {/* Ссылки на разделы */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} sx={{ mb: 2 }}>
              О проекте
            </Typography>
            <Stack spacing={1.5}>
              <Link href="#" underline="hover" color="inherit" variant="body2">О нас</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Команда</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Как это работает</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Партнеры</Link>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} sx={{ mb: 2 }}>
              Пользователям
            </Typography>
            <Stack spacing={1.5}>
              <Link href="#" underline="hover" color="inherit" variant="body2">Как пользоваться</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">FAQ</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Советы аллергикам</Link>
              <Link href="#" underline="hover" color="inherit" variant="body2">Обратная связь</Link>
            </Stack>
          </Grid>

          {/* Контакты */}
          <Grid item xs={12} sm={4} md={4}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} sx={{ mb: 2 }}>
              Контакты
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">support@airpulse.ru</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">+7 (383) 123-45-67</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} AirPulse. Все права защищены.
          </Typography>
          <Box sx={{ display: 'flex', mt: { xs: 2, sm: 0 }, gap: 3 }}>
            <Link href="#" underline="hover" color="text.secondary" variant="caption">
              Условия использования
            </Link>
            <Link href="#" underline="hover" color="text.secondary" variant="caption">
              Политика конфиденциальности
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer; 