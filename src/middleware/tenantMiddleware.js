const { extractTenantId, getConnectionForTenant } = require('../utils/tenantUtils');
const fs = require('fs');
const path = require('path');

/**
 * Register models for a specific tenant connection
 * @param {Object} connection - Mongoose connection
 */
const registerModels = (connection) => {
  const modelsDir = path.join(__dirname, '../models');
  
  // Skip the index.js file
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file !== 'index.js' && file.endsWith('.js'));
  
  for (const file of modelFiles) {
    const modelPath = path.join(modelsDir, file);
    const modelName = file.split('.')[0];
    
    // Only register the model if it doesn't exist on this connection
    if (!connection.models[modelName]) {
      try {
        // Require the model schema
        const modelSchema = require(modelPath).schema;
        
        // Register the model with this connection
        connection.model(modelName, modelSchema);
        console.log(`Model ${modelName} registered for tenant connection`);
      } catch (err) {
        console.error(`Error registering model ${modelName}: ${err.message}`);
      }
    }
  }
};

/**
 * Middleware to extract tenant ID and set tenant context
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Extract tenant ID from request
    const tenantId = extractTenantId(req);
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    // Get connection for this tenant
    const connection = await getConnectionForTenant(tenantId);
    
    // Register models for this connection
    registerModels(connection);
    
    // Set tenant context on request object
    req.tenantId = tenantId;
    req.tenantConnection = connection;
    
    next();
  } catch (err) {
    console.error(`Tenant middleware error: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = tenantMiddleware; 