const { extractTenantId, getConnectionForTenant } = require('../utils/tenantUtils');

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
    console.log(`Tenant middleware: Processing request for tenant: ${tenantId}, URL: ${req.originalUrl}`);
    
    if (!tenantId) {
      console.error('Tenant middleware: No tenant ID provided');
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    console.log(`Tenant middleware: Getting connection for tenant: ${tenantId}`);
    
    // Get connection for this tenant - models are now registered in getConnectionForTenant
    try {
      const connection = await getConnectionForTenant(tenantId);
      
      if (!connection) {
        console.error(`Tenant middleware: No connection returned for tenant: ${tenantId}`);
        return res.status(503).json({
          success: false,
          error: 'Database connection not available. Please try again later.'
        });
      }
      
      if (connection.readyState !== 1) {
        console.error(`Tenant middleware: Connection not ready for tenant: ${tenantId}, readyState: ${connection.readyState}`);
        return res.status(503).json({
          success: false,
          error: 'Database connection not available. Please try again later.'
        });
      }
      
      // Verify that models are registered
      const modelCount = Object.keys(connection.models || {}).length;
      console.log(`Tenant middleware: Connection established with ${modelCount} models for tenant: ${tenantId}`);
      
      // Even if no models are registered, we'll continue since models might be registered dynamically
      
      // Set tenant context on request object
      req.tenantId = tenantId;
      req.tenantConnection = connection;
      
      // Set global Mongoose models on req for easy access
      req.models = connection.models || {};
      
      next();
    } catch (connErr) {
      console.error(`Tenant middleware: Connection error for tenant ${tenantId}: ${connErr.message}`);
      console.error(`Tenant middleware: Error stack: ${connErr.stack}`);
      return res.status(503).json({
        success: false,
        error: 'Failed to establish database connection. Please try again later.'
      });
    }
  } catch (err) {
    console.error(`Tenant middleware error: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    return res.status(503).json({
      success: false,
      error: 'Database connection error. Please try again later.'
    });
  }
};

module.exports = tenantMiddleware; 