import React, { useState, useEffect } from 'react';
import { Alert, Box, Typography, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const FloweringAlert = () => {
  const [floweringPlants, setFloweringPlants] = useState([]);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFloweringPlants = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/plants/flowering`);
        setFloweringPlants(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flowering plants:', error);
        setLoading(false);
      }
    };

    fetchFloweringPlants();
  }, []);

  // Don't show anything if data is still loading
  if (loading) {
    return null;
  }

  // Group plants by their family/category
  const groupPlantsByCategory = (plants) => {
    const groups = {};
    
    plants.forEach(plant => {
      // Try to determine plant family/category
      // First check if plant has a category field
      let category = plant.category;
      
      // If no category, try to extract from name
      if (!category) {
        // Check common tree families
        if (/берез|birch/i.test(plant.name)) category = 'Берёза';
        else if (/ольх|alder/i.test(plant.name)) category = 'Ольха';
        else if (/дуб|oak/i.test(plant.name)) category = 'Дуб';
        else if (/топол|poplar/i.test(plant.name)) category = 'Тополь';
        else if (/злак|grass/i.test(plant.name)) category = 'Злаковые';
        else category = 'Другие';
      }
      
      // Initialize category if it doesn't exist
      if (!groups[category]) {
        groups[category] = {
          name: category,
          count: 0,
          maxAllergenicity: 0,
          plants: []
        };
      }
      
      // Add plant to category
      groups[category].count++;
      groups[category].plants.push(plant);
      
      // Update max allergenicity for the category
      const allergenicity = parseInt(plant.allergenicity) || 0;
      if (allergenicity > groups[category].maxAllergenicity) {
        groups[category].maxAllergenicity = allergenicity;
      }
    });
    
    // Convert to array and sort by allergenicity (highest first)
    return Object.values(groups).sort((a, b) => b.maxAllergenicity - a.maxAllergenicity);
  };
  
  const plantGroups = groupPlantsByCategory(floweringPlants);
  
  // Get up to 3 most allergenic plant groups to display
  const groupsToDisplay = plantGroups.slice(0, 3);
  const hasMoreGroups = plantGroups.length > 3;
  
  // Calculate total number of plants across all groups
  const totalPlants = plantGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <Collapse in={open}>
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          right: 10, 
          zIndex: 1000,
          maxWidth: '600px',
          margin: '0 auto'
        }}
      >
        <Alert
          severity={floweringPlants.length > 0 ? "warning" : "success"}
          variant="filled"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {floweringPlants.length > 0 ? (
            <>
              <Typography variant="subtitle1" fontWeight="bold">
                Сейчас активное цветение:
              </Typography>
              
              <Box component="div" sx={{ mt: 1 }}>
                {groupsToDisplay.map((group) => (
                  <Typography key={group.name} variant="body2">
                    • {group.name} (аллергенность: {group.maxAllergenicity}/5)
                  </Typography>
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="subtitle1" fontWeight="medium">
              Сейчас нет активного цветения аллергенных растений. Воздух безопасен!
            </Typography>
          )}
        </Alert>
      </Box>
    </Collapse>
  );
};

export default FloweringAlert; 