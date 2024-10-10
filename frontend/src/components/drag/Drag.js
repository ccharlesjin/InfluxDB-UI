import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Select, MenuItem } from '@mui/material';
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
          padding: '10px',
          margin: '5px',
          backgroundColor: location === 'list' ? '#6889c4' : '#ffcc80',
          border: '1px solid #00796b',
          borderRadius: '4px',
          cursor: 'grab',
        }}
      >
        {measurement}
      </Box>
    );
  }
  
function MeasurementList({ measurements, onDropMeasurement }) {
const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.MEASUREMENT,
    drop: (item) => {
    if (item.location === 'dropArea') {
        // 从 DropArea 拖回 MeasurementList
        onDropMeasurement(item.measurement, 'remove');
    }
    },
    collect: (monitor) => ({
    isOver: monitor.isOver(),
    }),
}), [onDropMeasurement]);

return (
    <div
    ref={drop}
    style={{
        backgroundColor: isOver ? '#a0e0ff' : 'lightgreen',
        padding: '10px',
        minHeight: '200px',
    }}
    >
    {measurements.map((measurement) => (
        <MeasurementItem key={measurement} measurement={measurement} location="list" />
    ))}
    </div>
);
}
  

function DropArea({ droppedMeasurements, onDropMeasurement }) {
const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.MEASUREMENT,
    drop: (item) => {
    if (item.location === 'list') {
        // 从 MeasurementList 拖入
        onDropMeasurement(item.measurement, 'add');
    }
    },
    collect: (monitor) => ({
    isOver: monitor.isOver(),
    }),
}), [onDropMeasurement]);

return (
    <div
    ref={drop}
    style={{
        backgroundColor: isOver ? '#a0e0ff' : 'lightblue',
        border: '2px dashed #ccc',
        padding: '20px',
        minHeight: '200px',
    }}
    >
    <p>Drag measurements here to filter data</p>
    {droppedMeasurements.map((measurement) => (
        <MeasurementItem key={measurement} measurement={measurement} location="dropArea" />
    ))}
    </div>
);
}
  

function FieldItem({ field, measurement, location }) {
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
            backgroundColor: location === 'available' ? '#f0ad4e' : '#5cb85c',
            border: '1px solid #eea236',
            borderRadius: '4px',
            cursor: 'grab',
            }}
        >
            {field}
        </Box>
    );
}

function FieldList({ fields, measurement, onFieldRemove }) {
    const [{ isOver }, drop] = useDrop(
      () => ({
        accept: ItemTypes.FIELD,
        drop: (item) => {
          if (item.measurement === measurement && item.location === 'selected') {
            // 从选中列表拖回可用列表
            onFieldRemove(measurement, item.field);
          }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
        }),
      }),
      [onFieldRemove, measurement]
    );
  
    return (
      <div
        ref={drop}
        style={{
          backgroundColor: isOver ? '#fff5a0' : 'lightyellow',
          padding: '10px',
          minHeight: '100px',
        }}
      >
        <p>Available Fields</p>
        {fields.map((field) => (
          <FieldItem
            key={field}
            field={field}
            measurement={measurement}
            location="available"
          />
        ))}
      </div>
    );
}

function SelectedFieldList({ fields, measurement, onFieldSelect }) {
    const [{ isOver }, drop] = useDrop(
      () => ({
        accept: ItemTypes.FIELD,
        drop: (item) => {
          if (item.measurement === measurement && item.location === 'available') {
            // 从可用列表拖到选中列表
            onFieldSelect(measurement, item.field);
          }
        },
        collect: (monitor) => ({
          isOver: monitor.isOver(),
        }),
      }),
      [onFieldSelect, measurement]
    );
  
    return (
      <div
        ref={drop}
        style={{
          backgroundColor: isOver ? '#baffc9' : 'lightgreen',
          padding: '10px',
          minHeight: '100px',
        }}
      >
        <p>Selected Fields</p>
        {fields.map((field) => (
          <FieldItem
            key={field}
            field={field}
            measurement={measurement}
            location="selected"
          />
        ))}
      </div>
    );
}

export default function DragAndDropComponent() {
  const [loading, setLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [bucket, setBucket] = useState('');
  const [bucketList, setBucketList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [droppedMeasurements, setDroppedMeasurements] = useState([]);
  const [measurementFields, setMeasurementFields] = useState({});
  const [selectedFields, setSelectedFields] = useState({});
  const [queryCode, setQueryCode] = useState('');
  // const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [timeRange, setTimeRange] = useState({
    start: dayjs().subtract(1, 'day'), // 设置为一天前的时间
    end: dayjs() // 设置为当前时间
  });
  const [windowPeriod, setWindowPeriod] = useState("10m");

  // 获取 buckets
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/buckets');
        setBucketList(response.data.buckets);
      } catch (error) {
        console.log('Error fetching bucket list:', error);
        setErrorMessage('Failed to fetch bucket list');
      }
    };
    fetchBuckets();
  }, []);

  // 获取 measurements
  useEffect(() => {
    if (bucket) {
      const fetchMeasurements = async () => {
        try {
          const response = await axios.get('http://localhost:5001/api/measurements', {
            params: { bucket },
          });
          setMeasurements(response.data.measurements);
        } catch (error) {
          console.log('Error fetching measurements:', error);
          setErrorMessage('Failed to fetch measurements');
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

    try {
      // show loading page
      setLoading(true); 
      const start = timeRange.start.unix() * 1000;
      const stop = timeRange.end.unix() * 1000;

      const response = await axios.post('http://localhost:5001/api/execute-query', {
        bucket,
        windowPeriod,
        from: start,
        to: stop,
        fluxQuery: queryCode
      });

      setIframeUrl(response.data.dashboardUrl);
    } catch (error) {
      console.error('Error creating dashboard:', error);
    } finally {
      setLoading(false); // Hide loading after operation
    }
  };

  // 生成查询代码
  const generateFluxQuery = useCallback(() => {
    let query = `from(bucket: "${bucket}")\n`;
    query += `  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)\n`;
    droppedMeasurements.forEach((measurement) => {
      query += `  |> filter(fn: (r) => r["_measurement"] == "${measurement}")\n`;

      const fields = selectedFields[measurement];
      if (fields && fields.length > 0) {
        const fieldFilters = fields
          .map((field) => `r["_field"] == "${field}"`)
          .join(' or ');
        query += `  |> filter(fn: (r) => ${fieldFilters})\n`;
      }
    });

    query += '  |> aggregateWindow(every: 10m, fn: mean)\n  |> yield(name: "mean")';

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
      .post('http://localhost:5001/api/execute-query', { 
        fluxQuery: query,
        bucket,
        windowPeriod,
        from: start,
        to: stop })
      .then((response) => {
        // if (response.data.status === 'success') {
        //   setIframeUrl(response.data.dashboardUrl);
        // }
        setIframeUrl(response.data.dashboardUrl);  // newUrl 是你更新后的 Grafana 面板 URL
        setLoading(false); 
        console.log('Query sent successfully:', response.data);
      })
      .catch((error) => {
        console.error('Error sending query:', error);
      });

  }, [bucket, droppedMeasurements, selectedFields, timeRange]);

  useEffect(() => {
    if (droppedMeasurements.length > 0) {
      generateFluxQuery();
    } else {
      setQueryCode('');
    }
  }, [generateFluxQuery]);

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
      const response = await axios.get('http://localhost:5001/api/fields', {
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
      setErrorMessage(`Failed to fetch fields for ${measurement}`);
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        
        {/* Visualization area */}
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
              // key={iframeUrl + new Date().getTime()}
              src={iframeUrl}
              width="100%"
              height="100%"
              // frameBorder="0"
              title="Grafana Panel"
            />
          ) : (
            <Typography variant="h6">No data to display</Typography>
          )}
        </Box>
        
        <Box
          flex={1}
          height="200px"
          borderRadius="6px"
          boxShadow="0px 2px 10px rgba(0,0,0,0.2)"
          bgcolor="primary"
          p={2}
        >
          <Typography variant="body1">Drag and Drop Area</Typography>
          <label>Bucket Name:</label>
          <Select value={bucket} onChange={(e) => setBucket(e.target.value)} fullWidth>
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

        <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Measurement List */}
            <div style={{ flex: 1, marginRight: '10px' }}>
                <p>Measurement List</p>
                {measurements.length > 0 ? (
                <MeasurementList measurements={measurements} onDropMeasurement={handleDropMeasurement} />
                ) : (
                <p>Select a bucket to load measurements</p>
                )}
            </div>

            {/* Drop Area */}
            <div style={{ flex: 1, marginLeft: '10px' }}>
                <p>Drop Area</p>
                <DropArea
                droppedMeasurements={droppedMeasurements}
                onDropMeasurement={handleDropMeasurement}
                />
            </div>
        </div>

        {/* 为每个 measurement 渲染 fields 拖拽区域 */}
        {droppedMeasurements.map((measurement) => (
          <div key={`fields-${measurement}`}>
            <h4>{`Fields for ${measurement}`}</h4>
            <div style={{ display: 'flex' }}>
              {/* 可用的 Fields */}
              <div style={{ flex: 1, marginRight: '10px' }}>
                <FieldList
                    fields={measurementFields[measurement] || []}
                    measurement={measurement}
                    onFieldRemove={handleFieldRemove}
                />
              </div>
              {/* 已选中的 Fields */}
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <SelectedFieldList
                    fields={selectedFields[measurement] || []}
                    measurement={measurement}
                    onFieldSelect={handleFieldSelect}
                />
              </div>
            </div>
          </div>
        ))}

        {/* 查询代码显示区域 */}
        <div>
          <h3>Generated Query Code:</h3>
          <pre>{queryCode}</pre>
        </div>

        {/* Time range selection area */}
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
          <TimeRangeSelector onTimeRangeChange={setTimeRange} />
          {timeRange.start && timeRange.end && (
            <div>
              <h2>Selected Time Range:</h2>
              <p>Start: {timeRange.start.format('YYYY-MM-DD HH:mm:ss')}</p>
              <p>End: {timeRange.end.format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          )}
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

      </div>
    </DndProvider>
  );
}
