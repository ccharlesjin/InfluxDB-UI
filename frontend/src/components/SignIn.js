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
    const influxDB_token = data.get('influxDB_token');
    const influxDB_username = data.get('influxDB_username');
    const influxDB_password = data.get('influxDB_password');
    const Grafana_URL = data.get('Grafana_URL');
    const Grafana_token = data.get('Grafana_token');
    const Grafana_datasourceID = data.get('Grafana_datasourceID');

    // Prepare the request payload
    const payload = {
      influxDB_token,
      influxDB_username,
      influxDB_password,
      Grafana_URL,
      Grafana_token,
      Grafana_datasourceID
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

          {/* Field for InfluxDB token */}
          {/* <TextField
            id="influxdDB_token"
            name="influxDB_token"
            label={t('InfluxDB Token')}
            placeholder={t('Enter InfluxDB Token')}
            fullWidth
            variant="outlined"
          /> */}

          {/* Field for username */}
          {/* <TextField
            id="influxDB_username"
            name="influxDB_username"
            label={t('InfluxDB Username')}
            placeholder={t('Enter InfluxDB Username')}
            fullWidth
            variant="outlined"
          /> */}
          
          {/* Field for password */}
          {/* <TextField
            id="influxDB_password"
            name="influxDB_password"
            label={t('InfluxDB Password')}
            placeholder={t('Enter InfluxDB Password')}
            type="password"
            fullWidth
            variant="outlined"
          /> */}
          
          {/* Field for Grafana URL */}
          <TextField
            id="Grafana_URL"
            name="Grafana_URL"
            label={t('Grafana URL')}
            placeholder={t('Enter Grafana URL')}
            fullWidth
            variant="outlined"
            required
          />

          {/* Field for Grafana token */}
          <TextField
            id="Grafana_token"
            name="Grafana_token"
            label={t('Grafana Token')}
            placeholder={t('Enter Grafana Token')}
            fullWidth
            variant="outlined"
            required
          />
  
          {/* Field for Grafana datasourceID */}
          <TextField
            id="Grafana_datasourceID"
            name="Grafana_datasourceID"
            label={t('Grafana datasourceID')}
            placeholder={t('Enter Grafana datasourceID')}
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
