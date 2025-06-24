const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

// Import database connection
const { connectDB } = require('./src/config/db');
const { switchToDatabase, getActiveConnections } = require('./src/utils/dbSwitcher');
const { getConnectionInfo } = require('./src/utils/tenantUtils');

// Load env vars
dotenv.config();
console.log('Environment variables loaded:', Object.keys(process.env));
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGO_URI:', process.env.MONGO_URI);

// Initialize app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow access from any origin
  exposedHeaders: ['Content-Disposition'] // Needed for file downloads
}));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  createParentPath: true
}));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
console.log('Serving static files from:', path.join(__dirname, 'public/uploads'), 'at URL path: /uploads');

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
app.use('/api/modules', require('./src/routes/modules'));
app.use('/api/content', require('./src/routes/content'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS API with Multi-tenant support' });
});

// Diagnostic route to check connection status
app.get('/api/status/connections', (req, res) => {
  const connections = getConnectionInfo();
  res.json({
    success: true,
    connections,
    count: Object.keys(connections).length
  });
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
const PORT = process.env.PORT || 2000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to default MongoDB database and wait for connection
    const connection = await connectDB('default');
    
    if (!connection || connection.readyState !== 1) {
      console.error(`Failed to establish default database connection, readyState: ${connection ? connection.readyState : 'null'}`);
      throw new Error('Failed to establish database connection');
    }
    
    console.log('Default database connection established');
    
    // Load all models from the models directory
    try {
      const { getModels } = require('./src/models');
      const models = getModels(connection);
      console.log(`All models registered for default connection: ${Object.keys(models).length} models`);
    } catch (modelErr) {
      console.error(`Error registering models: ${modelErr.message}`);
      console.error(`This may cause issues with database operations`);
    }
    
    // Start server only after DB connection is established
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      console.log(`Stack: ${err.stack}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    process.exit(1);
  }
};

startServer(); 