import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Select, MenuItem } from '@mui/material';
import TimeRangeSelector from './TimeRangeSelector';
import axios from 'axios';

const MainDashboard = ({ loading, setLoading }) => {
  const [bucket, setBucket] = useState("");
  const [windowPeriod, setWindowPeriod] = useState("10m");
  const [iframeUrl, setIframeUrl] = useState("");
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [bucketList, setBucketList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const createDashboard = async () => {
    if (!timeRange.start || !timeRange.end) {
      alert("Please select a valid time range");
      return;
    }

    try {
      // show loading page
      setLoading(true); 
      const start = timeRange.start.unix() * 1000;
      const stop = timeRange.end.unix() * 1000;

      const response = await axios.post('http://localhost:5001/create-dashboard', {
        bucket,
        windowPeriod,
        from: start,
        to: stop
      });

      setIframeUrl(response.data.dashboardUrl);
    } catch (error) {
      console.error('Error creating dashboard:', error);
    } finally {
      setLoading(false); // Hide loading after operation
    }
  };

  useEffect(() => {
    const fetchBuckets = async() => {
      try {
        const response = await axios.get('http://localhost:5001/api/buckets');
        console.log(response);
        setBucketList(response.data.buckets);
      } catch(error) {
        console.log('Error fetching bucket list:', error);
        setErrorMessage('Failed to fetch bucket list');
      }
    }
    fetchBuckets();
  }, []);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={2} gap={2}>
      
      {/* Visualization area */}
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        width="100%" 
        maxWidth="1200px" 
        height="400px" 
        borderRadius="6px" 
        boxShadow="0px 2px 10px rgba(0,0,0,0.1)" 
        bgcolor="primary" 
        p={2} 
        mb={4}
      >
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Grafana Panel"
          />
        ) : (
          <Typography variant="h6">No data to display</Typography>
        )}
      </Box>

      {/* Drag-and-drop and time range selection area */}
      <Box display="flex" width="100%" maxWidth="1200px" justifyContent="space-between" gap={2}>
        
        {/* Drag-and-drop area */}
        <Box 
          flex={1} 
          height="200px" 
          borderRadius="6px" 
          boxShadow="0px 2px 10px rgba(0,0,0,0.1)" 
          bgcolor="primary" 
          p={2}
        >
          <Typography variant="body1">Drag and Drop Area</Typography>
          <label>Bucket Name:</label>
          <Select value={bucket} onChange={(e) => {setBucket(e.target.value)}} fullWidth>
            {
              bucketList.length > 0 ? (
                bucketList
                .filter(bucketName => !bucketName.startsWith('_'))
                .map((bucketName, index) => (
                  <MenuItem key={index} value={bucketName}>
                    {bucketName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No buckets available</MenuItem>
              )
            }
          </Select>
        </Box>

        {/* Time range selection area */}
        <Box 
          sx={{ 
            width: '40%', 
            padding: '2rem', 
            backgroundColor: 'primary', 
            borderRadius: '8px', 
            boxShadow: 1 
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ textAlign: 'center', marginBottom: '1rem' }}
          >
            Select Time Range
          </Typography>
          <TimeRangeSelector onTimeRangeChange={setTimeRange} />
          {timeRange.start && timeRange.end && (
            <div>
              <h2>Selected Time Range:</h2>
              <p>Start: {timeRange.start.format('YYYY-MM-DD HH:mm:ss')}</p>
              <p>End: {timeRange.end.format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          )}
          <Box sx={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={createDashboard} 
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Dashboard"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainDashboard;
