/**
 * Models index file
 * 
 * This file provides utilities for working with models across different tenant connections.
 * It ensures models are properly loaded and accessible regardless of which tenant DB is active.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get a model from a specific tenant connection
 * @param {Object} connection - Mongoose connection
 * @param {String} modelName - Name of the model
 * @returns {Object} Mongoose model
 */
const getModel = (connection, modelName) => {
  try {
    // Check if model exists on this connection
    if (connection.models[modelName]) {
      console.log(`Models: Using existing ${modelName} model from connection`);
      return connection.models[modelName];
    }
    
    console.log(`Models: Registering ${modelName} model for connection`);
    
    // If model doesn't exist, try to register it
    // Get model schema from file
    const modelPath = path.join(__dirname, `${modelName}.js`);
    
    // Check if file exists
    if (!fs.existsSync(modelPath)) {
      console.error(`Models: Model file for ${modelName} not found at ${modelPath}`);
      throw new Error(`Model file for ${modelName} not found`);
    }
    
    try {
      // Special handling for Certification model which exports multiple models
      if (modelName === 'Certification') {
        console.log(`Models: Using special handling for Certification model`);
        const certModule = require(modelPath);
        // Use schema instead of compiled model
        if (certModule.schema) {
          return connection.model(modelName, certModule.schema);
        }
        return certModule.Certification;
      }
      
      // Standard models - always use the schema export to create connection-specific models
      const ModelModule = require(modelPath);
      
      // Use schema if available
      if (ModelModule.schema) {
        console.log(`Models: Creating ${modelName} model using schema export`);
        return connection.model(modelName, ModelModule.schema);
      } else {
        // If no schema is exported, log an error
        console.error(`Models: ${modelName} model does not export a schema property`);
        throw new Error(`Model ${modelName} does not export a schema`);
      }
    } catch (err) {
      console.error(`Models: Error loading model ${modelName}: ${err.message}`);
      throw err;
    }
  } catch (err) {
    console.error(`Models: Error getting model ${modelName}: ${err.message}`);
    console.error(`Models: Error stack: ${err.stack}`);
    throw err;
  }
};

/**
 * Get all models for a tenant connection
 * @param {Object} connection - Mongoose connection
 * @returns {Object} Object with all models
 */
const getModels = (connection) => {
  try {
    // Check if connection is valid
    if (!connection) {
      console.error('Models: Connection is null or undefined');
      throw new Error('Cannot register models on null connection');
    }
    
    // Check connection ID
    const connectionId = connection.id || 'unknown';
    console.log(`Models: Registering all models for connection ${connectionId}`);
    
    if (connection.readyState !== 1) {
      console.error(`Models: Invalid connection state: ${connection.readyState}`);
      throw new Error('Cannot register models on inactive connection');
    }
    
    const models = {};
    const modelFiles = fs.readdirSync(__dirname)
      .filter(file => file !== 'index.js' && file.endsWith('.js'));
    
    console.log(`Models: Found ${modelFiles.length} model files: ${modelFiles.join(', ')}`);
    
    for (const file of modelFiles) {
      const modelName = file.split('.')[0];
      try {
        models[modelName] = getModel(connection, modelName);
        console.log(`Models: Successfully registered ${modelName} model for tenant connection`);
      } catch (err) {
        console.error(`Models: Error registering model ${modelName}: ${err.message}`);
        // Continue with other models even if one fails
      }
    }
    
    console.log(`Models: Registered ${Object.keys(models).length} models for connection`);
    
    return models;
  } catch (err) {
    console.error(`Models: Error registering models: ${err.message}`);
    console.error(`Models: Error stack: ${err.stack}`);
    return {}; // Return empty object to prevent further errors
  }
};

module.exports = {
  getModel,
  getModels
}; 