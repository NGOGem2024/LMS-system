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
  // Check if model exists on this connection
  if (connection.models[modelName]) {
    return connection.models[modelName];
  }
  
  // If model doesn't exist, try to register it
  try {
    // Get model schema from file
    const modelPath = path.join(__dirname, `${modelName}.js`);
    
    // Check if file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file for ${modelName} not found`);
    }
    
    // Special handling for Certification model which exports multiple models
    if (modelName === 'Certification') {
      const certModule = require(modelPath);
      return certModule.Certification;
    }
    
    // Get model from model file - try different export patterns
    const modelModule = require(modelPath);
    
    // Handle different export patterns
    if (modelModule.schema) {
      // Direct schema export
      return connection.model(modelName, modelModule.schema);
    } else if (typeof modelModule === 'function' && modelModule.modelName) {
      // Model export
      return modelModule;
    } else {
      // Default mongoose model pattern
      return connection.model(modelName);
    }
  } catch (err) {
    console.error(`Error getting model ${modelName}: ${err.message}`);
    throw err;
  }
};

/**
 * Get all models for a tenant connection
 * @param {Object} connection - Mongoose connection
 * @returns {Object} Object with all models
 */
const getModels = (connection) => {
  const models = {};
  const modelFiles = fs.readdirSync(__dirname)
    .filter(file => file !== 'index.js' && file.endsWith('.js'));
  
  for (const file of modelFiles) {
    const modelName = file.split('.')[0];
    try {
      models[modelName] = getModel(connection, modelName);
      console.log(`Model ${modelName} registered for tenant connection`);
    } catch (err) {
      console.error(`Error registering model ${modelName}: ${err.message}`);
    }
  }
  
  return models;
};

module.exports = {
  getModel,
  getModels
}; 