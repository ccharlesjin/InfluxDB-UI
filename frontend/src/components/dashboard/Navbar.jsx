import { Box, IconButton, useTheme } from '@mui/material';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';  // 用于页面重定向
import { ColorModeContext, tokens } from '../../theme';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';

const Navbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const navigate = useNavigate();  // 用于登出后重定向

    // 登出功能：清除登录状态并重定向
    const handleLogout = () => {
        // 这里可以执行登出逻辑，例如清除token或用户信息
        localStorage.removeItem('authToken');  // 假设你存储了authToken

        // 重定向到登录页
        navigate('/login');
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                justifyContent: 'center',  
                width: '100%', 
                backgroundColor: colors.primary[500],
                padding: '0.5rem 0',  // 调整上下内边距
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)'  // 添加阴影以突出导航栏
            }}
        >
            <Box 
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    width: '100%', 
                    maxWidth: '1200px',  // 确保与页面其他内容宽度一致
                    px: 2
                }}
            >
                {/* 搜索框 */}
                <Box display='flex' backgroundColor={colors.primary[400]} borderRadius='6px'>
                    <InputBase sx={{ ml: 2, flex: 1 }} placeholder='Search' />
                    <IconButton type='button' sx={{ p: 1 }}>
                        <SearchIcon />
                    </IconButton>
                </Box>

                {/* 右侧图标 */}
                <Box display='flex'>
                    <IconButton onClick={colorMode.toggleColorMode}>
                        {theme.palette.mode === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />}
                    </IconButton>

                    {/* 点击Person Icon登出 */}
                    <IconButton onClick={handleLogout}>
                        <PersonOutlined />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default Navbar;
