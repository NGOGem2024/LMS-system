const mongoose = require('mongoose');

const ModuleContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  module: {
    type: mongoose.Schema.ObjectId,
    ref: 'Module',
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  contentType: {
    type: String,
    enum: ['video', 'document', 'quiz', 'text', 'link', 'html', 'image'],
    required: [true, 'Please specify content type']
  },
  content: {
    // For text, html, or link content
    text: String,
    html: String,
    url: String,
    
    // For video content
    videoUrl: String,
    videoDuration: Number, // in seconds
    videoProvider: {
      type: String,
      enum: ['youtube', 'vimeo', 'internal', 'other']
    },
    
    // For document content
    fileUrl: String,
    fileType: String,
    fileSize: Number, // in bytes
    
    // For image content
    imageUrl: String,
    
    // For quiz content
    quizId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quiz'
    }
  },
  order: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
});

// Create compound index for module and order
ModuleContentSchema.index({ module: 1, order: 1 }, { unique: true });

// Set updatedAt when modified
ModuleContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ModuleContent = mongoose.model('ModuleContent', ModuleContentSchema);
module.exports = ModuleContent;
module.exports.schema = ModuleContentSchema; 