require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes


// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());


app.use('/api/auth', require('./routes/auth'));
// Database connection
const db = require('./config/db');
db.connect();

// Routes


// Basic route
app.get('/', (req, res) => {
  res.send('Backend is Connected!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});