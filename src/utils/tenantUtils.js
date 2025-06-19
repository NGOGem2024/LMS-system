const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');

/**
 * Map to store tenant connections
 * Key: tenantId, Value: mongoose connection
 */
const tenantConnections = new Map();

/**
 * Get or create a connection for a specific tenant
 * @param {String} tenantId - Tenant ID
 * @returns {Promise<Connection>} Mongoose connection
 */
const getConnectionForTenant = async (tenantId) => {
  // If connection exists and is open, return it
  if (tenantConnections.has(tenantId) && 
      tenantConnections.get(tenantId).readyState === 1) {
    return tenantConnections.get(tenantId);
  }
  
  // Otherwise create a new connection
  const connection = await getTenantConnection(tenantId);
  tenantConnections.set(tenantId, connection);
  return connection;
};

/**
 * Close all tenant connections
 * @returns {Promise<void>}
 */
const closeAllConnections = async () => {
  const closePromises = [];
  
  for (const [tenantId, connection] of tenantConnections.entries()) {
    if (connection.readyState === 1) {
      closePromises.push(connection.close());
    }
    tenantConnections.delete(tenantId);
  }
  
  await Promise.all(closePromises);
  console.log('All tenant connections closed');
};

/**
 * Extract tenant ID from request
 * Can be extracted from subdomain, header, or token
 * @param {Object} req - Express request object
 * @returns {String} tenantId
 */
const extractTenantId = (req) => {
  // Option 1: Extract from subdomain
  const host = req.headers.host;
  const subdomain = host ? host.split('.')[0] : null;
  
  // Option 2: Extract from custom header
  const tenantHeader = req.headers['x-tenant-id'];
  
  // Option 3: Extract from JWT token (assuming token is already verified)
  const tokenTenantId = req.user ? req.user.tenantId : null;
  
  // Return the first valid tenantId found
  return subdomain || tenantHeader || tokenTenantId;
};

module.exports = {
  getConnectionForTenant,
  closeAllConnections,
  extractTenantId
}; 