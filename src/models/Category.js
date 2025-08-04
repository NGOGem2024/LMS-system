const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
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
    // required: [true, 'Please add a description']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters']
  },
  duration: {
    type: Number,
    // required: [true, 'Please add course duration in weeks']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    // required: [true, 'Please add a category']
  },

  // ⭐ Learnomic-specific fields
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

  tags: [String],
  thumbnail: {
    type: String,
    default: 'no-photo.jpg',
    required: [true, 'Please add a thumbnail']
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
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
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

CategorySchema.pre('save', function(next) {
  this.slug = this.title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
  
  this.updatedAt = Date.now();
  next();
});

CategorySchema.pre('remove', async function(next) {
//   console.log(Deleting modules, lessons and assignments for course ${this._id});
  next();
});

CategorySchema.virtual('sections', {
  ref: 'Section',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

module.exports = mongoose.model('Category', CategorySchema);