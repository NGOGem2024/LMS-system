const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    required: true
  },
  student: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number
  },
  passed: {
    type: Boolean
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId
    },
    selectedOptions: [{
      type: String
    }],
    textAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    pointsAwarded: {
      type: Number,
      default: 0
    }
  }],
  feedback: {
    type: String
  },
  timeSpent: {
    type: Number // in seconds
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

// Create compound index for quiz and student
QuizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 }, { unique: true });

// Calculate score and pass/fail status before saving
QuizAttemptSchema.pre('save', async function(next) {
  // Only calculate if completed and not already calculated
  if (this.completed && !this.score) {
    try {
      // Get the quiz to access questions and passing score
      const Quiz = mongoose.model('Quiz');
      const quiz = await Quiz.findById(this.quiz);
      
      if (!quiz) {
        return next(new Error('Quiz not found'));
      }
      
      // Calculate total points earned
      let totalPointsEarned = 0;
      
      this.answers.forEach(answer => {
        totalPointsEarned += answer.pointsAwarded;
      });
      
      // Calculate percentage score
      this.score = quiz.totalPoints > 0 
        ? Math.round((totalPointsEarned / quiz.totalPoints) * 100) 
        : 0;
      
      // Determine if passed
      this.passed = this.score >= quiz.passingScore;
      
      // Calculate time spent if endTime exists
      if (this.endTime) {
        this.timeSpent = Math.round((this.endTime - this.startTime) / 1000);
      }
    } catch (err) {
      return next(err);
    }
  }
  
  next();
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema); 