import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';

function TimeRangeSelector({ onTimeRangeChange, timeRange, disabled }) {

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} disabled={disabled}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '5px'  }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <DateTimePicker
            label="Start Time"
            // value={startTime}
            // onChange={setStartTime}
            value={timeRange.start}
            onChange={(newValue) => onTimeRangeChange(newValue, timeRange.end)}
            disabled={disabled}
            renderInput={(params) => <TextField {...params} />}
          />
          <DateTimePicker
            label="End Time"
            // value={endTime}
            // onChange={setEndTime}
            value={timeRange.end}
            onChange={(newValue) => onTimeRangeChange(timeRange.start, newValue)}
            disabled={disabled}
            renderInput={(params) => <TextField {...params} />}
          />
        </div>
      </div>
    </LocalizationProvider>
  );
}

export default TimeRangeSelector;
