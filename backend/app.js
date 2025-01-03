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
      console.log('Creating folder...');
      console.log('InfluxDB_token first 10 letters: ' + influxDB_token.substring(0,10));
      const folderData = {
        uid: influxDB_token.substring(0,10),
        title: influxDB_token.slice(0,10),
      };
      // 发送POST请求创建文件夹
      axios.post(`${Grafana_URL}/api/folders`, folderData, {
        httpsAgent: agent, // SSL代理,
        headers: {
          'Authorization': `Bearer ${Grafana_token}`, // Grafana API Token
          'Content-Type': 'application/json',
          "Accept": "application/json",
        }
      })
      .then(response => {
        console.log('Folder created successfully:', response.data);
      })
      .catch(error => {
        console.log('Error creating folder:', error.response ? error.response.data : error.message);
      });
      
      dataSource = await createDataSource();

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

app.post('/api/save-dashboard', verifyToken, async (req, res) => {
  try {
    const Grafana_datasourceID = req.user.Grafana_datasourceID;
    const { from, to, fluxQuery, title, type } = req.body;
    const { influxDB_token } = req.user;

    const dashboardData = {
      dashboard: {
        id: null,
        title: title,
        tags: [`from:${from}`, `to:${to}`],
        timezone: "browser",
        panels: [
          {
            type: type,
            title: title,
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
      folderUid: influxDB_token.slice(0, 10),
      overwrite: false,
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
    const soloPanelUrl = `https://localhost:3001/grafana/d-solo/${response.data.uid}?orgId=1&panelId=${panelId}&theme=light&from=${from}&to=${to}&t=${Date.now()}`;
    console.log('Dashboard saved, Dashboard URL:', soloPanelUrl);
    res.status(200).json({ dashboardUrl: soloPanelUrl });

  } catch (error) {
    if (error.response && error.response.status === 412) {
      const errorMessage = error.response.data?.message || 'A dashboard with the same name already exists';
      console.log('Dashboard creation failed:', errorMessage);
      
      res.status(412).json({
        message: errorMessage,
        status: error.response.data?.status || 'name-exists'
      });
    } else {
      console.log('Error saving dashboard:', error);
      res.status(500).json({ message: 'Failed to create dashboard' });
    }
  }
});

// 更新特定 UID 的 dashboard 的 API
app.post('/api/update-dashboard', verifyToken, async (req, res) => {
  const influxdb_token = req.user.influxDB_token;
  const { title, queryCode, overwrite, uid, chartType, from, to } = req.body;
  console.log('Updating dashboard with the following params:', { title, queryCode, overwrite, uid });
  try {
    // 获取当前 dashboard 的完整数据
    const getResponse = await axios.get(`${Grafana_URL}/api/dashboards/uid/${uid}`, {
      httpsAgent: agent, // SSL代理,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
      },
    });

    const dashboard = getResponse.data.dashboard;
    
    // 更新 dashboard 的 title 和 panel 中的 query
    dashboard.title = title || dashboard.title;
    dashboard.panels[0].title = title || dashboard.panels[0].title;
    dashboard.panels[0].type = chartType || dashboard.panels[0].type;
    dashboard.tags = [`from:${from}`, `to:${to}`];
    dashboard.panels[0].targets[0].query = queryCode || dashboard.panels[0].targets[0].query;
    
    
    // 准备更新 dashboard 的请求数据
    const updateData = {
      dashboard: dashboard,
      overwrite: true,  // 是否覆盖
      folderUid: influxdb_token.slice(0, 10),
    };

    // 更新 dashboard
    const updateResponse = await axios.post(`${Grafana_URL}/api/dashboards/db`, updateData, {
      httpsAgent: agent, // SSL代理,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });
    // 使用 d-solo 和 panelId 生成单个面板的 URL
    const soloPanelUrl = `https://localhost:3001/grafana/d-solo/${updateResponse.data.uid}?orgId=1&panelId=1&theme=light&from=${from}&to=${to}&t=${Date.now()}`;
    console.log('Dashboard updated, Dashboard URL:', soloPanelUrl);
    console.log('Dashboard updated:', updateResponse.data);
    res.json({
      message: 'Dashboard updated successfully',
      uid: uid,
      newTitle: title || dashboard.title,
      soloPanelUrl: soloPanelUrl,
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);

    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});


app.post('/api/execute-query', verifyToken, async (req, res) => {
  try {
    const Grafana_datasourceID = req.user.Grafana_datasourceID;
    const { influxDB_token } = req.user;
    const { from, to, fluxQuery, type } = req.body;

    // Your existing logic for creating the dashboard
    
    const dashboardData = {
      dashboard: {
        id: null,
        title: "Generated Dashboard",
        timezone: "browser",
        panels: [
          {
            type: type,
            title: "Editing Panel",
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
      folderUid: influxDB_token.slice(0, 10),
      overwrite: true,
    };

    const response = await axios.post(`${Grafana_URL}/api/dashboards/db`, dashboardData, {
      httpsAgent: agent, // SSL代理,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Dashboard created:', response.data);

    const uid = response.data.uid;
    
    console.log('Dashboard created:', response.data);
    const timestamp = new Date().getTime();
    const soloPanelUrl = `https://localhost:3001/grafana/d-solo/${uid}?orgId=1&panelId=1&theme=light&from=${from}&to=${to}&nocache=${timestamp}`;
    console.log('Dashboard URL:', soloPanelUrl);

    // Adding cache-control headers to the response
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.status(200).json({ dashboardUrl: soloPanelUrl, dashboardUid: response.data.uid });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ message: 'Failed to create dashboard' });
  }
});

// 获取当前Dashboard的图表类型
app.get('/api/getDashboardType/:uid', verifyToken, async (req, res) => {
  
  const dashboardUid = req.params.uid;
  try {
    const response = await axios.get(`${Grafana_URL}/api/dashboards/uid/${dashboardUid}`, {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });

    const dashboard = response.data.dashboard;
    const chartType = dashboard.panels[0]?.type || 'graph'; // 假设第一个panel的图表类型
    res.json({ chartType });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// 更新Dashboard的图表类型
app.post('/api/updateDashboardType', verifyToken, async (req, res) => {
  const influxDB_token = req.user.influxDB_token;
  const { dashboardUid, chartType, from, to } = req.body;
  console.log('Updating dashboard type with the following params:', { dashboardUid, chartType, from, to });
  try {
    // 获取当前Dashboard的数据
    const dashboardResponse = await axios.get(`${Grafana_URL}/api/dashboards/uid/${dashboardUid}`, {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });

    let dashboard = dashboardResponse.data.dashboard;
    console.log('Dashboard data:', dashboard);
    // 更新图表类型（假设更新第一个panel）
    dashboard.panels.forEach(panel => {
      panel.type = chartType;  // 更新图表类型
    });

    // 更新Dashboard
    const updatedDashboard = {
      dashboard: dashboard,
      overwrite: true,  // 确保覆盖现有的Dashboard
      folderUid: influxDB_token.slice(0,10)  // 确保传递正确的 folderUid
    };

    const response = await axios.post(`${Grafana_URL}/api/dashboards/db`, updatedDashboard, {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Dashboard updated:', response.data);

    const timestamp = new Date().getTime();
    const soloPanelUrl = `https://localhost:3001/grafana/d-solo/${response.data.uid}?orgId=1&panelId=1&theme=light&from=${from}&to=${to}&nocache=${timestamp}`;

    res.json({ message: 'Dashboard updated successfully', dashboardUrl: soloPanelUrl });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// 获取所有 Dashboards 的 API
app.get('/api/dashboards', verifyToken, async (req, res) => {
  console.log('Fetching dashboards...');
  console.log('req.user: ', req.user);
  // const { influxDB_token } = req.user;
  try {
    const { influxDB_token } = req.user;
    const response = await axios.get(`${Grafana_URL}/api/search`, {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
      },
      params: {
        folderIds: influxDB_token.slice(0, 10),
        type: 'dash-db'
      }
    });

    const dashboards = response.data;
    console.log('dashboards: ', dashboards);
   
    // 获取每个 dashboard 的详细信息并附加 chartType
    const dashboardDetails = await Promise.all(
      dashboards
        .filter((dashboard) => dashboard.title !== 'Generated Dashboard')
        .map(async (dashboard) => {
          // 提取 tags 中的 from 和 to
          const fromTag = dashboard.tags.find((tag) => tag.startsWith('from:'));
          const toTag = dashboard.tags.find((tag) => tag.startsWith('to:'));

          const from = fromTag ? fromTag.split('from:')[1] : null;
          const to = toTag ? toTag.split('to:')[1] : null;

          // 获取 chartType
          let chartType = 'graph'; // 默认值
          try {
            const chartResponse = await axios.get(`${Grafana_URL}/api/dashboards/uid/${dashboard.uid}`, {
              httpsAgent: agent,
              headers: {
                Authorization: `Bearer ${Grafana_token}`,
                'Content-Type': 'application/json',
              },
            });
            const dashboardData = chartResponse.data.dashboard;
            chartType = dashboardData.panels[0]?.type || 'graph'; // 获取第一个 panel 的图表类型
          } catch (chartError) {
            console.error(`Error fetching chart type for dashboard ${dashboard.uid}:`, chartError);
          }

          return {
            uid: dashboard.uid,
            title: dashboard.title,
            from: from,
            to: to,
            chartType: chartType, // 附加 chartType
          };
        })
    );

    res.json(dashboardDetails);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

app.delete('/api/dashboards/:uid', verifyToken, async (req, res) => {
  const { uid } = req.params;  // 获取要删除的 dashboard 的 uid
  console.log(`Deleting dashboard with uid: ${uid}`);

  try {
    const response = await axios.delete(`${Grafana_URL}/api/dashboards/uid/${uid}`, {
      httpsAgent: agent,  // SSL代理
      headers: {
        Authorization: `Bearer ${Grafana_token}`,  // 使用你的 Grafana API token
      }
    });

    if (response.status === 200) {
      console.log(`Dashboard with uid: ${uid} successfully deleted`);
      res.json({ message: 'Dashboard successfully deleted' });
    } else {
      console.error(`Failed to delete dashboard with uid: ${uid}`);
      res.status(500).json({ error: 'Failed to delete dashboard' });
    }
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Error deleting dashboard' });
  }
});

app.get('/api/dashboard/:uid', verifyToken, async (req, res) => {
  const dashboardUid = req.params.uid;
  
  try {
    const response = await axios.get(`${Grafana_URL}/api/dashboards/uid/${dashboardUid}`, {
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${Grafana_token}`,
      },
    });

    const dashboard = response.data.dashboard;
    
    // 获取第一个 panel 的信息（如果有多个 panel，你可以遍历 panels）
    const panel = dashboard.panels[0];

    // 获取 panel 的 query
    const query = panel.targets ? panel.targets[0].query : null;

    res.status(200).json({
      title: dashboard.title,
      query: query,  // 传递查询
      panelType: panel.type,  // 传递 panel 类型
      panelTitle: panel.title,  // 传递 panel 标题
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});
// Start the server
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// 启动 HTTPS 服务器
https.createServer(sslOptions, app).listen(5001, () => {
  console.log('HTTPS Server running on port 5001');
});