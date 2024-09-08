const express = require('express');
const bodyParser = require('body-parser');
const { InfluxDB } = require('@influxdata/influxdb-client');

const app = express();
const port = 4000;

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// InfluxDB connection details
const token = 'bt_ptEYcdxn62Xmf8p-mKsWP3At-sz9Tfrf06c4lRsOGOSaqnCDvu8V7EYPRrubIXB90Bs-DAVWcWL-IIN3wxg==';
const org = 'Testing';
const bucket = 'Retention';
const url = 'http://localhost:8086'; // Assuming InfluxDB is running locally

const influxDB = new InfluxDB({ url, token });
const queryApi = influxDB.getQueryApi(org);

// Handle POST request from frontend to query InfluxDB
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});