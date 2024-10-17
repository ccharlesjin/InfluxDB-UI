import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';

const ChartTypeSelector = ({ dashboardUid }) => {
  const [chartType, setChartType] = useState('');
  const [chartTypeList, setChartTypeList] = useState([
    'graph',
    'stat',
    'gauge',
    'table',
    'heatmap',
    'bargauge'
  ]);

  useEffect(() => {
    // 初始化时获取默认的图表类型
    fetchCurrentChartType();
  }, []);

  const fetchCurrentChartType = async () => {
    console.log('Fetching current chart type...');
    console.log("dashboardUid",dashboardUid);
    try {
      const response = await axios.get(`https://localhost:5001/api/getDashboardType/${dashboardUid}`);
      const defaultChartType = response.data.chartType || 'graph'; // 假设API返回当前图表类型
      setChartType(defaultChartType);
    } catch (error) {
      console.error('Error fetching current chart type:', error);
    }
  };

  const handleChartTypeChange = async (e) => {
    const selectedChartType = e.target.value;
    setChartType(selectedChartType);

    // 调用后端API更新图表类型
    try {
      await axios.post('https://localhost:5001/api/updateDashboardType', {
        dashboardUid: dashboardUid,
        chartType: selectedChartType,
      });

      console.log(`Dashboard ${dashboardUid} updated to chart type: ${selectedChartType}`);
    } catch (error) {
      console.error('Error updating chart type:', error);
    }
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="chart-type-label">Chart Type</InputLabel>
      <Select
        labelId="chart-type-label"
        value={chartType}
        onChange={handleChartTypeChange}
        fullWidth
      >
        {chartTypeList.map((type, index) => (
          <MenuItem key={index} value={type}>
            {type}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ChartTypeSelector;
