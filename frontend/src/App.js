import React from 'react';
import QueryBuilder from './components/QueryBuilder';

function App() {
  const handleQuerySubmit = (queryData) => {
    console.log('Submitted Query Data:', queryData);
    
    // Here you can send queryData to your backend using fetch or axios
    fetch('http://localhost:4000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Query Response:', data);
      // Handle the response data from your backend (e.g., pass it to Grafana)
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div className="App">
      <h1>InfluxDB Query Builder</h1>
      <QueryBuilder onSubmit={handleQuerySubmit} />
    </div>
  );
}

export default App;