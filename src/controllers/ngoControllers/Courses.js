const Course = require('../../models/ngoModels/Courses');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/async');
const { getTenantConnection } = require('../../config/db');

// Helper function to get model with proper connection
const getCourseModel = async (tenantId) => {
  const conn = await getTenantConnection('ngo'); // or use tenantId if dynamic
  return conn.model('Course', Course.schema);
};

// @desc    Get all NGO courses (with pagination and optimized queries)
// @route   GET /api/ngo/courses
exports.getCourses = asyncHandler(async (req, res, next) => {
  try {
    const { 
      category, 
      isPublic, 
      isActive, 
      status,
      level,
      page = 1, 
      limit = 20,
      sort = '-createdAt',
      search
    } = req.query;
    
    const skip = (page - 1) * limit;
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    const query = { tenantId: req.user.tenantId };
    
    // Optional filters
    if (category) query.category = category;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (status) query.status = status;
    if (level) query.level = level;
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const [courses, count] = await Promise.all([
      CourseModel.find(query)
        .select('-chapters.topics.subtopics.videos -chapters.topics.subtopics.documents') // Exclude heavy nested data
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .maxTimeMS(15000)
        .exec(),
        
      CourseModel.countDocuments(query)
        .maxTimeMS(10000)
        .exec()
    ]);

    res.status(200).json({ 
      success: true, 
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: courses 
    });
  } catch (err) {
    console.error('Get courses error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database query timeout. Please try with more specific filters', 408));
    }
    
    if (err.name === 'MongoNetworkError') {
      return next(new ErrorResponse('Database connection error. Please try again', 503));
    }
    
    next(err);
  }
});

// @desc    Get single NGO course (with full details)
// @route   GET /api/ngo/courses/:id
exports.getCourse = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    const course = await CourseModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .populate('instructors.user', 'name email')
    .lean()
    .maxTimeMS(15000)
    .exec();

    if (!course) {
      return next(new ErrorResponse(`Course not found with id ${req.params.id}`, 404));
    }
    
    // Increment view count (fire and forget)
    CourseModel.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'stats.totalViews': 1 } }
    ).exec().catch(err => console.error('View count update error:', err));
    
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    console.error('Get course error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Database operation timeout', 408));
    }
    
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid course ID format', 400));
    }
    
    next(err);
  }
});

// @desc    Create NGO course (with validation and defaults)
// @route   POST /api/ngo/courses
exports.createCourse = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    // Add tenant and creator
    req.body.tenantId = req.user.tenantId;
    
    // Add creator as primary instructor if not specified
    if (!req.body.instructors || req.body.instructors.length === 0) {
      req.body.instructors = [{
        user: req.user.id,
        role: 'Primary Instructor'
      }];
    }
    
    // Set default values
    if (!req.body.status) req.body.status = 'Draft';
    if (!req.body.level) req.body.level = 'Beginner';
    if (req.body.pricing && req.body.pricing.isFree === undefined) {
      req.body.pricing.isFree = true;
    }
    
    const course = await CourseModel.create(req.body);
    
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    console.error('Create course error:', err);
    // Duplicate key error
    if (err.code === 11000) { 
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

// @desc    Update NGO course (with field protection)
// @route   PUT /api/ngo/courses/:id
exports.updateCourse = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    // Protect certain fields from being updated
    const { tenantId, createdAt, stats, ...updateData } = req.body;
    
    // Add updatedAt timestamp
    updateData.updatedAt = Date.now();
    
    const course = await CourseModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        maxTimeMS: 20000
      }
    ).exec();

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }
    
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    console.error('Update course error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Update operation timeout', 408));
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    if (err.name === 'CastError') {
      return next(new ErrorResponse('Invalid course ID format', 400));
    }
    
    next(err);
  }
});

// @desc    Update course status
// @route   PATCH /api/ngo/courses/:id/status
exports.updateCourseStatus = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Draft', 'Under Review', 'Published', 'Archived', 'Suspended'];
    if (!validStatuses.includes(status)) {
      return next(new ErrorResponse('Invalid status value', 400));
    }
    
    const course = await CourseModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true, maxTimeMS: 15000 }
    ).exec();

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }
    
    res.status(200).json({ 
      success: true, 
      data: course,
      message: `Course status updated to ${status}`
    });
  } catch (err) {
    console.error('Update course status error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Status update timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Toggle course public status
// @route   PATCH /api/ngo/courses/:id/public-status
exports.togglePublicStatus = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    const course = await CourseModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        isPublic: req.body.isPublic,
        updatedAt: Date.now()
      },
      { new: true, maxTimeMS: 15000 }
    ).exec();

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }
    
    res.status(200).json({ 
      success: true, 
      data: course,
      message: `Course is now ${course.isPublic ? 'public' : 'private'}`
    });
  } catch (err) {
    console.error('Toggle public status error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Public status update timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Add/Update course content (chapters, topics, etc.)
// @route   PUT /api/ngo/courses/:id/content
exports.updateCourseContent = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    const { chapters } = req.body;
    
    const course = await CourseModel.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { 
        chapters,
        updatedAt: Date.now()
      },
      { 
        new: true, 
        runValidators: true,
        maxTimeMS: 25000 // Longer timeout for content updates
      }
    ).exec();

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }
    
    res.status(200).json({ 
      success: true, 
      data: course,
      message: 'Course content updated successfully'
    });
  } catch (err) {
    console.error('Update course content error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Content update timeout. Try updating smaller sections.', 408));
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorResponse(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    next(err);
  }
});

// @desc    Get course analytics
// @route   GET /api/ngo/courses/:id/analytics
exports.getCourseAnalytics = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    
    const course = await CourseModel.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    .select('title stats enrollment')
    .lean()
    .maxTimeMS(10000)
    .exec();

    if (!course) {
      return next(new ErrorResponse('Course not found', 404));
    }
    
    // Calculate additional metrics
    const analytics = {
      course: {
        id: course._id,
        title: course.title
      },
      stats: course.stats,
      enrollment: course.enrollment,
      completionRate: course.stats.totalEnrollments > 0 
        ? ((course.stats.totalCompletions / course.stats.totalEnrollments) * 100).toFixed(2)
        : 0,
      engagementRate: course.stats.totalViews > 0 
        ? ((course.stats.totalEnrollments / course.stats.totalViews) * 100).toFixed(2)
        : 0
    };
    
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error('Get course analytics error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Analytics query timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Delete NGO course (soft delete with confirmation)
// @route   DELETE /api/ngo/courses/:id
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    const { permanent } = req.query;
    
    if (permanent === 'true') {
      // Permanent deletion
      const course = await CourseModel.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.user.tenantId
      })
      .maxTimeMS(20000)
      .exec();
      
      if (!course) {
        return next(new ErrorResponse('Course not found', 404));
      }
      
      res.status(200).json({ 
        success: true, 
        data: {},
        message: 'Course permanently deleted'
      });
    } else {
      // Soft delete (archive)
      const course = await CourseModel.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        { 
          status: 'Archived',
          isActive: false,
          updatedAt: Date.now()
        },
        { new: true, maxTimeMS: 15000 }
      ).exec();
      
      if (!course) {
        return next(new ErrorResponse('Course not found', 404));
      }
      
      res.status(200).json({ 
        success: true, 
        data: course,
        message: 'Course archived successfully'
      });
    }
  } catch (err) {
    console.error('Delete course error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Deletion timeout', 408));
    }
    
    next(err);
  }
});

// @desc    Bulk operations on courses
// @route   POST /api/ngo/courses/bulk
exports.bulkOperations = asyncHandler(async (req, res, next) => {
  try {
    const CourseModel = await getCourseModel(req.user.tenantId);
    const { operation, courseIds, data } = req.body;
    
    if (!operation || !courseIds || !Array.isArray(courseIds)) {
      return next(new ErrorResponse('Operation and courseIds array are required', 400));
    }
    
    const query = { 
      _id: { $in: courseIds }, 
      tenantId: req.user.tenantId 
    };
    
    let result;
    
    switch (operation) {
      case 'activate':
        result = await CourseModel.updateMany(query, { isActive: true }).maxTimeMS(20000).exec();
        break;
      case 'deactivate':
        result = await CourseModel.updateMany(query, { isActive: false }).maxTimeMS(20000).exec();
        break;
      case 'publish':
        result = await CourseModel.updateMany(query, { status: 'Published' }).maxTimeMS(20000).exec();
        break;
      case 'archive':
        result = await CourseModel.updateMany(query, { status: 'Archived' }).maxTimeMS(20000).exec();
        break;
      case 'update':
        if (!data) return next(new ErrorResponse('Data is required for update operation', 400));
        result = await CourseModel.updateMany(query, data).maxTimeMS(25000).exec();
        break;
      default:
        return next(new ErrorResponse('Invalid operation', 400));
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk ${operation} completed`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Bulk operations error:', err);
    
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
      return next(new ErrorResponse('Bulk operation timeout', 408));
    }
    
    next(err);
  }
});