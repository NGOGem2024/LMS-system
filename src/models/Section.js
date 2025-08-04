const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a chapter name'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    // required: [true, 'Please add a description']
  },
board: {
    type: String,
    // required: [true, 'Please add a board']
  },
  grade: {
    type: String,
    // required: [true, 'Please add a grade']
  },
  medium: {
  type: [String],
//   required: [true, 'Please specify the medium(s)']
},
  // 🔗 Subject (Course) reference
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },

  // 🧩 Topics and Subtopics
  topics: {
    type: [String],
    // required: [true, 'Please add at least one topic']
  },
  subtopics: {
    type: [String],
    
  },

  order: {
    type: Number,
    // required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    // required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Section', SectionSchema);