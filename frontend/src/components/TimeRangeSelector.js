import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';

function TimeRangeSelector({ onTimeRangeChange }) {
  // 使用 dayjs 初始化时间
  const [startTime, setStartTime] = useState(dayjs());
  const [endTime, setEndTime] = useState(dayjs());

  const handleApply = () => {
    // 调用父组件传递的函数，传递选定的时间范围
    onTimeRangeChange({ start: startTime, end: endTime });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <DateTimePicker
          label="Start Time"
          value={startTime}
          onChange={setStartTime}
          renderInput={(params) => <TextField {...params} />}
        />
        <DateTimePicker
          label="End Time"
          value={endTime}
          onChange={setEndTime}
          renderInput={(params) => <TextField {...params} />}
        />
        <Button variant="contained" onClick={handleApply}>
          Apply Time Range
        </Button>
      </div>
    </LocalizationProvider>
  );
}

export default TimeRangeSelector;
