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
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
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

// Reverse populate with virtual content
ModuleSchema.virtual('content', {
  ref: 'ModuleContent',
  localField: '_id',
  foreignField: 'module',
  justOne: false
});

// Reverse populate with virtual assignments
ModuleSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'module',
  justOne: false
});

const Module = mongoose.model('Module', ModuleSchema);
module.exports = Module;
module.exports.schema = ModuleSchema; 