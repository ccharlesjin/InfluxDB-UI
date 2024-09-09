const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

require('dotenv').config();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

const GRAFANA_API_URL = process.env.GRAFANA_API_URL; // http://your-grafana-instance.com
const GRAFANA_API_TOKEN = process.env.GRAFANA_API_TOKEN;

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   console.log('Login request:', { email, password });
//   try {
  
//     const response = await axios.get('http://localhost:3001/users', {
//       params: {
//         email: email,
//         password: password
//       }
//     });

//     const user = response.data[0];
//     console.log('User:', user);
//     if (user) {
//       console.log('Login successful');
//       res.status(200).json({ message: 'Login successful', userId: user.id });
//     } else {
//       console.log('Invalid email or password');
//       res.status(401).json({ message: 'Invalid email or password' });
//     }
//   } catch (error) {
//     console.log('An error occurred', error.message);
//     res.status(500).json({ message: 'An error occurred', error: error.message });
//   }
// });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request:', { username, password });

  const storedUsername = process.env.INFLUXDB_USERNAME;
  const storedPassword = process.env.INFLUXDB_PASSWORD;

  try {
    if (username === storedUsername && password === storedPassword) {
      console.log('Login successful');
      res.status(200).json({ message: 'Login successful' });
    } else {
      console.log('Invalid username or password');
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.log('An error occurred', error.message);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});


// 获取 InfluxDB 的 bucket 名称
app.get('/api/buckets', async (req, res) => {
  try {
    const grafanaResponse = await axios.post(
      `${GRAFANA_API_URL}/api/ds/query`,
      {
        queries: [
          {
            refId: 'A',
            datasource: {
              type: 'influxdb',
              uid: process.env.GRAFANA_DATASOURCE_UID
            },
            query: 'buckets()',
            datasourceId: 1,
            hide: false,
            intervalMs: 5000,
            maxDataPoints: 886,
            query: 'buckets()'
          }
        ],
        from: "now-1h",
        to: "now"
      },
      {
        headers: {
          'Authorization': `Bearer ${GRAFANA_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const bucketNames = grafanaResponse.data.results.A.frames[0].data.values[0];
    console.log('Bucket Names:', bucketNames);
    
    res.status(200).json({ buckets: bucketNames });
  } catch (error) {
    console.error('Error fetching buckets:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch data from Grafana' });
  }
});

app.post('/query', (req, res) => {
  const { bucket, fields, timeRange } = req.body;

  // Example Flux query for temperature and humidity
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${timeRange.start}, stop: ${timeRange.end})
      |> filter(fn: (r) => r._measurement == "weather")
      |> filter(fn: (r) => r._field == "temperature" or r._field == "humidity")
  `;

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row);
      console.log(data); // You can also send this back to the client
    },
    error(error) {
      console.error('Error querying InfluxDB:', error);
      res.status(500).send('Error querying InfluxDB');
    },
    complete() {
      res.status(200).send('Query completed');
    },
  });
});

app.post('/create-dashboard', async (req, res) => {
  try {
    const { bucket, start, stop, windowPeriod, from, to } = req.body;

    const dashboardData = {
      dashboard: {
        id: null,
        title: "Generated Dashboard",
        timezone: "browser",
        panels: [
          {
            type: "graph",
            title: "Sleep Data Panel",
            datasource: { type: 'influxdb', uid: process.env.GRAFANA_DATASOURCE_UID },
            targets: [
              {
                refId: 'A',
                query: `
                from(bucket: "${bucket}")
                  |> range(start: ${start}, stop: ${stop})
                  |> filter(fn: (r) => r["_measurement"] == "sleep_data")
                  |> aggregateWindow(every: ${windowPeriod}, fn: mean, createEmpty: false)
                  |> yield(name: "mean")
                `,
                from: from, // 发送的 Unix 时间戳
                to: to     // 发送的 Unix 时间戳
              },
            ],
            gridPos: {
              x: 0,
              y: 0,
              w: 24,
              h: 10
            },
          }
        ],
      },
      overwrite: true,
    };

    const response = await axios.post(`${GRAFANA_API_URL}/api/dashboards/db`, dashboardData, {
      headers: {
        Authorization: `Bearer ${GRAFANA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    // const dashboardUrl = `${GRAFANA_API_URL}/d/${response.data.uid}`;
    // res.status(200).json({ dashboardUrl });

    // 使用 d-solo 和 panelId 生成单个面板的 URL
    const panelId = 1; // 替换为你实际的 panelId
    const soloPanelUrl = `${GRAFANA_API_URL}/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light`;

    res.status(200).json({ dashboardUrl: soloPanelUrl });

  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ message: 'Failed to create dashboard' });
  }
});


// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
