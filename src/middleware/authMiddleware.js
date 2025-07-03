const jwt = require('jsonwebtoken');
const { getConnectionForTenant } = require('../utils/tenantUtils');

/**
 * Middleware to protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user in request
    req.user = decoded;
    
    // Set tenant ID if available in token
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
      
      // Only get tenant connection if not already set (e.g. by tenantMiddleware)
      if (!req.tenantConnection) {
        try {
          const connection = await getConnectionForTenant(decoded.tenantId);
          req.tenantConnection = connection;
        } catch (connErr) {
          console.error(`Error getting tenant connection: ${connErr.message}`);
          // Continue without connection - next middleware might handle it
        }
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param  {...String} roles - Roles allowed to access the route
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        error: 'User role not defined'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize
}; 