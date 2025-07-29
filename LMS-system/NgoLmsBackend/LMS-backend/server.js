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

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  console.log('WARNING: JWT_SECRET not found in environment variables. Using default secret (not secure for production)');
  process.env.JWT_SECRET = 'default_jwt_secret_for_development_only';
}

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Secret is set' : 'Secret is MISSING');
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
  origin: '*',
  exposedHeaders: ['Content-Disposition']
}));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  createParentPath: true
}));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
console.log('Serving static files from:', path.join(__dirname, 'public/uploads'), 'at URL path: /uploads');

// Import error handler and auth middleware
const errorHandler = require('./src/middleware/errorMiddleware');
const { protect } = require('./src/middleware/authMiddleware');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS API with Multi-tenant support' });
});

// Apply auth middleware globally for protected routes
app.use(protect);

// Protected routes
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

// NGO LMS protected routes
app.use('/api/ngo-lms', require('./src/routes/ng/Ngocourse'));
app.use('/api/ngo-lms', require('./src/routes/ng/Ngomodules'));

// Diagnostic route to check connection status
app.get('/api/status/connections', (req, res) => {
  const connections = getConnectionInfo();
  res.json({
    success: true,
    connections,
    count: Object.keys(connections).length
  });
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 2000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    const connection = await connectDB('default');
    
    if (!connection || connection.readyState !== 1) {
      console.error(`Failed to establish default database connection, readyState: ${connection ? connection.readyState : 'null'}`);
      throw new Error('Failed to establish database connection');
    }
    
    console.log('Default database connection established');
    
    try {
      const { getModels } = require('./src/models');
      const models = getModels(connection);
      console.log(`All models registered for default connection: ${Object.keys(models).length} models`);
    } catch (modelErr) {
      console.error(`Error registering models: ${modelErr.message}`);
      console.error(`This may cause issues with database operations`);
    }
    
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      console.log(`Stack: ${err.stack}`);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    process.exit(1);
  }
};

startServer(); 