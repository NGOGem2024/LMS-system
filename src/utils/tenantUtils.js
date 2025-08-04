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
 * Get or create a connection for a specific tenant with retry logic
 * @param {String} tenantId - Tenant ID
 * @param {Number} retries - Number of retries (default: 3)
 * @returns {Promise<Connection>} Mongoose connection
 */
const getConnectionForTenant = async (tenantId, retries = 3) => {
  // Check if a connection already exists
  if (tenantConnections.has(tenantId)) {
    const existingConnection = tenantConnections.get(tenantId);
    
    // If connection is open (readyState 1), reuse it
    if (existingConnection && existingConnection.readyState === 1) {
      console.log(`Reusing existing connection for tenant: ${tenantId}`);
      return existingConnection;
    } 
    // If connection is connecting (readyState 2), wait for it
    else if (existingConnection && existingConnection.readyState === 2) {
      console.log(`Waiting for existing connection for tenant: ${tenantId}`);
      try {
        // Wait for the connection to be established
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 10000); // 10 second timeout
          
          existingConnection.once('connected', () => {
            clearTimeout(timeoutId);
            resolve();
          });
          
          existingConnection.once('error', (err) => {
            clearTimeout(timeoutId);
            reject(err);
          });
        });
        
        console.log(`Connection ready for tenant: ${tenantId}`);
        return existingConnection;
      } catch (err) {
        console.error(`Error waiting for connection: ${err.message}`);
        tenantConnections.delete(tenantId);
        // Continue to create a new connection
      }
    }
    // If connection is closed, disconnected, or disconnecting, remove it from the map
    else {
      console.log(`Removing stale connection for tenant: ${tenantId}, state: ${existingConnection ? existingConnection.readyState : 'null'}`);
      tenantConnections.delete(tenantId);
    }
  }
  
  // Create a new connection with retry logic
  console.log(`Creating new connection for tenant: ${tenantId}`);
  
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connection attempt ${attempt}/${retries} for tenant ${tenantId}`);
      const connection = await getTenantConnection(tenantId);
      
      if (!connection || connection.readyState !== 1) {
        console.error(`Failed to establish valid connection for tenant ${tenantId}, readyState: ${connection ? connection.readyState : 'null'}`);
        throw new Error('Failed to establish database connection');
      }
      
      // Store the connection in the map
      tenantConnections.set(tenantId, connection);
      
      // Register connection event handlers
      if (connection && typeof connection.on === 'function') {
        connection.on('error', (err) => {
          console.error(`Connection error for tenant ${tenantId}: ${err.message}`);
        });
        
        connection.on('disconnected', () => {
          console.log(`Connection disconnected for tenant: ${tenantId}`);
          // Remove from map on disconnection
          if (tenantConnections.get(tenantId) === connection) {
            tenantConnections.delete(tenantId);
          }
        });
        
        // Add reconnect handler
        connection.on('reconnected', () => {
          console.log(`Connection reconnected for tenant: ${tenantId}`);
        });
      }
      
      // Register models for this connection - only register if they don't already exist
      if (Object.keys(connection.models || {}).length === 0) {
        try {
          const { getModels } = require('../models');
          const models = getModels(connection);
          console.log(`Models registered for tenant ${tenantId}: ${Object.keys(models).length}`);
        } catch (modelErr) {
          console.error(`Error registering models for tenant ${tenantId}: ${modelErr.message}`);
          // Continue even if model registration fails, might work with existing models
        }
      } else {
        console.log(`Connection already has ${Object.keys(connection.models).length} models registered`);
      }
      
      return connection;
    } catch (err) {
      lastError = err;
      console.error(`Error creating connection for tenant ${tenantId} (attempt ${attempt}/${retries}): ${err.message}`);
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`All ${retries} connection attempts failed for tenant ${tenantId}`);
  throw lastError || new Error(`Failed to connect to database for tenant ${tenantId} after ${retries} attempts`);
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
 * Get all active connections
 * @returns {Object} Object containing connection info
 */
const getConnectionInfo = () => {
  const result = {};
  
  for (const [tenantId, connection] of tenantConnections.entries()) {
    result[tenantId] = {
      readyState: connection.readyState,
      host: connection.host,
      name: connection.name,
      models: Object.keys(connection.models || {}).length
    };
  }
  
  return result;
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
    return tenantHeader;
  }
  
  // Option 2: Extract from JWT token
  const tokenTenantId = req.user ? req.user.tenantId : null;
  if (tokenTenantId) {
    return tokenTenantId;
  }
  
  // Option 3: Extract from query parameter
  const queryTenantId = req.query ? req.query.tenantId : null;
  if (queryTenantId) {
    return queryTenantId;
  }
  
  // Option 4: Extract from subdomain, but exclude localhost
  const host = req.headers.host;
  if (host && !host.includes('localhost')) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }
  
  // Default to 'default' tenant
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
  switchTenant,
  getConnectionInfo
}; 