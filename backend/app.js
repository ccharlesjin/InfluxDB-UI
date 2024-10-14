const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const app = express();
require('dotenv').config();
const Grafana_URL = process.env.GRAFANA_API_URL;
// const Grafana_token = process.env.GRAFANA_API_TOKEN;
const Grafana_token = process.env.LONGTERM_JWT_TOKEN;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// const JWT_SECRET = process.env.JWT_SECRET;

// 加载私钥
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE);

const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, process.env.SSL_KEY_FILE)),
  cert: fs.readFileSync(path.resolve(__dirname, process.env.SSL_CRT_FILE)),
  // rejectUnauthorized: false,
  // minVersion: 'TLSv1.2', // 设置最小的TLS版本 // 禁用严格的SSL验证，仅用于测试目的
};

// console.log('key: ', path.resolve(__dirname, process.env.SSL_KEY_FILE));
// 加载自签名的CA证书
const ca = fs.readFileSync(process.env.SSL_ROOT_CRT_FILE);

// 创建一个带有自定义CA的HTTPS Agent
const agent = new https.Agent({
  ca: ca  // 手动添加自签名证书到可信任列表
});



// Middleware
// app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

const corsOptions = {
  // origin: ['http://localhost:3000', 'https://localhost:3000'],
  origin: 'https://localhost:3000',
  credentials: true,  // 允许携带凭证（cookie）
};

app.options('*', cors(corsOptions));  // 为预检请求启用 CORS
app.use(cors(corsOptions));
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
          console.log('Valid organization:', validOrg);
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
      // console.log(`Authorization: Bearer ${Grafana_token}`);
      
      const response = await axios.get(`${Grafana_URL}/api/datasources`, {
        httpsAgent: agent, // SSL代理
        headers: {
          'Authorization': `Bearer ${Grafana_token}`,
          'Content-Type': 'application/json',
          "Accept": "application/json",
        },
      });
      
      // console.log('Response of fetching datasources:', response);
      // 查找是否存在同名的数据源
      const existingDataSource = response.data.find(ds => ds.name === dataSourceName);
      // console.log('Existing Data Source found:', existingDataSource);
      if (existingDataSource) {
        // console.log('Data Source already exists with ID:', existingDataSource.id);
        return existingDataSource;
      }
      return null;
    } catch (error) {
      console.error('Error checking data sources:', error.response ? error.response.data : error.message);
      // console.log('Error:', error.response ? error.response.data : error.message);
      throw error;
    }
  };

  const createDataSource = async () => {
    try {
      // Step 1: 创建InfluxDB数据源
      const createResponse = await axios.post(
        `${Grafana_URL}/api/datasources`,
        {
          name: influxDB_URL+influxDB_token, // 数据源名称
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
          httpsAgent: agent, // SSL代理,
          headers: {
            'Authorization': `Bearer ${Grafana_token}`, // Grafana API Token
            'Content-Type': 'application/json',
            "Accept": "application/json",
          }
        }
      );
  
      const dataSourceId = createResponse.data.datasource.id;

      // console.log('Data Source Created with ID:', dataSourceId);
  
      // Step 2: 使用创建的数据源ID获取数据源的详细信息（包括UID）
      const dataSourceDetails = await axios.get(`${Grafana_URL}/api/datasources/${dataSourceId}`, {
        httpsAgent: agent, // SSL代理,
        headers: {
          'Authorization': `Bearer ${Grafana_token}`,
          'Content-Type': 'application/json',
          "Accept": "application/json",
        },
      });
      // console.log('Data Source Details:', dataSourceDetails);
      const uid = dataSourceDetails.data.uid;
      // console.log('Data Source UID from Data Source Details:', uid);
      globalData = {
        influxDB_token: influxDB_token,
        influxDB_URL: influxDB_URL,
        Organization_name: Organization_name,
        Grafana_datasourceID: uid,
        Grafana_dataID: dataSourceId,
        Grafana_URL: Grafana_URL,
      };
      // console.log('Data Source UID:', uid);
      // console.log('Data Source ID:', dataSourceId);

  
      return dataSourceDetails.data;
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };
  

  try {
    // 检查数据源是否存在
    let dataSource = await checkDataSourceExists(influxDB_URL+influxDB_token);

    if (!dataSource) {
      // 如果数据源不存在，则创建
      dataSource = await createDataSource();
      console.log('Data Source UID from createDataSource:', dataSource);
    } else {
      // 如果已存在，直接使用现有的数据源ID和UID
      globalData.Grafana_datasourceID = dataSource.uid;
      globalData.Grafana_dataID = dataSource.id;
      console.log('Using existing Data Source UID:', dataSource.uid);
    }

    // 认证成功返回数据
    const response = await axios.get(`${Grafana_URL}/api/datasources`, {
      httpsAgent: agent, // SSL代理,
      headers: {
        'Authorization': `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
        "Accept": "application/json",
      }
    });

    if (response.status === 200) {
      console.log('Login successful');
      // 如果用户验证成功，生成JWT
      const payload = {
        influxDB_token,  // 将用户的token作为有效载荷的一部分
        Organization_name,
        influxDB_URL,
        Grafana_datasourceID: dataSource.uid,
        Grafana_dataID: dataSource.id,
        user: 'authenticated_user',  // 你可以在这里加入其他需要的信息
        iat: Math.floor(Date.now() / 1000),  // JWT的签发时间
        exp: Math.floor(Date.now() / 1000) + (60 * 60)  // JWT的过期时间，设置为1小时后
      };
      console.log('Payload:', payload);
      // 生成JWT，设定过期时间，比如1小时
      const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
      
      // 设置cookie将生成的token发送给客户端
      res.cookie('session_token', token, {
        httpOnly: true,  // 避免客户端JavaScript访问
        secure: true,    // 仅在HTTPS传输
        // domain: 'localhost',
        // path: '/',
        sameSite: 'none',  // 防止CSRF攻击
        maxAge: 24 * 60 * 60 * 1000,
      });
      // console.log('Data Source UID:', dataSource.uid);
      // console.log('Data Source ID:', dataSource.id);
      console.log('Token generated:', token);
      res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.status(200).json({ message: 'Authentication successful', datasources: response.data });
    } else {
      res.status(401).json({ error: 'Invalid Credentials' });
    }
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with Grafana' });
  }
});

// 定义中间件函数，验证JWT token
const verifyToken = (req, res, next) => {
  // 从cookie中获取token
  const token = req.cookies.session_token;
  console.log('Verifying token:', token);
  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }

  // 验证token
  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) {
      console.log('Invalid token');
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    // 将解码后的信息存入请求对象，方便后续使用
    console.log('Token decoded:', decoded);
    req.user = {
      influxDB_token: decoded.influxDB_token,
      influxDB_URL: decoded.influxDB_URL,
      Organization_name: decoded.Organization_name,
      Grafana_datasourceID: decoded.Grafana_datasourceID,
      Grafana_dataID: decoded.Grafana_dataID,
      user: decoded.user,
    };
    next();
  });
};

app.get('/api/buckets', verifyToken, async (req, res) => {
  // const {Grafana_datasourceID, Grafana_dataID} = globalData;
  const Grafana_datasourceID = req.user.Grafana_datasourceID;
  const Grafana_dataID = req.user.Grafana_dataID;
  console.log('fetching buckets')
  // console.log("Grafana_datasourceID: ", Grafana_datasourceID);
  // console.log("Grafana_dataID: ", Grafana_dataID);
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
        httpsAgent: agent, // SSL代理,
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

app.get('/api/measurements', verifyToken, async (req, res) => {
  const { bucket } = req.query; // 从前端获取所选择的 bucket
  const Grafana_datasourceID = req.user.Grafana_datasourceID;
  const Grafana_dataID = req.user.Grafana_dataID;
  // Grafana_datasourceID = 
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
        httpsAgent: agent, // SSL代理,
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

app.get('/api/fields', verifyToken, async (req, res) => {
  const { bucket, measurement } = req.query;
  const Grafana_datasourceID = req.user.Grafana_datasourceID;
  const Grafana_dataID = req.user.Grafana_dataID;
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
        httpsAgent: agent, // SSL代理,
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

// app.post('/query', (req, res) => {
//   const { bucket, fields, timeRange } = req.body;

//   // Example Flux query for temperature and humidity
//   const fluxQuery = `
//     from(bucket: "${bucket}")
//       |> range(start: ${timeRange.start}, stop: ${timeRange.end})
//       |> filter(fn: (r) => r._measurement == "weather")
//       |> filter(fn: (r) => r._field == "temperature" or r._field == "humidity")
//   `;

//   queryApi.queryRows(fluxQuery, {
//     next(row, tableMeta) {
//       const data = tableMeta.toObject(row);
//       console.log(data); // You can also send this back to the client
//     },
//     error(error) {
//       console.error('Error querying InfluxDB:', error);
//       res.status(500).send('Error querying InfluxDB');
//     },
//     complete() {
//       res.status(200).send('Query completed');
//     },
//   });
// });

app.post('/create-dashboard', verifyToken, async (req, res) => {
  try {
    const Grafana_datasourceID = req.user.Grafana_datasourceID;
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
      httpsAgent: agent, // SSL代理,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });


    // 使用 d-solo 和 panelId 生成单个面板的 URL
    const panelId = 1; // 替换为你实际的 panelId
    const soloPanelUrl = `${Grafana_URL}/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light&from=${from}&to=${to}&t=${Date.now()}`;

    res.status(200).json({ dashboardUrl: soloPanelUrl });

  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ message: 'Failed to create dashboard' });
  }
});

app.post('/api/execute-query', verifyToken, async (req, res) => {
  try {
    const Grafana_datasourceID = req.user.Grafana_datasourceID;
    const { bucket, windowPeriod, from, to, fluxQuery } = req.body;
    const fromSeconds = Math.floor(from / 1000);
    const toSeconds = Math.floor(to / 1000);

    // Your existing logic for creating the dashboard
    console.log('Creating dashboard with the following params:', { bucket, windowPeriod, from, to, fromSeconds, toSeconds, fluxQuery });
    
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
                query: fluxQuery,
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
      httpsAgent: agent, // SSL代理,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });

    const panelId = 1; 
    const timestamp = new Date().getTime();
    // const soloPanelUrl = `${Grafana_URL}/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light&from=${from}&to=${to}&nocache=${timestamp}`;
    const soloPanelUrl = `https://localhost:3001/grafana/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light&from=${from}&to=${to}&nocache=${timestamp}`;
    console.log('Dashboard URL:', soloPanelUrl);

    // Adding cache-control headers to the response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.status(200).json({ dashboardUrl: soloPanelUrl });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ message: 'Failed to create dashboard' });
  }
});

// 验证JWT并返回用户名
// app.get('/api/auth/verify', (req, res) => {
//   const token = req.cookies.session_token;  // 从cookie中获取JWT
//   console.log('Verifying token:', token);
//   if (!token) {
//     return res.status(401).send('Unauthorized');  // 如果没有token，则拒绝访问
//   }

//   // 验证JWT
//   jwt.verify(token, privateKey, (err, decoded) => {
//     if (err) {
//       console.log('From nginx Token not verified: ', err.message);
//       return res.status(401).send('Unauthorized');  // 如果验证失败，则拒绝访问
//     }

//     console.log('From nginx Token verified:', decoded.user);
//     console.log('From nginx Token Successful verified', decoded);
//     // 返回用户名，供Nginx使用
//     res.setHeader('X-WEBAUTH-USER', decoded.user);  // 设置用户名为JWT中的user
//     res.status(200).send();  // 成功
//   });
// });

// Start the server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// 启动 HTTPS 服务器
https.createServer(sslOptions, app).listen(5001, () => {
  console.log('HTTPS Server running on port 5001');
});