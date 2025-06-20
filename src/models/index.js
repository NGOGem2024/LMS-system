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
    
    // Get schema from model file
    const modelSchema = require(modelPath).schema;
    
    // Register model with this connection
    return connection.model(modelName, modelSchema);
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
    models[modelName] = getModel(connection, modelName);
  }
  
  return models;
};

module.exports = {
  getModel,
  getModels
}; 