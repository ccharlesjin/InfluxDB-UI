import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import Drag from './components/drag/Drag';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from './components/theme';
import Layout from './components/Layout';
import axios from 'axios';

const App = () => {
  const [theme, colorMode] = useMode();
  const [loading, setLoading] = useState(false); // Application-wide loading state

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* 确保 BrowserRouter 包裹了整个应用 */}
        <BrowserRouter>
          <AppContent setLoading={setLoading} loading={loading} />
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const AppContent = ({ setLoading, loading }) => {
  const navigate = useNavigate(); // 使用useNavigate进行路由跳转

  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);  // 确保拦截器在navigate初始化后运行

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SignIn setLoading={setLoading} loading={loading} />} />
        <Route path="/dashboard" element={<Drag />} />
      </Routes>
    </Layout>
  );
};

// 设置axios拦截器，捕捉401或403错误并跳转
const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Token invalid or expired, redirecting to login...');
        localStorage.removeItem('session_token');  // 清理本地存储中的token
        
        // 弹出提示信息
        alert('Your session has expired or you are not authorized. Redirecting to login...');
        
        // 跳转到登录页
        navigate('/');
      }
      return Promise.reject(error);
    }
  );
};

// const App = () => {
//   const [theme, colorMode] = useMode();
//   const [loading, setLoading] = useState(false); // Application-wide loading state
//   const navigate = useNavigate(); 

//   setupAxiosInterceptors(navigate);
//   // 在组件挂载时设置拦截器
//   useEffect(() => {
//     setupAxiosInterceptors(navigate);
//   }, [navigate]);  // 当navigate改变时重新设置拦截器

//   return (
//     <ColorModeContext.Provider value={colorMode}>
//       <ThemeProvider theme={theme}>
//         <CssBaseline />
        
//         <BrowserRouter>
//           <Layout>
//             <Routes>
//               <Route path="/" element={<SignIn setLoading={setLoading} loading={loading}/>} />
//               <Route path="/dashboard" element={<Drag/>} />
//             </Routes>
//           </Layout>
//         </BrowserRouter>
        
//       </ThemeProvider>
//     </ColorModeContext.Provider>
//   );
// };

export default App;