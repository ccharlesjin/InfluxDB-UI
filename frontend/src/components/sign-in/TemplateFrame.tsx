import * as React from 'react';
import {
  createTheme,
  ThemeProvider,
  PaletteMode,
  styled,
} from '@mui/material/styles';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ToggleColorMode from './ToggleColorMode';
import getSignInTheme from './theme/getSignInTheme';
import LanguageIcon from '@mui/icons-material/Language';
import Menu from '@mui/material/Menu';
import { useTranslation } from 'react-i18next';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  backgroundImage: 'none',
  zIndex: theme.zIndex.drawer + 1,
  flex: '0 0 auto',
}));

interface TemplateFrameProps {
  showCustomTheme: boolean;
  toggleCustomTheme: (theme: boolean) => void;
  mode: PaletteMode;
  toggleColorMode: () => void;
  children: React.ReactNode;
  changeLanguage: (lng: string) => void; // 添加此属性
  language: string; // 添加此属性
}

export default function TemplateFrame({
  showCustomTheme,
  toggleCustomTheme,
  mode,
  toggleColorMode,
  children,
  changeLanguage, // 添加此参数
  language, // 添加此参数
}: TemplateFrameProps) {
  const { t } = useTranslation(); // 导入翻译函数

  const [languageAnchorEl, setLanguageAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLanguageMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = (lng?: string) => {
    setLanguageAnchorEl(null);
    if (lng) {
      changeLanguage(lng);
    }
  };

  const handleThemeChange = (event: SelectChangeEvent) => {
    toggleCustomTheme(event.target.value === 'custom');
  };

  const signInTheme = createTheme(getSignInTheme(mode));

  return (
    <ThemeProvider theme={signInTheme}>
      <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <StyledAppBar>
          <Toolbar
            variant="dense"
            disableGutters
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              p: '8px 12px',
            }}
          >
            <Button
              variant="text"
              size="small"
              aria-label={t('Back to templates')}
              startIcon={<ArrowBackRoundedIcon />}
              component="a"
              href="/material-ui/getting-started/templates/"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              {t('Back to templates')}
            </Button>
            <IconButton
              size="small"
              aria-label={t('Back to templates')}
              component="a"
              href="/material-ui/getting-started/templates/"
              sx={{ display: { xs: 'auto', sm: 'none' } }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl variant="outlined" sx={{ minWidth: 180 }}>
                <Select
                  size="small"
                  labelId="theme-select-label"
                  id="theme-select"
                  value={showCustomTheme ? 'custom' : 'material'}
                  onChange={handleThemeChange}
                  label={t('Design Language')}
                >
                  <MenuItem value="custom">{t('Custom Theme')}</MenuItem>
                  <MenuItem value="material">{t('Material Design 2')}</MenuItem>
                </Select>
              </FormControl>
              <ToggleColorMode
                data-screenshot="toggle-mode"
                mode={mode}
                toggleColorMode={toggleColorMode}
              />
              <IconButton
                size="small"
                color="inherit"
                onClick={handleLanguageMenuClick}
                aria-label={t('Change Language')}
              >
                <LanguageIcon />
              </IconButton>
              <Menu
                id="language-menu"
                anchorEl={languageAnchorEl}
                open={Boolean(languageAnchorEl)}
                onClose={() => handleLanguageMenuClose()}
              >
                <MenuItem onClick={() => handleLanguageMenuClose('en')}>{t('English')}</MenuItem>
                <MenuItem onClick={() => handleLanguageMenuClose('zh')}>{t('Chinese')}</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </StyledAppBar>
        <Box sx={{ flex: '1 1', overflow: 'auto' }}>{children}</Box>
      </Box>
    </ThemeProvider>
  );
}
