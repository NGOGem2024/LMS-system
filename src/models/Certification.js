const mongoose = require('mongoose');

const CertificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  issuer: {
    type: String,
    required: [true, 'Please add an issuer']
  },
  validityPeriod: {
    type: Number, // In months
    default: 12
  },
  courses: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  }],
  requiredScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  skills: [String],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  image: {
    type: String
  },
  template: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
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

// Set updatedAt before saving
CertificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for issued certifications
CertificationSchema.virtual('issued', {
  ref: 'IssuedCertification',
  localField: '_id',
  foreignField: 'certification',
  justOne: false
});

// IssuedCertification sub-schema (usually would be a separate model)
const IssuedCertificationSchema = new mongoose.Schema({
  certification: {
    type: mongoose.Schema.ObjectId,
    ref: 'Certification',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  verificationLink: {
    type: String
  },
  score: {
    type: Number
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  }
});

// Calculate expiry date based on validity period
IssuedCertificationSchema.pre('save', async function(next) {
  if (!this.expiryDate && this.issueDate) {
    try {
      const certification = await mongoose.model('Certification').findById(this.certification);
      if (certification && certification.validityPeriod) {
        const expiryDate = new Date(this.issueDate);
        expiryDate.setMonth(expiryDate.getMonth() + certification.validityPeriod);
        this.expiryDate = expiryDate;
      }
    } catch (err) {
      console.error(`Error calculating expiry date: ${err.message}`);
    }
  }
  next();
});

// Create compound index for user and certification
IssuedCertificationSchema.index({ user: 1, certification: 1 }, { unique: true });

const IssuedCertification = mongoose.model('IssuedCertification', IssuedCertificationSchema);

module.exports = {
  Certification: mongoose.model('Certification', CertificationSchema),
  IssuedCertification
}; 