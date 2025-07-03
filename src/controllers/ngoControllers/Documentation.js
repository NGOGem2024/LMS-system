const Documentation = require('../../models/ngoModels/Documentation');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const { generateSlug } = require('../../utils/slugHelper');
const { getTenantConnection } = require('../../config/db');

// Helper function to get model with proper connection
const getDocumentationModel = async (tenantId) => {
  const conn = await getTenantConnection('ngo'); // or use tenantId if dynamic
  return conn.model('Documentation', Documentation.schema);
};

// @desc    Get all documentation (updated to match your model structure)
// @route   GET /api/ngo/docs
exports.getAllDocumentation = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 25, isPublished } = req.query;
    const skip = (page - 1) * limit;

    // Get the model with proper connection
    const DocumentationModel = await getDocumentationModel(req.user?.tenantId || 'default');
    
    // Build query based on your actual model structure
    const query = {};
    
    // Add optional filters (only those that exist in your model)
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const [docs, count] = await Promise.all([
      DocumentationModel.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .maxTimeMS(15000)
        .exec(),
        
      DocumentationModel.countDocuments(query)
        .maxTimeMS(15000)
        .exec()
    ]);

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: docs,
      message: count === 0 ? 'No documentation found. Create your first documentation entry!' : undefined
    });
  } catch (err) {
    console.error('Get all documentation error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database query timeout. Please try again', 408));
    }
    if (err.name === 'MongoNetworkError') {
      return next(new ErrorResponse('Database connection error. Please try again', 503));
    }
    next(err);
  }
});

// @desc    Get documentation by course (with optimized query)
// @route   GET /api/ngo/docs/course/:courseId
exports.getDocumentationByCourse = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    const docs = await DocumentationModel.find({ 
      course: req.params.courseId,
      tenantId: req.user.tenantId 
    })
    .populate('createdBy', 'name email')
    .populate('course', 'title slug')
    .lean()
    .maxTimeMS(15000)
    .exec();

    // Return empty array with success if no documents found
    if (!docs || docs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: `No documentation found for course ${req.params.courseId}`
      });
    }

    res.status(200).json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (err) {
    console.error('Get documentation by course error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database query timeout', 408));
    }
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid course ID format', 400));
    }
    next(err);
  }
});

// @desc    Create documentation (with automatic slug generation and tenant handling)
// @route   POST /api/ngo/docs
exports.createDocumentation = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    const { title, content, version, isPublished, sections, course } = req.body;

    // Add tenant ID and creator
    req.body.tenantId = req.user.tenantId;
    req.body.createdBy = req.user.id;

    // Generate slug from title if not provided
    const slug = req.body.slug || generateSlug(title);
    req.body.slug = slug;

    // Set defaults
    req.body.content = content || '';
    req.body.version = version || '1.0.0';
    req.body.isPublished = isPublished || false;
    req.body.sections = sections || [];

    // Create with timeout and proper error handling
    const documentation = await DocumentationModel.create(req.body);

    res.status(201).json({
      success: true,
      data: documentation
    });
  } catch (err) {
    console.error('Create documentation error:', err);
    
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

// @desc    Get single documentation (with optimized query)
// @route   GET /api/ngo/docs/:id
exports.getDocumentationById = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    const doc = await DocumentationModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .populate('createdBy', 'name email')
    .populate('course', 'title slug')
    .lean()
    .maxTimeMS(10000)
    .exec();

    if (!doc) {
      return next(new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (err) {
    console.error('Get documentation by ID error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database operation timeout', 408));
    }
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid documentation ID format', 400));
    }
    next(err);
  }
});

// @desc    Update documentation (with field protection and authorization)
// @route   PUT /api/ngo/docs/:id
exports.updateDocumentation = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    // First find the document to check authorization
    const doc = await DocumentationModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .maxTimeMS(10000)
    .exec();

    if (!doc) {
      return next(new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404));
    }

    // Check authorization
    if (doc.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this documentation`, 401));
    }

    // Protect immutable fields
    const { tenantId, createdBy, createdAt, ...updateData } = req.body;

    // Update slug if title changed
    if (updateData.title) {
      updateData.slug = generateSlug(updateData.title);
    }

    // Add updatedAt timestamp
    updateData.updatedAt = Date.now();

    const updatedDoc = await DocumentationModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      updateData,
      {
        new: true,
        runValidators: true,
        maxTimeMS: 15000
      }
    )
    .populate('createdBy', 'name email')
    .populate('course', 'title slug')
    .exec();

    res.status(200).json({
      success: true,
      data: updatedDoc
    });
  } catch (err) {
    console.error('Update documentation error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Update operation timeout', 408));
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid documentation ID format', 400));
    }
    
    next(err);
  }
});

// @desc    Delete documentation (with authorization and confirmation)
// @route   DELETE /api/ngo/docs/:id
exports.deleteDocumentation = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    // First find the document to check authorization
    const doc = await DocumentationModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .maxTimeMS(10000)
    .exec();

    if (!doc) {
      return next(new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404));
    }

    // Check authorization
    if (doc.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this documentation`, 401));
    }

    // Delete the document
    await DocumentationModel.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .maxTimeMS(15000)
    .exec();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Documentation deleted successfully'
    });
  } catch (err) {
    console.error('Delete documentation error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Deletion timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Get documentation by slug (public route optimization)
// @route   GET /api/ngo/docs/slug/:slug
exports.getDocumentationBySlug = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user?.tenantId || 'default');
    
    const doc = await DocumentationModel.findOne({
      slug: req.params.slug,
      isPublished: true,
      tenantId: req.user?.tenantId || 'default'
    })
    .populate('createdBy', 'name email')
    .populate('course', 'title slug')
    .lean()
    .maxTimeMS(10000)
    .exec();

    if (!doc) {
      return next(new ErrorResponse(`Documentation not found with slug of ${req.params.slug}`, 404));
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (err) {
    console.error('Get documentation by slug error:', err);
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database operation timeout', 408));
    }
    next(err);
  }
});

// @desc    Publish/Unpublish documentation
// @route   PUT /api/ngo/docs/:id/publish
exports.togglePublishDocumentation = asyncHandler(async (req, res, next) => {
  try {
    const DocumentationModel = await getDocumentationModel(req.user.tenantId);
    
    const doc = await DocumentationModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .maxTimeMS(10000)
    .exec();

    if (!doc) {
      return next(new ErrorResponse(`Documentation not found with id of ${req.params.id}`, 404));
    }

    // Check authorization
    if (doc.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to publish this documentation`, 401));
    }

    const updatedDoc = await DocumentationModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        isPublished: !doc.isPublished,
        updatedAt: Date.now()
      },
      {
        new: true,
        maxTimeMS: 15000
      }
    )
    .populate('createdBy', 'name email')
    .populate('course', 'title slug')
    .exec();

    res.status(200).json({
      success: true,
      data: updatedDoc,
      message: `Documentation ${updatedDoc.isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (err) {
    console.error('Toggle publish documentation error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Publish operation timeout', 408));
    }
    
    next(err);
  }
});