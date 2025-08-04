const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String
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
  timeLimit: {
    type: Number, // In minutes
    default: 30
  },
  passingScore: {
    type: Number,
    required: [true, 'Please add a passing score'],
    default: 60
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  attemptLimit: {
    type: Number,
    default: 1
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  questions: [{
    questionText: {
      type: String,
      required: [true, 'Please add a question']
    },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'matching', 'fill-in-blanks'],
      default: 'multiple-choice'
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    correctAnswer: {
      type: String
    },
    explanation: {
      type: String
    },
    points: {
      type: Number,
      default: 1
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  }],
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
QuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total points based on question points
QuizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  }
  next();
});

// Reverse populate with virtual attempts
QuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
  justOne: false
});

module.exports = mongoose.model('Quiz', QuizSchema); 