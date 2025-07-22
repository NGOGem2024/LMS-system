const mongoose = require('mongoose');

const NgoCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: mongoose.Schema.ObjectId,
    ref: 'Institution'
  },
  iconName: {  // Changed from 'icon' to store icon identifier (e.g., "Users", "Target")
    type: String,
    required: true,
    enum: ['Users', 'Target', 'Video', 'FileText'] // Add all Lucide icons used
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
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
  toJSON: { virtuals: true, id: false },
  toObject: { virtuals: true, id: false }
});

// Create course slug from the title
NgoCourseSchema.pre('save', function(next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
  
  this.updatedAt = Date.now();
  next();
});

// Cascade delete modules, lessons and assignments when a course is deleted
NgoCourseSchema.pre('remove', async function(next) {
  console.log(`Deleting modules, lessons and assignments for course ${this._id}`);
  // Here we would add the logic to delete related documents
  // await this.model('Module').deleteMany({ course: this._id });
  next();
});

// Reverse populate with virtual

NgoCourseSchema.virtual('modules', {
  ref: 'NgoModule',
  localField: '_id',
  foreignField: 'courseId',
  justOne: false
});
// Calculate progress automatically
NgoCourseSchema.virtual('calculatedProgress').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  const completedCount = this.modules.filter(m => m.isCompleted).length;
  return Math.round((completedCount / this.modules.length) * 100);
});

module.exports = mongoose.model('NgoCourse', NgoCourseSchema); 
