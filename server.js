const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Import database connection
const { connectDB } = require('./src/config/db');
const { switchToDatabase, getActiveConnections } = require('./src/utils/dbSwitcher');

// Load env vars
dotenv.config();
console.log('Environment variables loaded:', Object.keys(process.env));
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGO_URI:', process.env.MONGO_URI);

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Import error handler
const errorHandler = require('./src/middleware/errorMiddleware');

// Define routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tenants', require('./src/routes/tenants'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/assignments', require('./src/routes/assignments'));
app.use('/api/certifications', require('./src/routes/certifications'));
app.use('/api/quizzes', require('./src/routes/quizzes'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/institutions', require('./src/routes/institutions'));
app.use('/api/progress', require('./src/routes/userProgress'));

// Connect to default MongoDB database
connectDB('default')
  .then(() => {
    console.log('Default database connection established');
  })
  .catch(err => {
    console.error(`Error connecting to default database: ${err.message}`);
    process.exit(1);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS API with Multi-tenant support' });
});

// Test route for database switching (no auth required - for testing only)
app.get('/test-db-switch/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    const result = await switchToDatabase(tenantId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

app.get('/test-active-connections', (req, res) => {
  try {
    const result = getActiveConnections();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Store server instance
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
}); 