import React, { useState } from 'react';

function QueryBuilder({ onSubmit }) {
  const [bucket, setBucket] = useState('');
  const [fields, setFields] = useState([]);
  const [timeRange, setTimeRange] = useState({ start: '', end: '' });

  // Handle when a draggable field is dragged over the target area
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent the default action to allow dropping
  };

  // Handle the drop event, which adds the dragged field to the selected fields
  const handleDrop = (e) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain'); // Get the field name from the drag event
    if (!fields.includes(field)) {
      setFields((prevFields) => [...prevFields, field]);
    }
  };

  // Handle the start of the drag event, setting the field being dragged
  const handleDragStart = (e, field) => {
    e.dataTransfer.setData('text/plain', field);
  };

  const handleSubmit = () => {
    // Submit the selected query options to the backend
    onSubmit({ bucket, fields, timeRange });
  };

  return (
    <div>
      <h3>Select Data</h3>

      {/* Bucket Selector */}
      <label>Bucket</label>
      <select onChange={(e) => setBucket(e.target.value)}>
        <option value="bucket1">Bucket 1</option>
        <option value="bucket2">Bucket 2</option>
      </select>

      {/* Available Fields to Drag */}
      <h4>Available Fields</h4>
      <div className="field-container">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'temperature')}
          style={{ padding: '10px', backgroundColor: 'lightgray', margin: '5px' }}
        >
          Temperature
        </div>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'humidity')}
          style={{ padding: '10px', backgroundColor: 'lightgray', margin: '5px' }}
        >
          Humidity
        </div>
      </div>

      {/* Droppable Area for Fields */}
      <h4>Selected Fields</h4>
      <div
        className="drop-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: '2px dashed gray',
          padding: '20px',
          minHeight: '100px',
        }}
      >
        {fields.length > 0 ? (
          fields.map((field, index) => <div key={index}>{field}</div>)
        ) : (
          <p>Drag fields here</p>
        )}
      </div>

      {/* Time Range Picker */}
      <h4>Time Range</h4>
      <label>Start:</label>
      <input type="datetime-local" onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })} />
      <label>End:</label>
      <input type="datetime-local" onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })} />

      <button onClick={handleSubmit}>Generate Query</button>
    </div>
  );
}

export default QueryBuilder;