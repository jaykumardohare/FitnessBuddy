const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/buddy', require('./routes/buddy'));
app.use('/api/workout', require('./routes/workout'));
app.use('/api/message', require('./routes/message'));

// Base route
app.get('/', (req, res) => {
  res.send('FitnessBuddy API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));