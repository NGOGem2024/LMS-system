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
    
    // Get connection for this tenant
    const connection = await getConnectionForTenant(tenantId);
    
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