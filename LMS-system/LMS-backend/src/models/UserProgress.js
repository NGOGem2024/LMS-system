const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },

  progress: {
    type: Number, // Percentage
    default: 0,
    min: 0,
    max: 100
  },
  completed: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String
  },
  moduleProgress: [{
    module: {
      type: mongoose.Schema.ObjectId,
      ref: 'Module'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedLessons: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson'
    }],
    completedAssignments: [{
      assignment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assignment'
      },
      submissionDate: Date,
      grade: Number,
      passed: Boolean
    }],
    completedQuizzes: [{
      quiz: {
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz'
      },
      completionDate: Date,
      score: Number,
      passed: Boolean,
      attempts: Number
    }]
  }],
  overallGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
});

// Create compound index for user and course
UserProgressSchema.index({ user: 1, course: 1 }, { unique: true });

// Calculate overall progress before saving
UserProgressSchema.pre('save', function(next) {
  if (this.moduleProgress && this.moduleProgress.length > 0) {
    const totalModules = this.moduleProgress.length;
    const completedModules = this.moduleProgress.filter(module => module.completed).length;
    this.progress = Math.round((completedModules / totalModules) * 100);
    
    // Mark as completed if progress is 100%
    if (this.progress === 100 && !this.completed) {
      this.completed = true;
      this.completionDate = Date.now();
    }
  }
  
  next();
  
});

module.exports = mongoose.model('UserProgress', UserProgressSchema); 