const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const queryRoutes = require('./routes/queryRoutes'); // 引入查询路由

// Load environment variables from .env file
dotenv.config();

// Initialize the express application
const app = express();
app.use(express.json());
app.use(morgan('combined')); // 日志记录

// InfluxDB connection details
const { InfluxDB } = require('@influxdata/influxdb-client');
const { BucketsAPI } = require('@influxdata/influxdb-client-apis');
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN
});
const org = process.env.INFLUXDB_ORG;
const bucketsAPI = new BucketsAPI(influxDB);

// API to get list of available buckets
app.get('/influxdb/buckets', async (req, res) => {
  try {
    const buckets = await bucketsAPI.getBuckets({ org });
    res.json(buckets.buckets); // Return the list of buckets in JSON format
  } catch (error) {
    console.error('Error fetching buckets:', error);
    res.status(500).send(`Error fetching buckets: ${error.message}`);
  }
});

// Mount the query routes
app.use('/influxdb', queryRoutes); // 新增查询API的路由

// Start the express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
