const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'super_admin'],
    default: 'student'
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  institution: {
    type: mongoose.Schema.ObjectId,
    ref: 'Institution',
    required: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User' 
},
enrolledCourses: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }
],
// isActive: {
//   type: Boolean,
//   default: true
// },
  profile: {
    avatar: String,
    bio: String,
    phone: String,
    address: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String
    }
  }
});

// Create compound index for email and tenantId to ensure email is unique per tenant
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });
console.log('User model: Compound index for email and tenantId created');

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      tenantId: this.tenantId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export both the model (for default connection) and schema (for tenant connections)
const User = mongoose.model('User', UserSchema);
module.exports = User;
module.exports.schema = UserSchema; 