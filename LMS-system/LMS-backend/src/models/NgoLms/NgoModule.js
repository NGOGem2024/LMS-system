
const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a module title'],
    trim: true,
    maxlength: [100, 'Module title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a module description']
  },
  duration: {
    type: String,
    required: [true, 'Please add module duration'],
    default: '0 min'
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  videoUrl: String,
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'doc', 'ppt', 'link', 'other']
    }
  }],
  learningOutcomes: [String],
  order: {
    type: Number,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
}, {
  timestamps: true
});
module.exports = mongoose.models.NgoModule || mongoose.model('NgoModule', ModuleSchema);