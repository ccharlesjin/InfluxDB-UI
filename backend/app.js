const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
require('dotenv').config();
const Grafana_URL = process.env.GRAFANA_API_URL;
const Grafana_token = process.env.GRAFANA_API_TOKEN;
// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

let globalData = {};

app.post('/api/authenticate', async (req, res) => {

  globalData = {
    influxDB_token: req.body.InfluxDB_token,
    influxDB_URL: req.body.InfluxDB_URL,
    Organization_name: req.body.Organization_name,
  };
  
  const validateInfluxDBCredentials = async (influxDB_URL, influxDB_token, organization) => {
      try {
          const response = await axios.get(`${influxDB_URL}/api/v2/orgs`, {
              headers: {
                  'Authorization': `Token ${influxDB_token}`,
              }
          });
          // console.log('Response:', response);
          const orgs = response.data.orgs;
          const validOrg = orgs.find(org => org.name === organization);

          if (!validOrg) {
              throw new Error('Invalid organization');
          }

          return true;
      } catch (error) {
          console.error('Invalid InfluxDB credentials:', error.message);
          return false;
      }
  };
  const { influxDB_token, influxDB_URL, Organization_name } = globalData;
  console.log('Login request:', { influxDB_token, influxDB_URL, Organization_name });
  const isValid = await validateInfluxDBCredentials(influxDB_URL, influxDB_token, Organization_name);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid token or organization' });
  }

  const checkDataSourceExists = async (dataSourceName) => {
    try {
      const response = await axios.get(`${Grafana_URL}/api/datasources`, {
        headers: {
          'Authorization': `Bearer ${Grafana_token}`,
          'Content-Type': 'application/json',
          "Accept": "application/json",
        },
      });
      
      // 查找是否存在同名的数据源
      const existingDataSource = response.data.find(ds => ds.name === dataSourceName);
      if (existingDataSource) {
        console.log('Data Source already exists with ID:', existingDataSource.id);
        return existingDataSource;
      }
      return null;
    } catch (error) {
      console.error('Error checking data sources:', error.response ? error.response.data : error.message);
      throw error;
    }
  };

  const createDataSource = async () => {
    try {
      // Step 1: 创建InfluxDB数据源
      const createResponse = await axios.post(
        `${Grafana_URL}/api/datasources`,
        {
          name: influxDB_URL, // 数据源名称
          type: 'influxdb', // 数据源类型
          url: influxDB_URL, // InfluxDB URL
          access: 'proxy', // 通过Grafana的代理
          basicAuth: false, // 是否使用基本认证
          jsonData: {
            // defaultBucket: INFLUXDB_BUCKET, // InfluxDB的bucket名称
            organization: Organization_name, // InfluxDB的组织名称
            version: 'Flux', // 使用Flux查询
          },
          secureJsonData: {
            token: influxDB_token,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${Grafana_token}`, // Grafana API Token
            'Content-Type': 'application/json',
            "Accept": "application/json",
          }
        }
      );
  
      const dataSourceId = createResponse.data.datasource.id;

      console.log('Data Source Created with ID:', dataSourceId);
  
      // Step 2: 使用创建的数据源ID获取数据源的详细信息（包括UID）
      const dataSourceDetails = await axios.get(`${Grafana_URL}/api/datasources/${dataSourceId}`, {
        headers: {
          'Authorization': `Bearer ${Grafana_token}`,
          'Content-Type': 'application/json',
          "Accept": "application/json",
        },
      });
  
      const uid = dataSourceDetails.data.uid;
      globalData = {
        influxDB_token: influxDB_token,
        influxDB_URL: influxDB_URL,
        Organization_name: Organization_name,
        Grafana_datasourceID: uid,
        Grafana_dataID: dataSourceId,
        Grafana_URL: Grafana_URL,
      };
      console.log('Data Source UID:', uid);
  
      return uid;
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };
  

  try {
    // 检查数据源是否存在
    let dataSource = await checkDataSourceExists(influxDB_URL);

    if (!dataSource) {
      // 如果数据源不存在，则创建
      dataSource = await createDataSource();
    } else {
      // 如果已存在，直接使用现有的数据源ID和UID
      globalData.Grafana_datasourceID = dataSource.uid;
      globalData.Grafana_dataID = dataSource.id;
      console.log('Using existing Data Source UID:', dataSource.uid);
    }

    // 认证成功返回数据
    const response = await axios.get(`${Grafana_URL}/api/datasources`, {
      headers: {
        'Authorization': `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
        "Accept": "application/json",
      }
    });

    if (response.status === 200) {
      console.log('Login successful');
      res.status(200).json({ message: 'Authentication successful', datasources: response.data });
    } else {
      res.status(401).json({ error: 'Invalid Credentials' });
    }
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with Grafana' });
  }
});

app.get('/api/buckets', async (req, res) => {
  const {Grafana_datasourceID, Grafana_dataID} = globalData;

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
            datasourceId: Grafana_dataID,
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
    // console.log('datasourceId:', Grafana_dataID);
    // console.log('uid:', Grafana_datasourceID);
    // console.log('Grafana_token:', Grafana_token);
    const bucketNames = grafanaResponse.data.results.A.frames[0].data.values[0];
    console.log('Bucket Names:', bucketNames);
    
    res.status(200).json({ buckets: bucketNames });
  } catch (error) {
    console.log('datasourceId:', Grafana_dataID);
    console.log('uid:', Grafana_datasourceID);
    console.log('Grafana_token:', Grafana_token);
    console.error('Error fetching buckets:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch data from Grafana' });
  }
});

app.get('/api/measurements', async (req, res) => {
  const { bucket } = req.query; // 从前端获取所选择的 bucket
  const { Grafana_datasourceID, Grafana_dataID } = globalData;
  console.log('fetching measurements for bucket:', bucket);
  
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
            query: `from(bucket: "${bucket}")
                    |> range(start: 0)
                    |> distinct(column: "_measurement")
                    |> sort()`,
            datasourceId: Grafana_dataID,
            hide: false,
            intervalMs: 300000,
            maxDataPoints: 1500
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

    // 提取所有 frames 中的 measurement 名称
    const frames = grafanaResponse.data.results.A.frames;
    const measurementNames = frames.flatMap(frame => {
      return frame.data.values[0]; // 从每个 frame 中提取 measurement 的名称
    });

    // 去重以确保没有重复的 measurement 名称
    const uniqueMeasurements = [...new Set(measurementNames)];
    console.log('Unique Measurement Names:', uniqueMeasurements);

    res.status(200).json({ measurements: uniqueMeasurements });
  } catch (error) {
    console.error('Error fetching measurements:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch measurements from Grafana' });
  }
});

app.get('/api/fields', async (req, res) => {
  const { bucket, measurement } = req.query;
  const { Grafana_datasourceID, Grafana_dataID } = globalData;
  console.log(`Fetching fields for measurement: ${measurement} in bucket: ${bucket}`);
  
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
            query: `from(bucket: "${bucket}")
                    |> range(start: 0)
                    |> filter(fn: (r) => r["_measurement"] == "${measurement}")
                    |> keep(columns: ["_field"])
                    |> distinct(column: "_field")
                    |> sort()`,
            datasourceId: Grafana_dataID,
            hide: false,
            intervalMs: 300000,
            maxDataPoints: 1500
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

    // 提取 field 名称
    const frames = grafanaResponse.data.results.A.frames;
    const fieldNames = frames.flatMap(frame => {
      return frame.data.values[0][0]; // 从每个 frame 中提取 field 的名称
    });

    // 去重以确保没有重复的 field 名称
    const uniqueFields = [...new Set(fieldNames)];
    console.log('Unique Field Names:', uniqueFields);

    res.status(200).json({ fields: uniqueFields });
  } catch (error) {
    console.error('Error fetching fields:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch fields from Grafana' });
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
    const { Grafana_datasourceID } = globalData;
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
