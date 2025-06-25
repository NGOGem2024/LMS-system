const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
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
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'multiple'],
    default: 'file'
  },
  submissionLink: {
    type: String
  },
  grade: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned', 'late', 'missing'],
    default: 'submitted'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  gradedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index for student and assignment
AssignmentSubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true });

// Check if submission is late
AssignmentSubmissionSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);
    
    if (assignment && assignment.dueDate) {
      const now = new Date();
      if (now > assignment.dueDate) {
        this.isLate = true;
        this.status = 'late';
      }
    }
    
    next();
  } catch (err) {
    console.error(`Error checking if submission is late: ${err.message}`);
    next(err);
  }
});

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema); 