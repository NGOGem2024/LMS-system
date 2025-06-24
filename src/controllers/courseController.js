const Course = require('../models/Course');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    // Make sure we have a tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`No valid tenant connection available`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use connection from request
    const CourseModel = req.tenantConnection.model('Course');

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

    // Set up timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 15000);
    });

    // Get total count with timeout
    const countPromise = CourseModel.countDocuments(JSON.parse(queryStr)).exec();
    let total;
    try {
      total = await Promise.race([countPromise, timeoutPromise]);
    } catch (err) {
      console.error(`Count operation timed out: ${err.message}`);
      total = 0; // Default to 0 if count times out
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Finding resource
    query = CourseModel.find(JSON.parse(queryStr));

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

    query = query.skip(startIndex).limit(limit);

    // Populate
    if (req.query.populate) {
      const populateFields = req.query.populate.split(',');
      populateFields.forEach(field => {
        query = query.populate(field);
      });
    }

    // Log query for debugging
    console.log(`Executing course query: ${query.getFilter()}`);

    // Executing query with timeout
    const queryPromise = query.lean().exec();
    let courses;
    try {
      courses = await Promise.race([queryPromise, timeoutPromise]);
      console.log(`Found ${courses.length} courses for tenant: ${req.tenantId}`);
    } catch (err) {
      console.error(`Query execution error: ${err.message}`);
      if (err.message === 'Database operation timed out') {
        return res.status(504).json({
          success: false,
          error: 'Database operation timed out. Please try again later.'
        });
      }
      throw err;
    }

    // Format the response to match what the frontend expects - an array directly
    res.status(200).json(courses);
  } catch (err) {
    console.error(`Error in getCourses: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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
    // Make sure we have a tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`No valid tenant connection available`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use models from the tenant connection
    const CourseModel = req.tenantConnection.model('Course');
    const UserProgressModel = req.tenantConnection.model('UserProgress');
    
    // Set up timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 15000);
    });
    
    console.log(`Fetching enrolled courses for user: ${req.user.id} and tenant: ${req.tenantId}`);
    
    // Get course IDs from user progress
    const progressPromise = UserProgressModel.find({
      user: req.user.id,
      tenantId: req.tenantId
    }).select('course').lean().exec();
    
    let userProgress;
    try {
      userProgress = await Promise.race([progressPromise, timeoutPromise]);
      console.log(`Found ${userProgress.length} progress records for user`);
    } catch (err) {
      console.error(`Error fetching user progress: ${err.message}`);
      if (err.message === 'Database operation timed out') {
        return res.status(504).json({
          success: false,
          error: 'Database operation timed out. Please try again later.'
        });
      }
      throw err;
    }
    
    // Extract course IDs
    const courseIds = userProgress.map(progress => progress.course);
    
    if (courseIds.length === 0) {
      console.log(`No enrolled courses found for user: ${req.user.id}`);
      return res.status(200).json([]);
    }
    
    // Find courses with those IDs
    const coursesPromise = CourseModel.find({
      _id: { $in: courseIds },
      tenantId: req.tenantId
    }).populate('instructor', 'name email').lean().exec();
    
    let courses;
    try {
      courses = await Promise.race([coursesPromise, timeoutPromise]);
      console.log(`Found ${courses.length} enrolled courses`);
    } catch (err) {
      console.error(`Error fetching enrolled courses: ${err.message}`);
      if (err.message === 'Database operation timed out') {
        return res.status(504).json({
          success: false,
          error: 'Database operation timed out. Please try again later.'
        });
      }
      throw err;
    }
    
    // Format the response to match what the frontend expects - an array directly
    res.status(200).json(courses);
  } catch (err) {
    console.error(`Error in getEnrolledCourses: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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