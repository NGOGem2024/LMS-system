const mongoose = require('mongoose');

const CourseSchemaa = new mongoose.Schema({
  // Core Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },

  // NGO-Specific Metadata
  category: {
    type: String,
    required: true,
    enum: [
      'Vocational Training',
      'Health Awareness',
      'Women Empowerment',
      'Digital Literacy',
      'Community Development'
    ], // Only these values will be accepted
    default: 'Vocational Training'
  },
  difficultyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'], // Restricted values
    default: 'Beginner'
  },

  // Access Control
  isPublic: {
    type: Boolean,
    default: false // Default to private course
  },
  certificationAvailable: {
    type: Boolean,
    default: false
  },

  // Content Structure (all optional)
  chapters: [{
    title: String,
    description: String,
    sequence: Number,
    topics: [{
      title: String,
      content: {
        videos: [{
          title: String,
          url: String,
          duration: Number // in minutes
        }],
        readings: [{
          title: String,
          content: String
        }]
      }
    }]
  }],

  // Management Fields
  thumbnail: String,
  language: {
    type: String,
    default: 'English'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Tenant Isolation
  tenantId: {
    type: String,
    required: true
  },

  // Automatic Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { 
  timestamps: { createdAt: true, updatedAt: true } 
});

// Indexes for better performance
CourseSchemaa.index({ title: 'text', description: 'text' }); // For search
CourseSchemaa.index({ tenantId: 1, isActive: 1 }); // For quick filtering

module.exports = mongoose.model('Courses', CourseSchemaa);
