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
    
    // Get base connection string without database name
    let baseUri = process.env.MONGO_URI;
    if (baseUri.includes('/LearnMsDb')) {
      baseUri = baseUri.replace('/LearnMsDb', '');
    }
    
    // Create connection string with the appropriate database name
    const connectionString = `${baseUri}/${dbName}`;
    
    // Create a new mongoose instance for each tenant to avoid connection conflicts
    const mongooseInstance = new mongoose.Mongoose();
    
    const conn = await mongooseInstance.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 60000, // Increase socket timeout to 60 seconds
      connectTimeoutMS: 30000, // Increase connect timeout to 30 seconds
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutes
      // Add connection pool options
      maxPoolSize: 20, // Maximum pool size
      minPoolSize: 5, // Minimum pool size
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      // Add retry options
      retryWrites: true,
      retryReads: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host} - Database: ${dbName}`);
    
    // Return the mongoose instance which has the connection and event emitters
    return mongooseInstance;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

/**
 * Function to get connection to a specific tenant's database
 * @param {String} tenantId - Tenant ID
 * @returns {Promise<Connection>} Mongoose connection to tenant database
 */
const getTenantConnection = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  
  return connectDB(tenantId);
};

module.exports = {
  connectDB,
  getTenantConnection
}; 