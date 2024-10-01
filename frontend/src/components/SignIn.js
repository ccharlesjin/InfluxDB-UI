import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Stack, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Use existing theme
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // For language translations
import axios from 'axios';

export default function SignIn() {
  const theme = useTheme(); // Get the global theme
  const { t } = useTranslation(); // Translation function
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  // Form validation and submit logic
  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    
    // Extract form values
    const InfluxDB_URL = data.get('InfluxDB_URL');
    const InfluxDB_token = data.get('InfluxDB_token');
    const Organization_name = data.get('Organization_name');

    // Prepare the request payload
    const payload = {
      InfluxDB_URL,
      InfluxDB_token,
      Organization_name
    };

    try {
      // Make an API request to the backend using axios
      const response = await axios.post('http://localhost:5001/api/authenticate', payload);

      // Handle success (e.g., navigate to dashboard)
      if (response.status === 200) {
        console.log('Authentication successful', response.data);
        setErrorMessage('');  // Clear any previous error messages
        navigate('/dashboard');
      }
    } catch (error) {
      // Handle error (e.g., show error message)
      console.error('Error submitting data', error);

      // Display an error message to the user
      setErrorMessage('Invalid credentials. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default, // Apply theme background color
      }}
    >
      {/* Sign-in Box */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 400,
          backgroundColor: theme.palette.background.paper, // Box background color from theme
          boxShadow: theme.shadows[4], // Shadow from theme
          borderRadius: 2,
        }}
      >
        {/* Title */}
        <Typography
          component="h1"
          variant="h5"
          align="center"
          sx={{ mb: 3 }}
        >
          {t('Sign In')}
        </Typography>

        {/* Stack to handle form layout */}
        <Stack spacing={2}>
          {/* URL Input */}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          
          {/* Field for InfluxDB URL */}
          <TextField
            id="InfluxDB_URL"
            name="InfluxDB_URL"
            label={t('InfluxDB URL')}
            placeholder={t('Enter InfluxDB URL')}
            fullWidth
            variant="outlined"
            required
          />

          {/* Field for InfluxDB Token */}
          <TextField
            id="InfluxDB_token"
            name="InfluxDB_token"
            label={t('InfluxDB Token')}
            placeholder={t('Enter InfluxDB Token')}
            fullWidth
            variant="outlined"
            required
          />
  
          {/* Field for Organization Name */}
          <TextField
            id="Organization_name"
            name="Organization_name"
            label={t('Organization Name')}
            placeholder={t('Enter Organization Name')}
            fullWidth
            variant="outlined"
            required
          />


        </Stack>

        {/* Sign-In Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3 }}
        >
          {t('Sign In')}
        </Button>
      </Box>
    </Box>
  );
}
