const mongoose = require('mongoose');

// Store connections to avoid creating multiple connections to the same database
const connections = new Map();

/**
 * Function to connect to MongoDB
 * @param {String} tenantId - Optional tenant ID for multi-tenant connection
 * @returns {Promise<Connection>} Mongoose connection object
 */
const connectDB = async (tenantId = null) => {
  try {
    // Map tenant IDs to specific database names
    const tenantDbMap = {
      'default': 'LearnMsDb',
      'ngo': 'NgoLms'
    };

    // Determine which database to connect to based on tenant ID
    const dbName = tenantId ? (tenantDbMap[tenantId] || `${tenantId}Db`) : 'LearnMsDb';
    
    // Check if connection already exists for this database
    if (connections.has(dbName)) {
      const existingConnection = connections.get(dbName);
      if (existingConnection.readyState === 1) {
        console.log(`Reusing existing connection for database: ${dbName}`);
        return existingConnection;
      } else {
        connections.delete(dbName);
      }
    }

    // Get base connection string without database name
    let baseUri = process.env.MONGO_URI;
    if (baseUri.includes('/LearnMsDb')) {
      baseUri = baseUri.replace('/LearnMsDb', '');
    }

    // Create connection string with the appropriate database name
    const connectionString = `${baseUri}/${dbName}`;

    // Create a new mongoose instance for each tenant
    const mongooseInstance = new mongoose.Mongoose();

    // Simple but effective connection options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true
    };

    console.log(`Creating new connection for tenant: ${tenantId || 'default'}`);
    
    // Only set the options that are definitely supported
    mongooseInstance.set('bufferCommands', false);
    
    const conn = await mongooseInstance.connect(connectionString, connectionOptions);

    // Store connection in cache
    connections.set(dbName, conn.connection);

    // Basic event handlers
    conn.connection.on('connected', () => {
      console.log(`MongoDB Connected: ${conn.connection.host} - Database: ${dbName}`);
    });

    conn.connection.on('error', (err) => {
      console.error(`MongoDB connection error for ${dbName}:`, err);
      connections.delete(dbName);
    });

    conn.connection.on('disconnected', () => {
      console.log(`MongoDB disconnected for database: ${dbName}`);
      connections.delete(dbName);
    });

    return conn;

  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    throw err; // Let the calling code handle the error
  }
};

/**
 * Function to get connection to a specific tenant's database
 */
const getTenantConnection = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return await connectDB(tenantId);
};

/**
 * Function to close all connections
 */
const closeAllConnections = async () => {
  for (const [dbName, connection] of connections) {
    try {
      await connection.close();
      console.log(`Closed connection for database: ${dbName}`);
    } catch (err) {
      console.error(`Error closing connection for ${dbName}:`, err);
    }
  }
  connections.clear();
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeAllConnections();
  process.exit(0);
});

module.exports = {
  connectDB,
  getTenantConnection,
  closeAllConnections
};