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
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    // Get connection for this tenant - models are now registered in getConnectionForTenant
    const connection = await getConnectionForTenant(tenantId);
    
    // Set tenant context on request object
    req.tenantId = tenantId;
    req.tenantConnection = connection;
    
    // Set global Mongoose models on req for easy access
    req.models = connection.models;
    
    next();
  } catch (err) {
    console.error(`Tenant middleware error: ${err.message}`);
    return res.status(503).json({
      success: false,
      error: 'Database connection error. Please try again later.'
    });
  }
};

module.exports = tenantMiddleware; 