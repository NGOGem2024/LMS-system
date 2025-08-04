const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['university', 'college', 'school', 'training-center', 'corporate', 'other'],
    default: 'university'
  },
  logo: {
    type: String
  },
  theme: {
  primaryColor: {
    type: String,
    default: '#01d6d4'
  },
  secondaryColor: {
    type: String,
    default: '#164860'
  },
  mode: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  fontFamily: {
    type: String,
    default: 'Roboto'
  },
  customCSS: {
    type: String
  }
},

  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  departments: [{
    name: String,
    head: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  admin: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  studentCount: {
    type: Number,
    default: 0
  },
  facultyCount: {
    type: Number,
    default: 0
  },
  courseCount: {
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

// Set updatedAt before saving
InstitutionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Reverse populate with virtuals
InstitutionSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'institution',
  justOne: false
});

InstitutionSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'institution',
  justOne: false
});

module.exports = mongoose.model('Institution', InstitutionSchema); 