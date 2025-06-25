const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  module: {
    type: mongoose.Schema.ObjectId,
    ref: 'Module'
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  totalPoints: {
    type: Number,
    required: [true, 'Please add total points'],
    default: 100
  },
  passingPoints: {
    type: Number,
    required: [true, 'Please add passing points'],
    default: 60
  },
  attachments: [{
    name: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  instructions: {
    type: String,
    required: [true, 'Please add instructions']
  },
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'multiple'],
    default: 'file'
  },
  allowedFileTypes: [String],
  maxFileSize: {
    type: Number,
    default: 5 // In MB
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isGraded: {
    type: Boolean,
    default: true
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Set updatedAt when modified
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Reverse populate with virtual submissions
AssignmentSchema.virtual('submissions', {
  ref: 'AssignmentSubmission',
  localField: '_id',
  foreignField: 'assignment',
  justOne: false
});

module.exports = mongoose.model('Assignment', AssignmentSchema); 