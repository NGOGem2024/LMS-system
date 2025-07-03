const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');

/**
 * Map to store tenant connections
 * Key: tenantId, Value: mongoose connection
 */
const tenantConnections = new Map();

/**
 * Close an existing connection if it exists
 * @param {String} tenantId - Tenant ID
 */
const closeExistingConnection = async (tenantId) => {
  if (tenantConnections.has(tenantId)) {
    const connection = tenantConnections.get(tenantId);
    if (connection.readyState === 1) {
      console.log(`Closing existing connection for tenant: ${tenantId}`);
      await connection.close();
    }
    tenantConnections.delete(tenantId);
  }
};

/**
 * Get or create a connection for a specific tenant
 * @param {String} tenantId - Tenant ID
 * @returns {Promise<Connection>} Mongoose connection
 */
const getConnectionForTenant = async (tenantId) => {
  // If connection exists and is open, close it to avoid conflicts
  await closeExistingConnection(tenantId);
  
  // Create a new connection
  console.log(`Creating new connection for tenant: ${tenantId}`);
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
  // Option 1: Extract from custom header - highest priority
  const tenantHeader = req.headers['x-tenant-id'];
  if (tenantHeader) {
    console.log(`Extracted tenant ID from header: ${tenantHeader}`);
    return tenantHeader;
  }
  
  // Option 2: Extract from JWT token
  const tokenTenantId = req.user ? req.user.tenantId : null;
  if (tokenTenantId) {
    console.log(`Extracted tenant ID from token: ${tokenTenantId}`);
    return tokenTenantId;
  }
  
  // Option 3: Extract from query parameter
  const queryTenantId = req.query ? req.query.tenantId : null;
  if (queryTenantId) {
    console.log(`Extracted tenant ID from query: ${queryTenantId}`);
    return queryTenantId;
  }
  
  // Option 4: Extract from subdomain, but exclude localhost
  const host = req.headers.host;
  if (host && !host.includes('localhost')) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      console.log(`Extracted tenant ID from subdomain: ${subdomain}`);
      return subdomain;
    }
  }
  
  // Default to 'default' tenant
  console.log(`No tenant ID found, using default tenant`);
  return 'default';
};

/**
 * Get all active tenant connections
 * @returns {Map} Map of tenant connections
 */
const getActiveTenantConnections = () => {
  return tenantConnections;
};

/**
 * Manually switch to a specific tenant database
 * @param {String} tenantId - Tenant ID to switch to
 * @returns {Promise<Connection>} Mongoose connection to tenant database
 */
const switchTenant = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required for switching');
  }
  
  return await getConnectionForTenant(tenantId);
};

module.exports = {
  getConnectionForTenant,
  closeAllConnections,
  extractTenantId,
  getActiveTenantConnections,
  switchTenant
}; 