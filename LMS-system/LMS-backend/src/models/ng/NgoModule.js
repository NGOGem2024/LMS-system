const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
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
  duration: {
    type: String,
    required: true
  },
  
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'NgoCourse',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    required: false
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  enrolledUsers: {
    type: Number,
    default: 0
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

// Create compound index for course and order
ModuleSchema.index({ course: 1, order: 1 }, { unique: true });

// Set updatedAt when modified
ModuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Cascade delete content when a module is deleted
ModuleSchema.pre('remove', async function(next) {
  console.log(`Deleting content for module ${this._id}`);
  // Here we would add the logic to delete related content
  // await this.model('ModuleContent').deleteMany({ module: this._id });
  next();
});

const Module = mongoose.model('NgoModule', ModuleSchema);
module.exports = Module;
module.exports.schema = ModuleSchema; 