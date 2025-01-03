// SignIn.js
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword';
import getSignInTheme from './theme/getSignInTheme';
import TemplateFrame from './TemplateFrame';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: '100%',
  padding: 20,
  backgroundImage:
    'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
  backgroundRepeat: 'no-repeat',
  ...theme.applyStyles('dark', {
    backgroundImage:
      'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
  }),
}));

export default function SignIn() {
  const { t, i18n } = useTranslation();

  const [mode, setMode] = React.useState('light');
  const [showCustomTheme, setShowCustomTheme] = React.useState(true);
  const defaultTheme = createTheme({ palette: { mode } });
  const SignInTheme = createTheme(getSignInTheme(mode));
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [organizationError, setOrganizationError] = React.useState(false);
  const [organizationErrorMessage, setOrganizationErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  // 检测系统的颜色偏好
  React.useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      setMode(savedMode);
    } else {
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      setMode(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleColorMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const toggleCustomTheme = () => {
    setShowCustomTheme((prev) => !prev);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // 添加语言切换函数
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng); // 保存语言选择到 localStorage
  };

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

    let isValid = validateInputs();

    if (isValid) {
      try {
        const response = await axios.post('https://localhost:5001/api/authenticate', payload, {
          withCredentials: true,  // 在请求配置中添加 withCredentials
        });

        const result = response.data;

        if (response.status === 200) {
          console.log(t('Login successful. Redirecting to Dashboard...'));
          navigate('/dashboard');
        } else {
          console.error(t('Login failed:'), result.message);
          alert(t('Login failed:') + ' ' + result.message);
        }
      } catch (error) {
        console.log('error', error);
        console.error(t('An error occurred during login. Please try again later.'), error);
        alert(t('An error occurred during login. Please try again later.'));
      }
    }
  };

  const validateInputs = () => {
    const usernameInput = document.getElementById('InfluxDB_URL');
    const passwordInput = document.getElementById('InfluxDB_token');
    const organizationInput = document.getElementById('Organization_name');

    let isValid = true;

    if (!usernameInput.value || !usernameInput.value.match(/^http?:\/\/(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|[\w.-]+(?:\.[\w\.-]+)+)(?::\d+)?(?:[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]*)$/)) {
      setUsernameError(true);
      setUsernameErrorMessage(t('Please enter a valid username.'));
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!passwordInput.value || passwordInput.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(t('Password must be at least 6 characters long.'));
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!organizationInput.value || organizationInput.value.length < 1) {
      setOrganizationError(true);
      setOrganizationErrorMessage(t('Enter Organization Please.'));
      isValid = false;
    } else {
      setOrganizationError(false);
      setOrganizationErrorMessage('');
    }

    return isValid;
  };

  return (
    <TemplateFrame
      toggleCustomTheme={toggleCustomTheme}
      showCustomTheme={showCustomTheme}
      mode={mode}
      toggleColorMode={toggleColorMode}
      changeLanguage={changeLanguage} // 传递语言切换函数
      language={i18n.language} // 传递当前语言
    >
      <ThemeProvider theme={showCustomTheme ? SignInTheme : defaultTheme}>
        <CssBaseline enableColorScheme />
        <SignInContainer direction="column" justifyContent="space-between">
          <Card variant="outlined">
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
            >
              {t('SignIn')}
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel htmlFor="InfluxDB_URL">{t('InfluxDB_URL')}</FormLabel>
                <TextField
                  error={usernameError}
                  helperText={usernameErrorMessage}
                  id="InfluxDB_URL"
                  type="url"
                  name="InfluxDB_URL"
                  placeholder={t('Enter InfluxDB URL')}
                  autoComplete="url"
                  autoFocus
                  required
                  fullWidth
                  variant="outlined"
                  color={usernameError ? 'error' : 'primary'}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="InfluxDB_token">{t('InfluxDB_token')}</FormLabel>
                <TextField
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  name="InfluxDB_token"
                  placeholder={t("Enter InfluxDB Token")}
                  type="text"
                  id="InfluxDB_token"
                  //autoComplete="current-password"
                  autoComplete='off'
                  required
                  fullWidth
                  variant="outlined"
                  color={passwordError ? 'error' : 'primary'}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="Organization_name">{t('Organization')}</FormLabel>
                <TextField
                  error={organizationError}
                  helperText={organizationErrorMessage}
                  name="Organization_name"
                  placeholder={t("Enter InfluxDB Organization")}
                  type="text"
                  id="Organization_name"
                  //autoComplete="current-password"
                  autoComplete='off'
                  required
                  fullWidth
                  variant="outlined"
                  color={organizationError ? 'error' : 'primary'}
                />
              </FormControl>
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label={t('Remember me')}
              />
              <ForgotPassword open={open} handleClose={handleClose} />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                onClick={validateInputs}
              >
                {t('Sign in')}
              </Button>
            </Box>
          </Card>
        </SignInContainer>
      </ThemeProvider>
    </TemplateFrame>
  );
}
