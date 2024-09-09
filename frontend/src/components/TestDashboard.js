import React, { useState } from 'react';
import axios from 'axios';

// 时间转换函数
const convertToUnixTimestamp = (isoString) => {
  return new Date(isoString).getTime(); // 将 ISO 时间字符串转换为 Unix 时间戳（以毫秒为单位）
};

function App() {
  const [bucket, setBucket] = useState("test");
  const [start, setStart] = useState("2023-12-31T13:30:00Z");
  const [stop, setStop] = useState("2024-01-01T13:29:59Z");
  const [windowPeriod, setWindowPeriod] = useState("10m");
  const [iframeUrl, setIframeUrl] = useState("");

  const createDashboard = async () => {
    try {
      // 将 start 和 stop 时间转换为 Unix 时间戳
      const fromTimestamp = convertToUnixTimestamp(start);
      const toTimestamp = convertToUnixTimestamp(stop);

      const response = await axios.post('http://localhost:5001/create-dashboard', {
        bucket,
        start,
        stop,
        windowPeriod,
        from: fromTimestamp,
        to: toTimestamp
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
      <div>
        <label>Start Time (ISO format):</label>
        <input type="text" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div>
        <label>Stop Time (ISO format):</label>
        <input type="text" value={stop} onChange={(e) => setStop(e.target.value)} />
      </div>
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
