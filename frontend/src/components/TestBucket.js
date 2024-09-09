import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BucketList() {
  const [buckets, setBuckets] = useState([]);

  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/buckets');
        setBuckets(response.data.buckets);
        console.log(response);
      } catch (error) {
        console.error('Error fetching buckets:', error);
      }
    };

    fetchBuckets();
  }, []);

  return (
    <div>
      <h1>Bucket List</h1>
      <ul>
        {buckets.map((bucket, index) => (
          <li key={index}>{bucket}</li>
        ))}
      </ul>
    </div>
  );
}
