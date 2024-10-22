import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Select, MenuItem, useTheme, TextField, InputLabel } from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TimeRangeSelector from './TimeRangeSelector';
import axios from 'axios';
import dayjs from 'dayjs';

const ItemTypes = {
  MEASUREMENT: 'measurement',
  FIELD: 'field',
};

function MeasurementItem({ measurement, location }) {
  // location 表示 measurement 的位置，可能的值有 'list' 和 'dropArea'
  const theme = useTheme();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MEASUREMENT,
    item: { measurement, location },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [measurement, location]);

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        padding: '5px',
        margin: '5px',
        backgroundColor: theme.palette.primary.main,
        // backgroundColor: canDrop ? theme.palette.primary.main : theme.palette.action.disabledBackground,
        border: `1px solid ${theme.palette.secondary.main}`,
        borderRadius: '4px',
        cursor: 'grab',
      }}
    >
      {measurement}
    </Box>
  );
}

function MeasurementList({ measurements, onDropMeasurement, canDrop }) {
  const theme = useTheme();
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.MEASUREMENT,
    
    drop: canDrop ? (item) => {
      if (item.location === 'dropArea') {
        // 从 DropArea 拖回 MeasurementList
        onDropMeasurement(item.measurement, 'remove');
      }
    } : null,
    collect: (monitor) => ({
      isOver: monitor.isOver() && canDrop,
    }),
  }), [onDropMeasurement, canDrop]);

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isOver ? theme.palette.primary.light : theme.palette.background.default,
        padding: '10px',
        minHeight: '100px',
        // border: `1px solid rgba(204, 204, 204, 0.3)`,
        // paddingTop: '0px',
        borderRadius: '5px',
      }}
    >
      {measurements.map((measurement) => (
        <MeasurementItem key={measurement} measurement={measurement} location="list" />
      ))}
    </div>
  );
}


function DropArea({ droppedMeasurements, onDropMeasurement, canDrop }) {
  const theme = useTheme();
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.MEASUREMENT,
    drop: canDrop ? (item) => {
      if (item.location === 'list') {
        // 从 MeasurementList 拖入
        onDropMeasurement(item.measurement, 'add');
      }
    } : null,
    collect: (monitor) => ({
      isOver: monitor.isOver() && canDrop,
    }),
  }), [onDropMeasurement, canDrop]);

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isOver ? theme.palette.primary.light : theme.palette.background.default,
        padding: '10px',
        minHeight: '100px',
        border: `1.5px dashed rgba(204, 204, 204, 0.3)`,
        paddingTop: '0px',
        borderRadius: '5px',
        // display: 'flex',
        // alignItems: 'center',
      }}
    >
      <p style={{ textAlign: 'center', marginTop: '10px' }}>Drag measurements here</p>
      {droppedMeasurements.map((measurement) => (
        <MeasurementItem  key={measurement} measurement={measurement} location="dropArea" />
      ))}
    </div>
  );
}


function FieldItem({ field, measurement, location }) {
  const theme = useTheme();
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.FIELD,
      item: { field, measurement, location },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [field, measurement, location]
  );

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        padding: '5px',
        margin: '5px',
        // backgroundColor: location === 'available' ? '#f0ad4e' : '#5cb85c',
        backgroundColor: theme.palette.primary.main,
        border: `1px solid ${theme.palette.secondary.main}`,
        borderRadius: '4px',
        cursor: 'grab',
      }}
    >
      {field}
    </Box>
  );
}

function FieldList({ fields, measurement, onFieldRemove, canDrop }) {
  const theme = useTheme();
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.FIELD,
      drop: canDrop ? (item) => {
        if (item.measurement === measurement && item.location === 'selected') {
          // Move from selected list back to available list
          onFieldRemove(measurement, item.field);
        }
      } : null,
      collect: (monitor) => ({
        isOver: monitor.isOver() && canDrop,
      }),
    }),
    [onFieldRemove, measurement, canDrop]
  );

  return (
    // <div style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
    <div ref={drop} style={{
      backgroundColor: isOver ? theme.palette.primary.light : theme.palette.background.default,
      padding: '10px',
      minHeight: '100px',
      marginBottom: '10px',
      border: `1px solid rgba(204, 204, 204, 0.3)`,
      borderRadius: '5px'
    }}>
      {/* </div> */}
      {fields.length > 0 ? (
        fields.map((field) => (
          <FieldItem
            key={field}
            field={field}
            measurement={measurement}
            location="available"
          />
        ))
      ) : (
        <p>No available fields</p>
      )}
    </div>
    // </div>
  );
}

function SelectedFieldList({ fields, measurement, onFieldSelect, canDrop  }) {
  const theme = useTheme();
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemTypes.FIELD,
      drop: canDrop ? (item) => {
        if (item.measurement === measurement && item.location === 'available') {
          // Move from available list to selected list
          onFieldSelect(measurement, item.field);
        }
      } : null,
      collect: (monitor) => ({
        isOver: monitor.isOver() && canDrop,
      }),
    }),
    [onFieldSelect, measurement, canDrop]
  );

  return (
    // <div style={{ border: '1px solid #ccc', padding: '10px', margin: '5px 0' }}>
    <div ref={drop} style={{
      backgroundColor: isOver ? theme.palette.primary.light : theme.palette.background.default,
      padding: '10px',
      border: `1.5px dashed rgba(204, 204, 204, 0.3)`,
      borderRadius: '5px',
      minHeight: '100px'
    }}>
      <p style={{ textAlign: 'center', marginTop: '0px' }}>Drag fields here</p>
      {fields.length > 0 ? (
        fields.map((field) => (
          <FieldItem
            key={field}
            field={field}
            measurement={measurement}
            location="selected"
          />
        ))
      ) : (
        <p style={{ textAlign: 'center' }}>No selected fields</p>
      )}
    </div>
  );
}

export default function DragAndDropComponent() {
  const [loading, setLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [bucket, setBucket] = useState('');
  const [bucketList, setBucketList] = useState([]);
  // const [errorMessage, setErrorMessage] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [droppedMeasurements, setDroppedMeasurements] = useState([]);
  const [measurementFields, setMeasurementFields] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [queryCode, setQueryCode] = useState('');
  const [isQueryVisible, setIsQueryVisible] = useState(false);
  // const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [timeRange, setTimeRange] = useState({
    start: dayjs().subtract(1, 'day'), // 设置为一天前的时间
    end: dayjs() // 设置为当前时间
  });
  const theme = useTheme();
  const [dashboardUid, setDashboardUid] = useState('');
  const [chartType, setChartType] = useState('graph');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);  // 是否正在复现状态
  const [isEditing, setIsEditing] = useState(false);  // 是否处于编辑模式
  // const [overwrite, setOverwrite] = useState(false);  // 后端 overwrite 标志
  const [isDownloading, setIsDownloading] = useState(false);
  const [chartTypeList] = useState([
    'graph',
    'timeseries',   // Time series
    'state-timeline',  // State timeline
    'status-history',  // Status history
    'barchart',     // Bar chart
    'histogram',    // Histogram
    'heatmap',      // Heatmap
    'piechart',     // Pie chart
    'candlestick',  // Candlestick
    'gauge',        // Gauge
    'trend',        // Trend
    'xychart',      // XY chart
    'stat',         // Stat
    'bargauge',     // Bar gauge
    'table',        // Table
    'logs',         // Logs
    'nodeGraph',    // Node graph
    'traces',        // Traces
    'flamegraph',   // Flame graph
    'canvas',       // Canvas
    'geomap',       // Geomap
    'datagrid',     // Datagrid
    'dashlist',     // Dashboard list
    'alertlist',    // Alert list
    'annotationslist',  // Annotations list
    'text',         // Text
    'news'          // News
]);

  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // 获取 buckets
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await axios.get('https://localhost:5001/api/buckets', {
          withCredentials: true,  // 在请求配置中添加 withCredentials
        });
        setBucketList(response.data.buckets);
      } catch (error) {
        console.log('Error fetching bucket list:', error);
        // setErrorMessage('Failed to fetch bucket list');
      }
    };
    fetchBuckets();
  }, []);

  // 获取 measurements
  useEffect(() => {
    if (bucket) {
      const fetchMeasurements = async () => {
        try {
          const response = await axios.get('https://localhost:5001/api/measurements', {
            params: { bucket },
          }, {
            withCredentials: true,  // 在请求配置中添加 withCredentials
          });
          setMeasurements(response.data.measurements);
        } catch (error) {
          console.log('Error fetching measurements:', error);
          // setErrorMessage('Failed to fetch measurements');
        }
      };
      fetchMeasurements();
    }
  }, [bucket]);

  const createDashboard = async () => {
    if (!timeRange.start || !timeRange.end) {
      alert("Please select a valid time range");
      return;
    }
    if (title.trim() === '') {
      setError('Title cannot be empty');
      return;
    }
    try {
      // show loading page
      setLoading(true); 
      console.log('Dashboard created with title:', title);
      const start = timeRange.start.unix() * 1000;
      const stop = timeRange.end.unix() * 1000;

      const response = await axios.post('https://localhost:5001/api/save-dashboard', {
        from: start,
        to: stop,
        fluxQuery: queryCode,
        type: chartType,
        title: title,
      });
      console.log('response:', response);

      setDashboardUid(response.data.dashboardUid);
      setIframeUrl(response.data.dashboardUrl);
      fetchDashboards();
      setTitle('');
      setError('');
      alert('Dashboard saved successfully');
    } catch (error) {
      if (error.response && error.response.status === 412) {
        alert(error.response.data.message); // 提示用户标题已存在
      } else {
        alert('Failed to save the dashboard. Please try again.');
      }
      console.error('Error creating dashboard:', error);
    } finally {
      setLoading(false); // Hide loading after operation
    }
  };

  // 生成查询代码
  const generateFluxQuery = useCallback(() => {
    console.log('Trying to generating query..., with isRestoring: ', isRestoring);
    if (isRestoring) return;
    
    let query = `from(bucket: "${bucket}")\n`;
    query += `  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n`;
    
    if (droppedMeasurements && droppedMeasurements.length > 0) {
      const measurementFilters = droppedMeasurements
        .map((measurement) => `r["_measurement"] == "${measurement}"`)
        .join(' or ');
      query += `  |> filter(fn: (r) => ${measurementFilters})\n`;
    }
    
    const fields = Object.values(selectedFields).flat();
    if (fields && fields.length > 0) {
      const fieldFilters = fields
        .map((field) => `r["_field"] == "${field}"`)
        .join(' or ');
      query += `  |> filter(fn: (r) => ${fieldFilters})\n`;
    }
    ;

    query += '  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: "mean")';

    setQueryCode(query);
    console.log("query: ", query);
    console.log("queryCode: ", queryCode);

    if (!timeRange.start || !timeRange.end) {
      alert("Please select a valid time range");
      return;
    }

    setLoading(true); 
    const start = timeRange.start.unix() * 1000;
    const stop = timeRange.end.unix() * 1000;

    // 发送生成的查询到后端
    axios
      .post('https://localhost:5001/api/execute-query', { 
        fluxQuery: query,
        from: start,
        to: stop,
        type: chartType,
      })
      .then((response) => {
        setIframeUrl(response.data.dashboardUrl);  // newUrl 是你更新后的 Grafana 面板 URL
        setLoading(false); 
        setDashboardUid(response.data.dashboardUid);
        fetchCurrentChartType();
        console.log('setDashboardUid:', response.data.dashboardUid);
        // console.log('Query sent successfully:', response.data);
        // setSelectedDashboard('');  // 清空当前选择
      })
      .catch((error) => {
        console.error('Error sending query:', error);
      });

  }, [bucket, droppedMeasurements, selectedFields, timeRange, chartType, isRestoring]);

  // useEffect(() => {
  //   if (droppedMeasurements.length > 0) {
  //     generateFluxQuery();
  //   } else {
  //     setQueryCode('');
  //   }
  // }, [generateFluxQuery]);

  // 处理 measurement 的拖拽放置
  const handleDropMeasurement = (measurement, action) => {
    if (action === 'add') {
      if (!droppedMeasurements.includes(measurement)) {
        setDroppedMeasurements((prev) => [...prev, measurement]);
        fetchFieldsForMeasurement(measurement);
      }
    } else if (action === 'remove') {
      setDroppedMeasurements((prev) => prev.filter((m) => m !== measurement));

      // 清理对应的 fields 和选中状态
      setMeasurementFields((prev) => {
        const newFields = { ...prev };
        delete newFields[measurement];
        return newFields;
      });

      setSelectedFields((prev) => {
        const newSelected = { ...prev };
        delete newSelected[measurement];
        return newSelected;
      });
    }
  };


  // 获取 measurement 的 fields
  const fetchFieldsForMeasurement = async (measurement) => {
    try {
      const response = await axios.get('https://localhost:5001/api/fields', {
        params: { bucket, measurement },
      });
      setMeasurementFields((prev) => ({
        ...prev,
        [measurement]: response.data.fields,
      }));
      // 初始化 selectedFields
      setSelectedFields((prev) => ({
        ...prev,
        [measurement]: [],
      }));
    } catch (error) {
      console.error(`Error fetching fields for ${measurement}:`, error);
      // setErrorMessage(`Failed to fetch fields for ${measurement}`);
    }
  };

  const handleFieldSelect = (measurement, field) => {
    // 将字段从可用列表移动到选中列表
    setSelectedFields((prev) => ({
      ...prev,
      [measurement]: [...(prev[measurement] || []), field],
    }));
    setMeasurementFields((prev) => ({
      ...prev,
      [measurement]: prev[measurement].filter((f) => f !== field),
    }));
  };

  const handleFieldRemove = (measurement, field) => {
    // 将字段从选中列表移回可用列表
    setMeasurementFields((prev) => ({
      ...prev,
      [measurement]: [...(prev[measurement] || []), field],
    }));
    setSelectedFields((prev) => ({
      ...prev,
      [measurement]: prev[measurement].filter((f) => f !== field),
    }));
  };

  const fetchCurrentChartType = async () => {
    console.log('Fetching current chart type...');
    console.log('Dashboard UID:', dashboardUid);
    if (dashboardUid) {
      try {
        const response = await axios.get(`https://localhost:5001/api/getDashboardType/${dashboardUid}`);
        const defaultChartType = response.data.chartType || 'graph'; // 假设API返回当前图表类型
        setChartType(defaultChartType);
        console.log(`Chart type: ${defaultChartType}`);
      } catch (error) {
        console.error('Error fetching current chart type:', error);
      }
    };
  };

  const handleChartTypeChange = async (e) => {
    const selectedChartType = e.target.value;
    setChartType(selectedChartType);
    const start = timeRange.start.unix() * 1000;
    const stop = timeRange.end.unix() * 1000;
    // 调用后端API更新图表类型
    if(dashboardUid){
      try {
        const response = await axios.post('https://localhost:5001/api/updateDashboardType', {
          dashboardUid: dashboardUid,
          chartType: selectedChartType,
          from: start,
          to: stop,
        });
        setDashboardUid(response.data.dashboardUid);
        setIframeUrl(response.data.dashboardUrl);
        console.log(`Dashboard ${dashboardUid} updated to chart type: ${selectedChartType}`);

      } catch (error) {
        console.error('Error updating chart type:', error);
      }
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (e.target.value.trim() === '') {
      setError('Title cannot be empty');
    } else {
      setError('');
    }
  };

  const Reset = () => {
    return new Promise((resolve) => {
      console.log('Resetting...');
  
      // 将所有状态重置为空或初始值
      setBucket('');
      setMeasurements([]);
      setDroppedMeasurements([]);
      setMeasurementFields({});
      setSelectedFields({});
      setTimeRange({
        start: dayjs().subtract(1, 'day'),
        end: dayjs(),
      });
      setQueryCode('');
      setIframeUrl('');
      // setErrorMessage('');
      setSelectedDashboard('');
  
      // 等待下一个渲染周期后再 resolve，确保状态更新完成
      setTimeout(() => {
        resolve();
        console.log('Resetting...done');
      }, 0);  // 使用微小延迟确保状态完全重置后再继续
    });
  };

  const ResetForSelect = () => {
    return new Promise((resolve) => {
      console.log('Resetting...');
  
      // 将所有状态重置为空或初始值
      setBucket('');
      setMeasurements([]);
      setDroppedMeasurements([]);
      setMeasurementFields({});
      setSelectedFields({});
      setTimeRange({
        start: dayjs().subtract(1, 'day'),
        end: dayjs(),
      });
      setQueryCode('');
      setIframeUrl('');
      // setErrorMessage('');
      // setSelectedDashboard('');
  
      // 等待下一个渲染周期后再 resolve，确保状态更新完成
      setTimeout(() => {
        resolve();
        console.log('Resetting...done');
      }, 0);  // 使用微小延迟确保状态完全重置后再继续
    });
  };


  const handleDashboardChange = async (e) => {
    const selected = dashboards.find(d => d.uid === e.target.value);
    setIsRestoring(true); 
    setSelectedDashboard(selected.uid);  // 保存选中的 dashboard ID
    await ResetForSelect();  // 等待 Reset 完成
  };

  useEffect(() => {
    if (bucket === '' && measurements.length === 0 && droppedMeasurements.length === 0 && selectedDashboard !== '') {
      console.log('Reset complete, ready to proceed with dashboard change');
      // 这里你可以继续执行剩下的逻辑，保证 Reset 彻底完成后再进行后续的操作
      handleDashboardChangePostReset(selectedDashboard);  // 执行剩余部分
    }
  }, [bucket, measurements, droppedMeasurements, selectedDashboard, handleDashboardChange]);

  const fetchDashboards = async () => {
    try {
      const response = await axios.get('https://localhost:5001/api/dashboards');
      setDashboards(response.data);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDashboardChangePostReset = async (e) => {
    console.log("e: ", e, "dashboards: ", dashboards, "selectedDashboard: ", selectedDashboard, "isRestoring: ", isRestoring);  

    const selected = dashboards.find(d => d.uid === e);
      setIsRestoring(true);
      try {
        // 发送请求获取选中 dashboard 的信息
        const response = await axios.get(`https://localhost:5001/api/dashboard/${selected.uid}`);
        const { query } = response.data;

        // 使用查询更新 drag and drop 区域的状态
        setQueryCode(query);
        console.log('Restored query:', query);

        // 解析 queryCode
        const { bucket, measurements, fields } = parseQueryCode(query);
        console.log('Parsed query:', bucket, measurements, fields);

        // 设置 bucket 并获取对应的 measurements
        setBucket(bucket);

        // 获取 measurements
        const measurementResponse = await axios.get('https://localhost:5001/api/measurements', {
          params: { bucket },
        }, {
          withCredentials: true,  // 在请求配置中添加 withCredentials
        });

        const newMeasurements = measurementResponse.data.measurements;
        setMeasurements(newMeasurements);

        // 确保所有 measurements 和 fields 设置完成后再进行处理
        await Promise.all(
          measurements.map(async (measurement) => {
            console.log('handleDropMeasurement:', measurement);
            if (!droppedMeasurements.includes(measurement)) {
              setDroppedMeasurements((prev) => [...prev, measurement]);

              // 获取 fields
              const response = await axios.get('https://localhost:5001/api/fields', {
                params: { bucket, measurement },
              });
              
              // 只保留当前 measurement 对应的字段
              const currentMeasurementFields = fields.filter(
                (field) => response.data.fields.includes(field)
              );
              console.log('Current measurement fields:', currentMeasurementFields)
              
              // 过滤掉从 parseQueryCode 获取的已选中的 fields
              const availableFields = response.data.fields.filter(
                (field) => !fields.includes(field)  // 排除已选中的 fields
              );

              // 更新 measurementFields 和 selectedFields
              setMeasurementFields((prev) => ({
                ...prev,
                [measurement]: availableFields,  // 仅包含未选择的 fields
              }));

              setSelectedFields((prev) => ({
                ...prev,
                [measurement]: currentMeasurementFields,  // 更新为已选择的 fields
              }));
            }
          })
        );

        setSelectedDashboard(e);
        // 将时间戳转换为 dayjs 对象
        const startTime = dayjs(parseInt(selected.from)); // 假设 from 是时间戳
        const endTime = dayjs(parseInt(selected.to)); // 假设 to 是时间戳
        setTimeRange({ start: startTime, end: endTime });
        setChartType(selected.chartType);
        const timestamp = new Date().getTime();
        const url = `https://localhost:3001/grafana/d-solo/${selected.uid}?orgId=1&panelId=1&theme=light&from=${selected.from}&to=${selected.to}&nocache=${timestamp}`;
        setIframeUrl(url);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        // setIsRestoring(false);
      }
  };

  useEffect(() => {
    console.log('isRestoring 1:', isRestoring);
    if (!isRestoring) {  // 如果不是正在复现状态，才生成查询
      if (droppedMeasurements.length > 0) {
        generateFluxQuery();  // 重新生成查询
      } else {
        setQueryCode('');  // 如果没有 measurement，清空查询
        console.log('queryCode is cleaned up');
      }
    }
  }, [droppedMeasurements, selectedFields, isRestoring, generateFluxQuery]);

  const handleEditDashboard = () => {
    setIsEditing(true);
    setIsRestoring(false); // 停止复现
    // setOverwrite(true); // 标记为覆盖模式
    console.log('isRestoring 2:', isRestoring, 'isEditing:', isEditing);
    setTitle(dashboards.find(d => d.uid === selectedDashboard).title);
  };

  const handleDeleteDashboard = async (uid) => {
    
    try {
      const response = await axios.delete(`https://localhost:5001/api/dashboards/${uid}`);
      if (response.status === 200) {
        alert('Dashboard successfully deleted');
        // 刷新或更新状态以反映删除操作
        
        // 清空 selectedDashboard，并更新 dashboards 列表
        setSelectedDashboard('');  // 清空当前选择
        Reset();                // 重置所有状态
        fetchDashboards();
        // setDashboards(prevDashboards => prevDashboards.filter(dashboard => dashboard.uid !== dashboardUid));
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      alert('Failed to delete dashboard');
    }
  };

  // 退出编辑并保存
  const handleSaveAndExitEdit = async () => {
    try {
      const start = timeRange.start.unix() * 1000;
      const stop = timeRange.end.unix() * 1000;
      // 将编辑后的 Query 和其他数据保存到后端
      let query = `from(bucket: "${bucket}")\n`;
      query += `  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n`;
      
      if (droppedMeasurements && droppedMeasurements.length > 0) {
        const measurementFilters = droppedMeasurements
          .map((measurement) => `r["_measurement"] == "${measurement}"`)
          .join(' or ');
        query += `  |> filter(fn: (r) => ${measurementFilters})\n`;
      }
      
      const fields = Object.values(selectedFields).flat();
      if (fields && fields.length > 0) {
        const fieldFilters = fields
          .map((field) => `r["_field"] == "${field}"`)
          .join(' or ');
        query += `  |> filter(fn: (r) => ${fieldFilters})\n`;
      }
      ;

      query += '  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)\n  |> yield(name: "mean")';

      console.log('Query:', query);
      console.log('queryCode:', queryCode);
      const response = await axios.post('https://localhost:5001/api/update-dashboard', {
        uid: selectedDashboard,
        title: title,
        queryCode: query,
        overwrite: true,
        chartType: chartType,
        from: start,
        to: stop,
      });
      setIframeUrl(response.data.soloPanelUrl);
      setTitle('');  // 清空标题
      alert('Dashboard updated successfully');
    } catch (error) {
      console.error('Failed to update dashboard', error);
      alert('Failed to save the changes');
    } finally {
      setIsRestoring(true);
      setIsEditing(false);
      // setOverwrite(false); // 恢复为普通模式
      fetchDashboards();  // 刷新 dashboards
      // setSelectedDashboard('');  // 清空当前选择
    }
  };

  // 复制 Query 并退出按钮
  const handleCopyAndExit = () => {
    setIsRestoring(false);  // 停止复现状态
    setSelectedDashboard('');  // 清空当前选择
    setTitle('');  // 清空标题
    // 清空其他相关状态，如 droppedMeasurements 等
  };

  // 解析 queryCode 的函数
  const parseQueryCode = (queryCode) => {
    const bucketMatch = queryCode.match(/from\(bucket: "([^"]+)"\)/);
    const measurementMatch = [...queryCode.matchAll(/r\["_measurement"\] == "([^"]+)"/g)];
    const fieldMatch = [...queryCode.matchAll(/r\["_field"\] == "([^"]+)"/g)];
  
    const bucket = bucketMatch ? bucketMatch[1] : '';
    const measurements = measurementMatch ? measurementMatch.map(m => m[1]) : [];
    const fields = fieldMatch ? fieldMatch.map(f => f[1]) : [];
  
    console.log("bucket:", bucket, "measurements:", measurements, "fields:", fields);
    return { bucket, measurements, fields };
  };

  const handleTimeRangeChange = (newStart, newEnd) => {
    setTimeRange({
        start: newStart,
        end: newEnd
    });
};

const downloadImage = async () => {
  // 修改下载状态为 true，显示 “Downloading...” 并禁用按钮
  setIsDownloading(true);
  const renderUrl = iframeUrl.replace('/grafana/', '/grafana/render/');
  console.log('renderUrl:', renderUrl);

  try {
    // 使用 axios 下载图片
    const response = await axios.get(renderUrl, {
      responseType: 'blob',
      withCredentials: true,  // 如果需要凭据
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch image');
    }

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'rendered-chart.png';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading the image:', error);
  } finally {
    // 下载完成后恢复按钮状态
    setIsDownloading(false);
  }
};

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* Visualization area */}
        {/* <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          // maxWidth="1200px" 
          height="400px"
          borderRadius="6px"
          boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
          bgcolor={theme.palette.background.default}
          p={2}
          mb={2}
        >
          {isQueryVisible ? (
            queryCode ? (
              <pre>{queryCode}</pre>
            ) : ( 
              <Typography variant="h6">No query code to display</Typography>
            )
          ) : (
            iframeUrl ? (
              <iframe
                src={iframeUrl}
                width="100%"
                height="100%"
                title="Grafana Panel"
              />
            ) : (
              <Typography variant="h6">No data to display</Typography>
            )
          )}
        </Box> */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="400px"
          borderRadius="6px"
          boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
          bgcolor={theme.palette.background.default}
          p={2}
          mb={2}
        >
          <Box display={isQueryVisible ? 'block' : 'none'} width="100%" height="100%">
            {queryCode ? (
              <pre>{queryCode}</pre>
            ) : (
              <Typography variant="h6">No query code to display</Typography>
            )}
          </Box>

          <Box display={!isQueryVisible ? 'block' : 'none'} width="100%" height="100%">
            {iframeUrl ? (
              <iframe
                src={iframeUrl}
                width="100%"
                height="100%"
                title="Grafana Panel"
                style={{ border: 'none' }}
              />
            ) : (
              <Typography variant="h6">No data to display</Typography>
            )}
          </Box>
        </Box>
        <Box
  flex={1}
  height="110px"
  borderRadius="6px"
  boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
  bgcolor="primary"
  p={2}
  display="flex"
  alignItems="center"
  gap={2}
  mb={2}
>
  {/* <h3>Bucket:</h3> */}
  
  {/* Wrapper for the Selects */}
  <Box display="flex" flexGrow={1} gap={2}>
    <Box display="flex" flexDirection="column">
      <InputLabel id="bucket-label">Bucket</InputLabel>
      <Select
        value={bucket}
        onChange={(e) => {setBucket(e.target.value); setDroppedMeasurements([]); setSelectedFields({}); setQueryCode(''); setIframeUrl('')}}
        style={{ flexGrow: 1, marginBottom: '5px', maxWidth: '500px', minWidth: '200px', marginTop: '5px' }} // Allow it to grow
        disabled={isRestoring || (isEditing === false && selectedDashboard)}
      >
        {bucketList.length > 0 ? (
          bucketList
            .filter((bucketName) => !bucketName.startsWith('_'))
            .map((bucketName, index) => (
              <MenuItem key={index} value={bucketName}>
                {bucketName}
              </MenuItem>
            ))
        ) : (
          <MenuItem disabled>No buckets available</MenuItem>
        )}
    </Select>
    </Box>
    
    <Box display="flex" flexDirection="column">
      <InputLabel id="chart-type-label">Saved Dashboard</InputLabel>
      <TextField
      select
      // label="Select Dashboard"
      value={selectedDashboard}
      onChange={handleDashboardChange}
      fullWidth
      style={{ flexGrow: 1, marginBottom: '5px', maxWidth: '500px', minWidth: '200px',  marginTop: '5px' }}
      // variant="outlined"
      // disabled={isRestoring || (isEditing === false && selectedDashboard)}
    >
      {dashboards.map((dashboard) => (
        <MenuItem key={dashboard.uid} value={dashboard.uid}>
          {dashboard.title}
        </MenuItem>
      ))}
    </TextField>
    </Box>
    <Box display="flex" flexDirection="column" sx={{ marginRight: 'auto' }}>
      <InputLabel id="chart-type-label">Chart Type</InputLabel>
      <Select
        labelId="chart-type-label"
        value={chartType}
        onChange={handleChartTypeChange}
        margin="normal"
        style={{ flexGrow: 1, marginBottom: '5px', maxWidth: '300px', minWidth: '200px', marginTop: '5px' }}
        fullWidth
        variant="outlined"
        label="Chart Type"
        disabled={isRestoring || (isEditing === false && selectedDashboard)}
      >
        {chartTypeList.map((type, index) => (
          <MenuItem key={index} value={type}>
            {type}
          </MenuItem>
        ))}
      </Select>
    </Box>
    <Box display="flex" flexDirection="column" sx={{ marginLeft: 'auto' }}>
      <InputLabel id="time-range-selector-label">Time Range Selector</InputLabel>
      <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} timeRange={timeRange} disabled={isRestoring || (isEditing === false && selectedDashboard)}/>
    </Box>    
    
  </Box>
  <Box display="flex" flexDirection="column">

    <Button
      variant="contained"
      size="small"
      onClick={() => setIsQueryVisible((prev) => !prev)}
      sx={{ textAlign: 'center', marginBottom: '8px' }}
    >
      {isQueryVisible ? 'Show Graph' : 'Show Query'}
    </Button>
    
    <Button
      variant="contained"
      color="primary"
      size="small"
      onClick={Reset}
      disabled={loading}
      sx={{ textAlign: 'center', marginBottom: '8px' }}
    >
      {loading ? "Creating..." : "Reset"}
    </Button>

    <Button 
        variant="contained" 
        color="primary" 
        size="small"
        onClick={downloadImage} 
        disabled={isDownloading || !iframeUrl}  // 按钮在下载中被禁用
        // sx={{ textAlign: 'center', marginBottom: '8px' }}
      >
        {isDownloading ? 'Downloading...' : 'Download'}
      </Button>    
  </Box>
  
</Box>


        <Box
          display="flex"
          flexDirection="column"
          width="100%"
          p={2}
          mb={2}
          borderRadius="6px"
          boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
          bgcolor={theme.palette.background.default}
        >
          {/* Main Container */}
          <Box display="flex" justifyContent="space-between" width="100%" mb={2}>
            {/* Measurement Box */}
            {bucket ? (
            <Box
              flex={1}
              border="1px solid #ccc"
              padding="10px"
              marginRight="10px"
              borderRadius="6px"
            >
              <h3 style={{ margin: 0, textAlign: 'center', paddingBottom: '10px' }}>Measurement</h3>
              {/* Drop Area for Measurements */}
              <Box mb={1.5}>
                <DropArea
                  droppedMeasurements={droppedMeasurements}
                  onDropMeasurement={handleDropMeasurement}
                  canDrop={!isRestoring && (isEditing || !selectedDashboard)}
                />
              </Box>
              {/* Measurement List */}
              <Box style={{ border: `1px solid rgba(204, 204, 204, 0.3)` , borderRadius: '5px'}}>
                {measurements.length > 0 ? (
                  <MeasurementList
                    measurements={measurements}
                    onDropMeasurement={handleDropMeasurement}
                    canDrop={!isRestoring && (isEditing || !selectedDashboard)}
                  />
                ) : (
                  <Box style={{ textAlign: 'center' }}>Select a bucket to load measurements</Box>
                )}
              </Box>
            </Box>
            ) : (
              <Box
              flex={1}
              border="1px solid #ccc"
              padding="10px"
              marginRight="10px"
              borderRadius="6px"
              display="flex"
              textAlign='center'
              justifyContent="center"
              alignItems="center"
              >Please select a bucket</Box>
            )}


            {/* Fields Box */}
            {droppedMeasurements.length > 0 ? (
              droppedMeasurements.map((measurement) =>
                measurement ? (
                  <Box
                    key={`fields-${measurement}`}
                    border="1px solid #ccc"
                    padding="10px"
                    flex={1}
                    marginRight="10px"
                    borderRadius="6px"
                  >
                    <h3 style={{ margin: 0, textAlign: 'center', paddingBottom: '10px' }}>{`Fields for ${measurement}`}</h3>

                    {/* Selected Fields */}
                    <Box flex={1} mb={1.5} style={{ minHeight: '100px', borderRadius: '5px' }}>
                      <SelectedFieldList
                        fields={selectedFields[measurement] || []}
                        measurement={measurement}
                        onFieldSelect={handleFieldSelect}
                        canDrop={!isRestoring && (isEditing || !selectedDashboard)}
                      />
                    </Box>

                    {/* Available Fields */}
                    <Box flex={1}>
                      <FieldList
                        fields={measurementFields[measurement] || []}
                        measurement={measurement}
                        onFieldRemove={handleFieldRemove}
                        canDrop={!isRestoring && (isEditing || !selectedDashboard)}
                      />
                    </Box>
                  </Box>
                ) : null
              )
            ) : (
              <Box
                flex={1}
                border="1px solid #ccc"
                padding="10px"
                marginRight="10px"
                borderRadius="6px"
                display="flex"
                textAlign='center'
                justifyContent="center"
                alignItems="center"
              >Please select Measurement(s)</Box>
            )}

            <Box
              border="1px solid #ccc"
              padding="10px"
              flex={1}
              borderRadius="6px"
            >

            <Box display="flex" flexDirection="row"
              sx={{ marginTop: '1rem', textAlign: 'center' }}>
              <TextField
                label="Dashboard Title"
                variant="outlined"
                fullWidth
                value={title}
                onChange={handleTitleChange}
              
                error={!!error}
                helperText={error || ''}
                disabled={isRestoring || (isEditing === false && selectedDashboard)}
              />
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ padding: '5px 5px', fontSize: '11px', marginBottom: '6px', marginLeft: '10px'}}
                onClick={createDashboard} 
                disabled={loading || (isRestoring || (isEditing === false && selectedDashboard))}
              >
                {loading ? "Saving..." : "Save to New Dashboard"}
              </Button>
            </Box>
          

            {/* 按钮区域 */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', marginBottom: 2, marginTop: 1 , minWidth: 400}}>
              {selectedDashboard && !isEditing && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleEditDashboard}
                >
                  Edit
                </Button>
              )}
              
              {isEditing && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSaveAndExitEdit}
                  >
                    Save
                  </Button>
              )}              

              {(selectedDashboard && !isEditing) && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDeleteDashboard(selectedDashboard)}  // 传递 selectedDashboard 作为 uid
                >
                  Delete
                </Button>
              )}

              {selectedDashboard && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => {setIsEditing(false); setIsRestoring(false); setSelectedDashboard(null); setTitle('')}}
                >
                  Copy and Exit
                </Button>
              )}
            </Box>
          
      {/* </FormControl> */}


            </Box>
          </Box>
        </Box>
      </div>
    </DndProvider>
  );
}
