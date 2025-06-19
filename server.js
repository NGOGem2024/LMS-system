const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

// Load env vars
dotenv.config();

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

// Connect to MongoDB with multi-tenant support
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LMS API with Multi-tenant support' });
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