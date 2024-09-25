import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import TimeRangeSelector from './components/TimeRangeSelector';
import Navbar from './components/dashboard/Navbar'; // 确保Navbar被导入

const Layout = ({ iframeUrl, handleTimeRangeChange, createDashboard, loading }) => {
  return (
    <Box>
      {/* Navbar */}
      <Navbar /> 

      {/* 主内容区域 */}
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={2} gap={2}>
        
        {/* 可视化区域 */}
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          width="100%" 
          maxWidth="1200px" 
          height="400px" 
          borderRadius="6px" 
          boxShadow="0px 2px 10px rgba(0,0,0,0.1)" 
          bgcolor="primary" 
          p={2} 
          mb={4}
        >
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Grafana Panel"
            />
          ) : (
            <Typography variant="h6">No data to display</Typography>
          )}
        </Box>

        {/* 拖拽和时间范围选择区域 */}
        <Box display="flex" width="100%" maxWidth="1200px" justifyContent="space-between" gap={2}>
          
          {/* 拖拽区域 */}
          <Box 
            flex={1} 
            height="200px" 
            borderRadius="6px" 
            boxShadow="0px 2px 10px rgba(0,0,0,0.1)" 
            bgcolor="primary" 
            p={2}
          >
            <Typography variant="body1">Drag and Drop Area</Typography>
          </Box>

          {/* 时间选择区域 */}
          <Box 
            sx={{ 
              width: '40%', 
              padding: '2rem', 
              backgroundColor: 'primary', 
              borderRadius: '8px', 
              boxShadow: 1 
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ textAlign: 'center', marginBottom: '1rem' }}
            >
              Select Time Range
            </Typography>
            <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
            <Box sx={{ marginTop: '1rem', textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={createDashboard} 
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Dashboard"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
