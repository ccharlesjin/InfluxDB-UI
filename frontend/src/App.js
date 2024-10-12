// import React, { useState, useEffect } from 'react';
import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SignIn from './components/SignIn';
import Drag from './components/drag/Drag';
// import MainDashboard from './components/MainDashboard';
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from './components/theme';
import Layout from './components/Layout';
// import TestDashboard from './components/TestDashboard';

const App = () => {
  const [theme, colorMode] = useMode();
  const [loading, setLoading] = useState(false); // Application-wide loading state
  
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<SignIn setLoading={setLoading} loading={loading}/>} />
              {/* <Route path="/dashboard" element={<MainDashboard setLoading={setLoading} loading={loading} />} /> */}
              <Route path="/dashboard" element={<Drag/>} />
              {/* <Route path="/test" element={<TestDashboard/>} /> */}
              {/* <Route path="/drag" element={<Drag/>} /> */}
            </Routes>
          </Layout>
        </BrowserRouter>
        
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;