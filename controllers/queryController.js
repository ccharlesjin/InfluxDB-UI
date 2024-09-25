const { InfluxDB } = require('@influxdata/influxdb-client');
const { QueryApi } = require('@influxdata/influxdb-client-apis');
const { validationResult } = require('express-validator');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const influxDB = new InfluxDB({ url: process.env.INFLUXDB_URL, token: process.env.INFLUXDB_TOKEN });
const queryApi = influxDB.getQueryApi(process.env.INFLUXDB_ORG);

// Controller for executing the query
exports.executeQuery = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { bucket, measurement, field, timeRange } = req.body;

  const fluxQuery = `
    from(bucket: "${bucket}")
    |> range(start: ${timeRange.start}, stop: ${timeRange.stop})
    |> filter(fn: (r) => r._measurement == "${measurement}")
    |> filter(fn: (r) => r._field == "${field}")
  `;

  try {
    const rows = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      complete() {
        res.json(rows); // Send the query result
      },
      error(error) {
        console.error('Error querying data:', error);
        res.status(500).send('Error querying data');
      }
    });
  } catch (error) {
    console.error('Error building query:', error);
    res.status(500).send('Error executing query');
  }
};
