const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Add tenant filter from middleware
    reqQuery.tenantId = req.tenantId;

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Course.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Course.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    if (req.query.populate) {
      const populateFields = req.query.populate.split(',');
      populateFields.forEach(field => {
        query = query.populate(field);
      });
    }

    // Executing query
    const courses = await query;

    // Format the response to match what the frontend expects - an array directly
    res.status(200).json(courses);
  } catch (err) {
    console.error(`Error in getCourses: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error(`Error in getCourse: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Instructor
exports.createCourse = async (req, res) => {
  try {
    console.log('Creating course with data:', JSON.stringify(req.body));
    console.log('User ID:', req.user.id);
    console.log('Tenant ID:', req.tenantId);
    
    // Add user to req.body
    req.body.instructor = req.user.id;
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;

    // Set a timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 20000);
    });

    // Create course with timeout
    const course = await Promise.race([
      Course.create(req.body),
      timeoutPromise
    ]);

    console.log('Course created successfully:', course._id);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error(`Error in createCourse: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Check for specific error types
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please try again later.'
      });
    }
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    // Check for duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A course with this title already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this course'
      });
    }

    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.instructor;
    delete updateData.tenantId;
    delete updateData.slug;

    course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error(`Error in updateCourse: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this course'
      });
    }

    await course.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteCourse: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get courses enrolled by current user
// @route   GET /api/courses/enrolled
// @access  Private
exports.getEnrolledCourses = async (req, res) => {
  try {
    // Find user progress records for the current user
    const UserProgress = require('../models/UserProgress');
    
    // Get course IDs from user progress
    const userProgress = await UserProgress.find({
      user: req.user.id,
      tenantId: req.tenantId
    }).select('course');
    
    // Extract course IDs
    const courseIds = userProgress.map(progress => progress.course);
    
    // Find courses with those IDs
    const courses = await Course.find({
      _id: { $in: courseIds },
      tenantId: req.tenantId
    }).populate('instructor', 'name email');
    
    // Format the response to match what the frontend expects - an array directly
    res.status(200).json(courses);
  } catch (err) {
    console.error(`Error in getEnrolledCourses: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new course (simplified)
// @route   POST /api/courses/simple
// @access  Private/Instructor
exports.createCourseSimple = async (req, res) => {
  try {
    console.log('Creating course with simplified method');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('User ID:', req.user.id);
    console.log('Tenant ID:', req.tenantId);
    
    // Add user to req.body
    const courseData = {
      ...req.body,
      instructor: req.user.id,
      tenantId: req.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug: req.body.title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '')
    };
    
    // Get the mongoose connection from the request
    const connection = req.tenantConnection;
    if (!connection) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
    
    // Use the Mongoose model instead of native MongoDB driver
    const { getModel } = require('../models');
    const Course = getModel(connection, 'Course');
    
    // Create the course using Mongoose
    const course = await Course.create(courseData);
    
    console.log('Course created successfully with ID:', course._id);
    
    // Return the created course
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error(`Error in createCourseSimple: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
}; 