const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

// Routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email, password });
  try {
  
    const response = await axios.get('http://localhost:3001/users', {
      params: {
        email: email,
        password: password
      }
    });

    const user = response.data[0];
    console.log('User:', user);
    if (user) {
      console.log('Login successful');
      res.status(200).json({ message: 'Login successful', userId: user.id });
    } else {
      console.log('Invalid email or password');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.log('An error occurred', error.message);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
