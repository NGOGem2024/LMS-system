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