const jwt = require('jsonwebtoken');
const { getConnectionForTenant } = require('../utils/tenantUtils');

// List of public paths that don't require authentication
const publicPaths = [
  '/api/auth',
  '/api/ngo-lms/public',
  '/api/ngo-lms/ngo-public-course',
  '/api/ngo-lms/ngo-public-courses'
];

/**
 * Middleware to protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  console.log('Auth middleware - Starting authentication check');
  console.log('Auth middleware - Request path:', req.path);
  console.log('Auth middleware - Full URL:', req.originalUrl);

  // Check if the route is public
  const isPublicRoute = publicPaths.some(path => req.originalUrl.startsWith(path));
  if (isPublicRoute) {
    console.log('Auth middleware - Public route detected, skipping authentication');
    return next();
  }

  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Auth middleware - Token found in Authorization header:', token.substring(0, 20) + '...');
  } else {
    console.log('Auth middleware - No token in Authorization header');
  }

  // Check if token exists
  if (!token) {
    console.log('Auth middleware - No token provided, returning 401');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    console.log('Auth middleware - Verifying token with secret:', process.env.JWT_SECRET ? 'Secret exists' : 'Secret MISSING');
    
    // Make sure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set!');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token verified successfully:', { id: decoded.id, role: decoded.role, tenantId: decoded.tenantId });

    // Set user in request
    req.user = decoded;
    
    // Set tenant ID if available in token
    if (decoded.tenantId) {
      req.tenantId = decoded.tenantId;
      console.log(`Auth middleware - Setting tenant ID: ${decoded.tenantId}`);
      
      // Only get tenant connection if not already set (e.g. by tenantMiddleware)
      if (!req.tenantConnection) {
        try {
          console.log('Auth middleware - Getting tenant connection');
          const connection = await getConnectionForTenant(decoded.tenantId);
          req.tenantConnection = connection;
          console.log('Auth middleware - Tenant connection set successfully');
        } catch (connErr) {
          console.error(`Auth middleware - Error getting tenant connection: ${connErr.message}`);
          // Continue without connection - next middleware might handle it
        }
      } else {
        console.log('Auth middleware - Tenant connection already exists');
      }
    } else {
      console.log('Auth middleware - No tenant ID in token');
    }

    console.log('Auth middleware - Authentication successful, proceeding to next middleware');
    next();
  } catch (err) {
    console.error(`Auth middleware - Token verification failed: ${err.message}`);
    console.error(`Auth middleware - Error stack: ${err.stack}`);
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
    console.log(`Authorization check for role: ${req.user.role}, allowed roles: ${roles.join(', ')}`);
    
    if (!req.user.role) {
      console.log('Authorization failed: User role not defined');
      return res.status(403).json({
        success: false,
        error: 'User role not defined'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role ${req.user.role} not in allowed roles`);
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    console.log('Authorization successful');
    next();
  };
};

module.exports = {
  protect,
  authorize
}; 