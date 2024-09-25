import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Route, Routes } from 'react-router-dom'; // 正确导入 BrowserRouter, Route 和 Routes
import SignIn from './components/sign-in/SignIn';
import Dashboard from './components/dashboard/Dashboard';
import QueryBuilder from './components/QueryBuilder';
import TestBucket from './components/TestBucket';
import TestDashboard from './components/TestDashboard';

import { CssBaseline, ThemeProvider } from "@mui/material";

import { ColorModeContext, useMode } from './theme.js'; // 引入主题支持
import Layout from './Layout'; // 引入Layout组件

const App = () => {
  const [theme, colorMode] = useMode(); // 处理主题模式
  const [message, setMessage] = useState('');  // 存储后端消息

  // 你的额外状态管理
  const [bucket, setBucket] = useState("test");
  const [windowPeriod, setWindowPeriod] = useState("10m");
  const [iframeUrl, setIframeUrl] = useState("");
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [loading, setLoading] = useState(false);

  // 从后端获取消息
  useEffect(() => {
    axios.get('http://localhost:5001/')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

  // 处理查询提交
  const handleQuerySubmit = (queryData) => {
    console.log('Submitted Query Data:', queryData);
    
    // 将查询数据发送到后端
    fetch('http://localhost:4000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Query Response:', data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // 创建仪表盘
  const createDashboard = async () => {
    if (!timeRange.start || !timeRange.end) {
      alert("Please select a valid time range");
      return;
    }

    try {
      setLoading(true);
      const start = timeRange.start.unix() * 1000;
      const stop = timeRange.end.unix() * 1000;

      const response = await axios.post('http://localhost:5001/create-dashboard', {
        bucket,
        windowPeriod,
        from: start,
        to: stop
      });

      setIframeUrl(response.data.dashboardUrl);
    } catch (error) {
      console.error('Error creating dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* 全局重置样式 */}
        
        <BrowserRouter> {/* 这里使用 BrowserRouter 包裹整个应用 */}
          {/* 使用 Layout 包裹路由 */}
          <Layout 
            iframeUrl={iframeUrl} 
            handleTimeRangeChange={handleTimeRangeChange} 
            createDashboard={createDashboard} 
            loading={loading} 
          >
            <Routes>
              <Route path="/" element={<SignIn />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/test" element={<QueryBuilder onSubmit={handleQuerySubmit} />} />
              <Route path="/buckets" element={<TestBucket />} /> 
              <Route path="/dashboards" element={<TestDashboard />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
