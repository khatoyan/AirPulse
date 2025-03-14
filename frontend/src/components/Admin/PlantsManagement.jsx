import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { plantsService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

// Категории растений
const plantCategories = [
  'Деревья',
  'Кустарники',
  'Травы',
  'Цветы',
  'Сорняки'
];

// Сезоны цветения
const seasons = [
  'Весна',
  'Лето',
  'Осень',
  'Зима'
];

function PlantsManagement() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    latinName: '',
    category: '',
    season: '',
    allergyLevel: 50,
    description: '',
    icon: 'default'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { getAuthHeader } = useAuthStore();
  
  // Загрузка списка растений
  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plantsService.getAllPlants();
      setPlants(data);
    } catch (error) {
      console.error('Ошибка при загрузке растений:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке справочника растений',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Открытие диалога добавления
  const handleAddPlant = () => {
    setSelectedPlant(null);
    setFormData({
      name: '',
      latinName: '',
      category: '',
      season: '',
      allergyLevel: 50,
      description: '',
      icon: 'default'
    });
    setDialogOpen(true);
  };
  
  // Открытие диалога редактирования
  const handleEditPlant = (plant) => {
    setSelectedPlant(plant);
    setFormData({
      name: plant.name,
      latinName: plant.latinName || '',
      category: plant.category || '',
      season: plant.season || '',
      allergyLevel: plant.allergyLevel || 50,
      description: plant.description || '',
      icon: plant.icon || 'default'
    });
    setDialogOpen(true);
  };
  
  // Открытие диалога удаления
  const handleDeleteConfirm = (plant) => {
    setSelectedPlant(plant);
    setDeleteDialogOpen(true);
  };
  
  // Сохранение растения (добавление или редактирование)
  const handleSave = async () => {
    try {
      if (selectedPlant) {
        // Редактирование существующего растения
        await plantsService.updatePlant(
          selectedPlant.id, 
          formData, 
          getAuthHeader()
        );
        setSnackbar({
          open: true,
          message: 'Растение успешно обновлено',
          severity: 'success'
        });
      } else {
        // Добавление нового растения
        await plantsService.createPlant(
          formData, 
          getAuthHeader()
        );
        setSnackbar({
          open: true,
          message: 'Растение успешно добавлено',
          severity: 'success'
        });
      }
      setDialogOpen(false);
      fetchPlants(); // Обновляем список после изменений
    } catch (error) {
      console.error('Ошибка при сохранении растения:', error);
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при сохранении растения',
        severity: 'error'
      });
    }
  };
  
  // Удаление растения
  const handleDelete = async () => {
    if (!selectedPlant) return;
    
    try {
      await plantsService.deletePlant(
        selectedPlant.id, 
        getAuthHeader()
      );
      setDeleteDialogOpen(false);
      fetchPlants(); // Обновляем список после удаления
      setSnackbar({
        open: true,
        message: 'Растение успешно удалено',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при удалении растения:', error);
      setSnackbar({
        open: true,
        message: 'Произошла ошибка при удалении растения',
        severity: 'error'
      });
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Управление справочником растений
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddPlant}
        >
          Добавить растение
        </Button>
      </Box>
      
      {loading ? (
        <Typography>Загрузка данных...</Typography>
      ) : plants.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Справочник растений пуст</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {plants.map(plant => (
            <Grid item xs={12} sm={6} md={4} key={plant.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{plant.name}</Typography>
                  
                  {plant.latinName && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <em>{plant.latinName}</em>
                    </Typography>
                  )}
                  
                  <Box sx={{ my: 1 }}>
                    {plant.category && (
                      <Typography variant="body2">
                        <strong>Категория:</strong> {plant.category}
                      </Typography>
                    )}
                    
                    {plant.season && (
                      <Typography variant="body2">
                        <strong>Сезон цветения:</strong> {plant.season}
                      </Typography>
                    )}
                    
                    <Typography variant="body2">
                      <strong>Уровень аллергенности:</strong> {plant.allergyLevel}/100
                    </Typography>
                  </Box>
                  
                  {plant.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {plant.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleEditPlant(plant)}
                    aria-label="Редактировать"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteConfirm(plant)}
                    aria-label="Удалить"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Диалог добавления/редактирования растения */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPlant ? 'Редактировать растение' : 'Добавить новое растение'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Название растения"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Латинское название"
                name="latinName"
                value={formData.latinName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Категория</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Категория"
                  onChange={handleInputChange}
                >
                  {plantCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Сезон цветения</InputLabel>
                <Select
                  name="season"
                  value={formData.season}
                  label="Сезон цветения"
                  onChange={handleInputChange}
                >
                  {seasons.map(season => (
                    <MenuItem key={season} value={season}>{season}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Уровень аллергенности:
              </Typography>
              <TextField
                fullWidth
                type="number"
                name="allergyLevel"
                value={formData.allergyLevel}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить растение "{selectedPlant?.name}"?
            Это действие нельзя будет отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDelete} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомление */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PlantsManagement; 