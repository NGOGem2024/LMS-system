const Certification = require('../../models/ngoModels/Certifications');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const { getTenantConnection } = require('../../config/db');

// Helper function to get model with proper connection
const getCertificationModel = async (tenantId) => {
  const conn = await getTenantConnection('ngo'); // or use tenantId if dynamic
  return conn.model('Certification', Certification.schema);
};

// @desc    Get all certificates (with pagination, filtering, and lean queries)
// @route   GET /api/ngo/certificates
exports.getCertifications = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 25, verified, user, course } = req.query;
    const skip = (page - 1) * limit;

    // Get the model with proper connection
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    const query = { tenantId: req.user.tenantId };
    
    // Add optional filters
    if (verified !== undefined) query.verified = verified === 'true';
    if (user) query.user = user;
    if (course) query.course = course;

    const [certificates, count] = await Promise.all([
      CertificationModel.find(query)
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .maxTimeMS(15000)
        .exec(),
        
      CertificationModel.countDocuments(query)
        .maxTimeMS(15000)
        .exec()
    ]);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: certificates
    });
  } catch (err) {
    console.error('Get certifications error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database query timeout. Please try again or use more specific filters', 408));
    }
    if (err.name === 'MongoNetworkError') {
      return next(new ErrorResponse('Database connection error. Please try again', 503));
    }
    next(err);
  }
});

// @desc    Get single certificate (with optimized query)
// @route   GET /api/ngo/certificates/:id
exports.getCertification = asyncHandler(async (req, res, next) => {
  try {
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    const certificate = await CertificationModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .lean()
    .maxTimeMS(10000)
    .exec();

    if (!certificate) {
      return next(new ErrorResponse('Certificate not found', 404));
    }
    
    res.status(200).json({ success: true, data: certificate });
  } catch (err) {
    console.error('Get certificate error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database operation timeout', 408));
    }
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid certificate ID format', 400));
    }
    next(err);
  }
});

// @desc    Create certificate (with automatic certificate ID generation)
// @route   POST /api/ngo/certificates
exports.createCertification = asyncHandler(async (req, res, next) => {
  try {
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    req.body.tenantId = req.user.tenantId;
    
    // Generate certificate ID if not provided
    if (!req.body.certificateId) {
      req.body.certificateId = generateCertificateId();
    }

    // Create with timeout and proper error handling
    const certificate = await CertificationModel.create(req.body);
    
    res.status(201).json({ success: true, data: certificate });
  } catch (err) {
    console.error('Create certification error:', err);
    
    if (err.code === 11000) { // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return next(new ErrorResponse(`Duplicate ${field}. This value already exists.`, 400));
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database operation timeout. Please try again.', 408));
    }
    
    if (err.name === 'MongoNetworkError') {
      return next(new ErrorResponse('Database connection error. Please try again.', 503));
    }
    
    next(err);
  }
});

// @desc    Update certificate (with field protection)
// @route   PUT /api/ngo/certificates/:id
exports.updateCertification = asyncHandler(async (req, res, next) => {
  try {
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    // Protect immutable fields
    const { certificateId, tenantId, user, course, createdAt, ...updateData } = req.body;

    const certificate = await CertificationModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        ...updateData,
        updatedAt: Date.now()
      },
      { 
        new: true,
        runValidators: true,
        maxTimeMS: 15000
      }
    ).exec();

    if (!certificate) {
      return next(new ErrorResponse('Certificate not found', 404));
    }

    res.status(200).json({ success: true, data: certificate });
  } catch (err) {
    console.error('Update certification error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Update operation timeout', 408));
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid certificate ID format', 400));
    }
    
    next(err);
  }
});

// @desc    Verify certificate (with audit tracking)
// @route   PUT /api/ngo/certificates/:id/verify
exports.verifyCertification = asyncHandler(async (req, res, next) => {
  try {
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    const certificate = await CertificationModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        verified: true,
        verifiedBy: req.user.id,
        verifiedAt: Date.now(),
        updatedAt: Date.now()
      },
      { 
        new: true,
        maxTimeMS: 15000
      }
    ).exec();

    if (!certificate) {
      return next(new ErrorResponse('Certificate not found', 404));
    }

    res.status(200).json({ success: true, data: certificate });
  } catch (err) {
    console.error('Verify certification error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Verification timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Delete certificate (with confirmation)
// @route   DELETE /api/ngo/certificates/:id
exports.deleteCertification = asyncHandler(async (req, res, next) => {
  try {
    const CertificationModel = await getCertificationModel(req.user.tenantId);
    
    const certificate = await CertificationModel.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .maxTimeMS(15000)
    .exec();

    if (!certificate) {
      return next(new ErrorResponse('Certificate not found', 404));
    }

    res.status(200).json({ 
      success: true, 
      data: {},
      message: 'Certificate deleted successfully'
    });
  } catch (err) {
    console.error('Delete certification error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Deletion timeout', 408));
    }
    
    next(err);
  }
});

// Helper function to generate certificate ID
function generateCertificateId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}