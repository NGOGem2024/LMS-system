// models/Documentation.js
const mongoose = require('mongoose');

const documentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  slug: {
    type: String,
    unique: true
    // Remove 'required: true' if you're auto-generating
  },

  content: {
    type: String,
    default: ''
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isPublished: {
    type: Boolean,
    default: false
  },

  sections: [{
    title: String,
    content: String,
    order: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Documentation', documentationSchema);