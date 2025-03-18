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

  // Get up to 3 plants to display in alert
  const plantsToDisplay = floweringPlants.slice(0, 3);
  const hasMorePlants = floweringPlants.length > 3;

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
                {plantsToDisplay.map((plant) => (
                  <Typography key={plant.id} variant="body2">
                    • {plant.name} {plant.allergenicity && `(аллергенность: ${plant.allergenicity}/5)`}
                  </Typography>
                ))}
                
                {hasMorePlants && (
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    ...и еще {floweringPlants.length - 3} видов растений
                  </Typography>
                )}
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