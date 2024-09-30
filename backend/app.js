const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

require('dotenv').config();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// const GRAFANA_API_URL = process.env.GRAFANA_API_URL; // http://your-grafana-instance.com
// const GRAFANA_API_TOKEN = process.env.GRAFANA_API_TOKEN;

let globalData = {};

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

app.post('/api/authenticate', async (req, res) => {

  globalData = {
    influxDB_token: req.body.influxDB_token,
    influxDB_username: req.body.influxDB_username,
    influxDB_password: req.body.influxDB_password,
    Grafana_URL: req.body.Grafana_URL,
    Grafana_token: req.body.Grafana_token,
    Grafana_datasourceID: req.body.Grafana_datasourceID
  };

  const { Grafana_URL, Grafana_token } = globalData;
  // console.log('Grafana token:', Grafana_token);
  try {
    const response = await axios.get(`${Grafana_URL}/api/datasources`, {
      headers: {
        'Authorization': `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 200){
      console.log('login successful')
      res.status(200).json({ message: 'Authentication successful', datasources: response.data});
    } else {
      res.status(401).json({ error: 'Invalid Credentials'});
    }
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with Grafana' });
  }
})

app.get('/api/buckets', async (req, res) => {
  const {Grafana_URL, Grafana_datasourceID, Grafana_token} = globalData;
  console.log('fetching buckets')
  // console.log(Grafana_URL);
  try {
    const grafanaResponse = await axios.post(
      `${Grafana_URL}/api/ds/query`,
      {
        queries: [
          {
            refId: 'A',
            datasource: {
              type: 'influxdb',
              uid: Grafana_datasourceID
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
          'Authorization': `Bearer ${Grafana_token}`,
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
    const { Grafana_datasourceID, Grafana_URL, Grafana_token } = globalData;
    const { bucket, windowPeriod, from, to } = req.body;
    const fromSeconds = Math.floor(from / 1000);  // 转换为秒
    const toSeconds = Math.floor(to / 1000);      // 转换为秒

    console.log('Creating dashboard with the following params:', { bucket, windowPeriod, from, to, fromSeconds, toSeconds });
    const dashboardData = {
      dashboard: {
        id: null,
        title: "Generated Dashboard",
        timezone: "browser",
        panels: [
          {
            type: "graph",
            title: "Sleep Data Panel",
            datasource: { type: 'influxdb', uid: Grafana_datasourceID },
            targets: [
              {
                refId: 'A',
                query: `
                from(bucket: "${bucket}")
                  |> range(start: ${fromSeconds}, stop: ${toSeconds})
                  |> filter(fn: (r) => r["_measurement"] == "sleep_data")
                  |> aggregateWindow(every: ${windowPeriod}, fn: mean, createEmpty: false)
                  |> yield(name: "mean")
                `,
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

    const response = await axios.post(`${Grafana_URL}/api/dashboards/db`, dashboardData, {
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });


    // 使用 d-solo 和 panelId 生成单个面板的 URL
    const panelId = 1; // 替换为你实际的 panelId
    const soloPanelUrl = `${Grafana_URL}/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light&from=${from}&to=${to}`;

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
