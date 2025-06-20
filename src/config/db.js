const mongoose = require('mongoose');

/**
 * Function to connect to MongoDB
 * @param {String} tenantId - Optional tenant ID for multi-tenant connection
 * @returns {Promise<Connection>} Mongoose connection object
 */
const connectDB = async (tenantId = null) => {
  try {
    // If tenantId is provided and not 'default', connect to that specific database
    const dbName = tenantId && tenantId !== 'default' ? `${tenantId}Db` : 'LearnMsDb';
    
    // Only modify the connection string if we're not using the default database
    let connectionString = process.env.MONGO_URI;
    if (tenantId && tenantId !== 'default' && !connectionString.endsWith('/LearnMsDb')) {
      connectionString = `${connectionString}${dbName}`;
    }
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host} - Database: ${dbName}`);
    return conn;
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