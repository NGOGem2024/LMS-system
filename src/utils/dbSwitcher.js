/**
 * Database Switcher Utility
 * 
 * This utility provides functions to manually switch between different databases
 * in the multi-tenant architecture.
 */

const { switchTenant, getActiveTenantConnections } = require('./tenantUtils');

/**
 * Switch to a specific database by tenant ID
 * @param {String} tenantId - ID of the tenant to switch to (e.g., 'ngo' for NgoLms database)
 * @returns {Promise<Object>} Result object with success status and connection info
 */
const switchToDatabase = async (tenantId) => {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'Tenant ID is required'
      };
    }
    
    const connection = await switchTenant(tenantId);
    
    return {
      success: true,
      message: `Successfully switched to ${tenantId} database`,
      connection: {
        host: connection.connection.host,
        database: connection.connection.name,
        readyState: connection.connection.readyState
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to switch database: ${error.message}`
    };
  }
};

/**
 * Get information about all active database connections
 * @returns {Object} Object containing information about active connections
 */
const getActiveConnections = () => {
  const connections = getActiveTenantConnections();
  const result = {};
  
  for (const [tenantId, connection] of connections.entries()) {
    result[tenantId] = {
      host: connection.connection.host,
      database: connection.connection.name,
      readyState: connection.connection.readyState
    };
  }
  
  return {
    success: true,
    activeConnections: result,
    count: connections.size
  };
};

module.exports = {
  switchToDatabase,
  getActiveConnections
}; 