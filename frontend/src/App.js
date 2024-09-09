import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignIn from './components/sign-in/SignIn';
import Dashboard from './components/dashboard/Dashboard'
import QueryBuilder from './components/QueryBuilder';
import TestBucket from './components/TestBucket';
import TestDashboard from './components/TestDashboard';

const App = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5001/')
      .then(response => {
        setMessage(response.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

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
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/test" element={<QueryBuilder onSubmit={handleQuerySubmit} />} />
        <Route path="/buckets" element={<TestBucket />} />
        <Route path="/dashboards" element={<TestDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
