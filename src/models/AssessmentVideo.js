const mongoose = require('mongoose');

const AssessmentVideo = new mongoose.Schema({
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  section: {
    type: mongoose.Schema.ObjectId,
    ref: 'Section',
    required: true
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
  topic: {
    type: String,
    // required: [true, 'Please provide a topic']
  },
  subtopic: {
    type: String,
    // required: [true, 'Please provide a subtopic']
  },
  ytId: {
    type: String,
    required: [true, 'Please provide the YouTube video ID']
  },
  url: {
    type: String,
    required: [true, 'Please provide the YouTube video URL']
  },

  // 👇 Embedded quiz specific to this video
  quiz: [
    {
      question: {
        type: String,
        required: true
      },
      options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, required: true },
        d: { type: String, required: true }
      },
      correctAnswer: {
        type: String,
        enum: ['a', 'b', 'c', 'd'],
        required: true
      },
      explaination: {
        type: String,
        required: true
      },
    }
  ],

  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt when modified
AssessmentVideo.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AssessmentVideo', AssessmentVideo);