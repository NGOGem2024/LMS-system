const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  certificateId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  issuedDate: { 
    type: Date, 
    default: Date.now 
  },
  issuedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  downloadUrl: { 
    type: String 
  },
  // Additional fields that might be useful
  expiryDate: {
    type: Date
  },
  verificationLink: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  // Tenant isolation field
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable virtuals when converting to JSON or objects
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  // Create indexes
  autoIndex: true
});

// Update the updatedAt field before saving
CertificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for user and course to prevent duplicates
CertificationSchema.index({ user: 1, course: 1, tenantId: 1 }, { unique: true });

// Index for certificateId for faster lookups
CertificationSchema.index({ certificateId: 1, tenantId: 1 });

// Index for issuedBy for querying certificates by institution
CertificationSchema.index({ issuedBy: 1, tenantId: 1 });

// Virtual population for user details (if needed)
CertificationSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual population for course details (if needed)
CertificationSchema.virtual('courseDetails', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true
});

// Virtual population for issuer details (if needed)
CertificationSchema.virtual('issuerDetails', {
  ref: 'Institution',
  localField: 'issuedBy',
  foreignField: '_id',
  justOne: true
});

const Certification = mongoose.model('Certification', CertificationSchema);

module.exports = Certification;