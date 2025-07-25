const mongoose = require('mongoose');

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
      // Add more tenant-to-database mappings as needed
    };
    
    // Determine which database to connect to based on tenant ID
    // If tenantId exists in the map, use that database, otherwise use tenant-specific naming
    const dbName = tenantId ? (tenantDbMap[tenantId] || `${tenantId}Db`) : 'LearnMsDb';
    
    console.log(`DB Connect: Connecting to database for tenant: ${tenantId || 'default'}, using database: ${dbName}`);
    
    // Get base connection string without database name
    let baseUri = process.env.MONGO_URI;
    if (!baseUri) {
      console.error('DB Connect: MONGO_URI environment variable is not set');
      throw new Error('MongoDB connection string is not defined');
    }
    
    if (baseUri.includes('/LearnMsDb')) {
      baseUri = baseUri.replace('/LearnMsDb', '');
    }
    
    // Create connection string with the appropriate database name
    const connectionString = `${baseUri}/${dbName}`;
    console.log(`DB Connect: Connection string (without password): ${connectionString.replace(/\/\/[^:]+:[^@]+@/, '//[REDACTED]@')}`);
    
    // Create connection
    const conn = mongoose.createConnection();
    
    // Set up connection event listeners before connecting
    conn.on('connected', () => {
      console.log(`DB Connect: MongoDB Connected: ${conn.host} - Database: ${dbName}`);
    });
    
    conn.on('error', (err) => {
      console.error(`DB Connect: MongoDB connection error for ${dbName}: ${err.message}`);
    });
    
    conn.on('disconnected', () => {
      console.warn(`DB Connect: MongoDB disconnected for ${dbName}`);
    });
    
    conn.on('reconnected', () => {
      console.log(`DB Connect: MongoDB reconnected for ${dbName}`);
    });
    
    // Connect with a promise that resolves when the connection is established
    await new Promise((resolve, reject) => {
      // Set up a timeout - increased from 45s to 60s
      const timeoutId = setTimeout(() => {
        reject(new Error('Database connection timed out'));
      }, 60000);
      
      // Set up connection success handler
      conn.once('connected', () => {
        clearTimeout(timeoutId);
        resolve();
      });
      
      // Set up connection error handler
      conn.once('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
      
      // Start the connection process with optimized settings for Atlas
      conn.openUri(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 60000,    // Increased to 60s
        socketTimeoutMS: 120000,            // Increased to 120s
        connectTimeoutMS: 60000,            // Increased to 60s
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        maxPoolSize: 50,                    // Increased to 50
        minPoolSize: 10,                    // Increased to 10
        maxIdleTimeMS: 120000,              // Increased to 120s
        retryWrites: true,
        retryReads: true,
        bufferCommands: true,               // Buffer commands when connection is lost
        autoIndex: false,                   // Don't build indexes automatically in production
        heartbeatFrequencyMS: 10000,        // Check server status every 10 seconds
        w: 'majority',                      // Write concern for better durability
        wtimeoutMS: 30000,                  // Write timeout
        j: true                             // Wait for journal commit
      });
    });
    
    // Connection should be established by now
    if (conn.readyState !== 1) {
      console.error(`DB Connect: Connection should be ready but is in state: ${conn.readyState}`);
      throw new Error('Failed to establish database connection');
    }
    
    console.log(`DB Connect: Connection successfully established and ready`);
    
    // Return the mongoose connection
    return conn;
  } catch (err) {
    console.error(`DB Connect: Error connecting to MongoDB: ${err.message}`);
    console.error(`DB Connect: Error stack: ${err.stack}`);
    
    // Don't exit the process on connection failure, let the caller handle it
    throw err;
  }
};

/**
 * Function to get connection to a specific tenant's database
 * @param {String} tenantId - Tenant ID
 * @returns {Promise<Connection>} Mongoose connection to tenant database
 */
const getTenantConnection = async (tenantId) => {
  if (!tenantId) {
    console.error('DB Connect: Tenant ID is required for getTenantConnection');
    throw new Error('Tenant ID is required');
  }
  
  try {
    console.log(`DB Connect: Getting connection for tenant: ${tenantId}`);
    
    // Set a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timed out')), 60000); // Increased to 60s
    });
    
    // Connection promise
    const connectionPromise = connectDB(tenantId);
    
    // Race them
    return await Promise.race([connectionPromise, timeoutPromise]);
  } catch (err) {
    console.error(`DB Connect: Failed to get connection for tenant ${tenantId}: ${err.message}`);
    throw err;
  }
};

module.exports = {
  connectDB,
  getTenantConnection
}; 