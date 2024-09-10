import React, { useState } from 'react';
import axios from 'axios';
import TimeRangeSelector from './TimeRangeSelector';

function App() {
  const [bucket, setBucket] = useState("test");
  // const [start, setStart] = useState("2023-12-31T13:30:00Z");
  // const [stop, setStop] = useState("2024-01-01T13:29:59Z");
  const [windowPeriod, setWindowPeriod] = useState("10m");
  const [iframeUrl, setIframeUrl] = useState("");
  const [timeRange, setTimeRange] = useState({ start: null, end: null });

  const handleTimeRangeChange = (range) => {
    console.log('Selected Time Range:', range);
    // 在这里你可以将选择的时间范围传递给后端
    setTimeRange(range);
  };

  const createDashboard = async () => {
    try {
      // 使用 Dayjs 对象的 unix() 方法，直接获取 Unix 时间戳
      const start = timeRange.start.unix() * 1000; // 转换为毫秒
      const stop = timeRange.end.unix() * 1000;    // 转换为毫秒
  
      const response = await axios.post('http://localhost:5001/create-dashboard', {
        bucket,
        windowPeriod,
        from: start,
        to: stop
      });
  
      setIframeUrl(response.data.dashboardUrl);
    } catch (error) {
      console.error('Error creating dashboard:', error);
    }
  };

  return (
    <div className="App">
      <h1>Create Grafana Dashboard</h1>
      <div>
        <label>Bucket Name:</label>
        <input type="text" value={bucket} onChange={(e) => setBucket(e.target.value)} />
      </div>
      <h2>Select Time Range</h2>
      <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} />
      {timeRange.start && timeRange.end && (
        <div>
          <h2>Selected Time Range:</h2>
          <p>Start: {timeRange.start.format('YYYY-MM-DD HH:mm:ss')}</p>
          <p>End: {timeRange.end.format('YYYY-MM-DD HH:mm:ss')}</p>
        </div>
      )}
      <div>
        <label>Window Period:</label>
        <input type="text" value={windowPeriod} onChange={(e) => setWindowPeriod(e.target.value)} />
      </div>
      <button onClick={createDashboard}>Create Dashboard</button>

      {iframeUrl && (
        <div>
			<h2>Dashboard Panel:</h2>
			<iframe
			src={iframeUrl}  // 注意这里的 panelId，代表你想要嵌入的面板
			width="100%"
			height="600px"
			frameBorder="0"
			title="Grafana Panel"
			></iframe>
	    </div>
      )}
    </div>
  );
}

export default App;
