const Ngocourse = require('../../models/Ngocourse');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');
const mongoose = require('mongoose');

// Helper function to get the correct model
const getCourseModel = (tenantConnection) => {
  if (tenantConnection) {
    return tenantConnection.model('Ngocourse', Ngocourse.schema, 'ngocourses');
  }
  return Ngocourse;
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to validate course data
const validateCourseData = (data, isUpdate = false) => {
  const errors = [];

  // Required fields validation (only for create)
  if (!isUpdate) {
    if (!data.title) errors.push('Title is required');
    if (!data.description) errors.push('Description is required');
    if (!data.iconName) errors.push('IconName is required');
  }

  // Validate iconName if provided
  if (data.iconName) {
    const validIcons = ['Users', 'Target', 'Video', 'FileText'];
    if (!validIcons.includes(data.iconName)) {
      errors.push(`Invalid iconName. Must be one of: ${validIcons.join(', ')}`);
    }
  }

  // Validate status if provided
  if (data.status && !['draft', 'published', 'archived'].includes(data.status)) {
    errors.push('Invalid status. Must be one of: draft, published, archived');
  }

  // Validate progress if provided
  if (typeof data.progress === 'number' && (data.progress < 0 || data.progress > 100)) {
    errors.push('Progress must be between 0 and 100');
  }

  return errors;
};

// @desc    Create new NGO course
// @route   POST /api/ngo-lms/courses
// @access  Private/Instructor
exports.createNgoCourse = async (req, res) => {
  try {
    console.log('Creating NGO course with data:', JSON.stringify(req.body));
    console.log('Tenant ID:', req.tenantId);
    
    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate input data
    const validationErrors = validateCourseData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Add tenant to req.body
    req.body.tenantId = req.tenantId;

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Create course
    const course = await CourseModel.create(req.body);

    console.log('NGO course created successfully:', course._id);

    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully'
    });

  } catch (err) {
    console.error(`Error in createNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A course with this ${field} already exists`
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get all NGO courses for the tenant
// @route   GET /api/ngo-lms/courses
// @access  Private
exports.getNgoCourses = async (req, res) => {
  try {
    console.log('Fetching NGO courses for tenant:', req.tenantId);
    console.log('Query params:', req.query);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Build query object
    let query = { tenantId: req.tenantId };

    // Add optional filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.isPublic) {
      query.isPublic = req.query.isPublic === 'true';
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sort options
    let sortBy = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy = { createdAt: -1 }; // Default sort by creation date, newest first
    }

    // Execute query
    const [courses, totalCount] = await Promise.all([
      CourseModel.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseModel.countDocuments(query)
    ]);

    console.log(`Found ${courses.length} courses out of ${totalCount} total`);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (err) {
    console.error(`Error in getNgoCourses: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get single NGO course by ID
// @route   GET /api/ngo-lms/courses/:id
// @access  Private
exports.getNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Fetching NGO course with ID:', courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find course and populate modules
    const course = await CourseModel.findOne({ 
      _id: courseId, 
      tenantId: req.tenantId 
    })
    .populate({
      path: 'modules',
      select: 'title isCompleted'
    })
    .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Calculate progress based on modules if not explicitly set
    if (course.progress === 0 && course.modules && course.modules.length > 0) {
      const completedCount = course.modules.filter(m => m.isCompleted).length;
      course.progress = Math.round((completedCount / course.modules.length) * 100);
    }

    console.log('Course found:', course.title);

    res.status(200).json({
      success: true,
      data: course
    });

  } catch (err) {
    console.error(`Error in getNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Handle invalid ObjectId errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update NGO course
// @route   PUT /api/ngo-lms/courses/:id
// @access  Private/Instructor
exports.updateNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Updating NGO course with ID:', courseId);
    console.log('Update data:', req.body);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Validate input data
    const validationErrors = validateCourseData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', ')
      });
    }

    // Prepare update data - exclude undefined/null values and system fields
    const updateData = {};
    const excludedFields = ['_id', 'tenantId', 'createdAt', '__v'];
    
    Object.keys(req.body).forEach(key => {
      if (!excludedFields.includes(key) && req.body[key] !== undefined && req.body[key] !== null) {
        updateData[key] = req.body[key];
      }
    });

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    console.log('Processed update data:', updateData);

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Update the course
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { _id: courseId, tenantId: req.tenantId },
      { $set: updateData },
      {
        new: true, // Return the updated document
        runValidators: true,
        useFindAndModify: false
      }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found for this tenant'
      });
    }

    console.log('Successfully updated course:', updatedCourse._id);

    res.status(200).json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    });

  } catch (err) {
    console.error(`Error in updateNgoCourse: ${err.message}`);
    console.error(`Stack trace: ${err.stack}`);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A course with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Delete NGO course
// @route   DELETE /api/ngo-lms/courses/:id
// @access  Private/Instructor
exports.deleteNgoCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Deleting NGO course with ID:', courseId);
    console.log('Tenant ID:', req.tenantId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find and delete the course
    const deletedCourse = await CourseModel.findOneAndDelete({
      _id: courseId,
      tenantId: req.tenantId
    });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or already deleted'
      });
    }

    console.log('Deleted course:', deletedCourse.title);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {
        _id: deletedCourse._id,
        title: deletedCourse.title
      }
    });

  } catch (err) {
    console.error(`Error in deleteNgoCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get course progress
// @route   GET /api/ngo-lms/courses/:id/progress
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Getting progress for course ID:', courseId);

    // Validate tenant ID
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Use tenant-specific model
    const CourseModel = getCourseModel(req.tenantConnection);

    // Find course and populate modules
    const course = await CourseModel.findOne({ 
      _id: courseId, 
      tenantId: req.tenantId 
    })
    .populate({
      path: 'modules',
      select: 'isCompleted'
    })
    .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Calculate progress
    let progress = course.progress || 0;
    if (course.modules && course.modules.length > 0) {
      const completedCount = course.modules.filter(m => m.isCompleted).length;
      progress = Math.round((completedCount / course.modules.length) * 100);
    }

    res.status(200).json({
      success: true,
      data: {
        progress,
        lastUpdated: course.updatedAt,
        totalModules: course.modules ? course.modules.length : 0,
        completedModules: course.modules ? course.modules.filter(m => m.isCompleted).length : 0
      }
    });

  } catch (err) {
    console.error(`Error in getCourseProgress: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);

    // Handle invalid ObjectId errors
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};