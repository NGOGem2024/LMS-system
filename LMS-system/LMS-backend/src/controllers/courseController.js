const Course = require('../models/Course');

const path = require('path');
const fs = require('fs');


// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    console.log(`GetCourses: Tenant ID = ${req.tenantId}, User ID = ${req.user ? req.user.id : 'Not authenticated'}`);
    
    // Make sure we have a tenant connection
    if (!req.tenantConnection) {
      console.error(`GetCourses: No tenant connection available for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    if (req.tenantConnection.readyState !== 1) {
      console.error(`GetCourses: Connection not ready for tenant: ${req.tenantId}, readyState: ${req.tenantConnection.readyState}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not ready. Please try again later.'
      });
    }

    
    // Get Course model from tenant connection
    const CourseModel = req.tenantConnection.model('Course');
    console.log(`GetCourses: Got Course model for tenant: ${req.tenantId}`);

    // Simple query to get all courses for this tenant
    try {
      const courses = await CourseModel.find({ tenantId: req.tenantId })
        .populate('instructor', 'name email')
        .sort('-createdAt')
        .lean();
      
      // Get total count of courses
      const totalRecords = courses.length;
      
      console.log(`GetCourses: Found ${totalRecords} courses for tenant: ${req.tenantId}`);
      
      // Return courses with totalRecords count
      return res.status(200).json({
        totalRecords,
        courses
      });
    } catch (queryErr) {
      console.error(`GetCourses: Query execution error: ${queryErr.message}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve courses. Please try again later.'
      });
    }
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
    console.log(`GetCourse: Retrieving course with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Make sure we have a tenant connection
    if (!req.tenantConnection) {
      console.error(`GetCourse: No tenant connection available for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    if (req.tenantConnection.readyState !== 1) {
      console.error(`GetCourse: Connection not ready for tenant: ${req.tenantId}, readyState: ${req.tenantConnection.readyState}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not ready. Please try again later.'
      });
    }

    // Get Course model from tenant connection
    const CourseModel = req.tenantConnection.model('Course');
    console.log(`GetCourse: Got Course model for tenant: ${req.tenantId}`);
    
    // Find the course
    const course = await CourseModel.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate('instructor', 'name email');

    if (!course) {
      console.error(`GetCourse: Course not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    console.log(`GetCourse: Successfully retrieved course: ${course._id}`);
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error(`Error in getCourse: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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
      // Return object with empty courses array and totalRecords: 0
      return res.status(200).json({
        courses: [],
        totalRecords: 0
      });
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
    
    // Get total count of enrolled courses
    const totalRecords = courses.length;
    
    // Return courses with totalRecords count
    res.status(200).json({
      courses,
      totalRecords
    });
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
    
    // Handle file upload if there is one
    if (req.files && req.files.thumbnail) {
      try {
        const file = req.files.thumbnail;
        
        // Create a unique filename
        const fileName = `${Date.now()}_${file.name}`;
        const uploadPath = path.join(__dirname, '../../public/uploads/course-thumbnails', fileName);
        
        // Make sure the directory exists
        const uploadDir = path.dirname(uploadPath);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
          console.log('Created uploads directory:', uploadDir);
        }
        
        // Move the file (synchronously)
        await new Promise((resolve, reject) => {
          file.mv(uploadPath, (err) => {
            if (err) {
              console.error('File upload error:', err);
              reject(err);
            } else {
              console.log('File uploaded successfully to:', uploadPath);
              resolve();
            }
          });
        });
        
        // Use a path that will be accessible from the frontend via the proxy
        const thumbnailUrl = `/uploads/course-thumbnails/${fileName}`;
        
        // Log the path for debugging
        console.log('Thumbnail URL set to:', thumbnailUrl);
        
        // Set the thumbnail path in the course data
        courseData.thumbnail = thumbnailUrl;
      } catch (uploadErr) {
        console.error('Error during file upload:', uploadErr);
        return res.status(500).json({
          success: false,
          error: 'File upload failed'
        });
      }
    } else if (req.body.thumbnailUrl) {
      // If no file but URL provided, use that
      courseData.thumbnail = req.body.thumbnailUrl;
    }
    
    // Parse tags if they come as a JSON string
    if (typeof req.body.tags === 'string') {
      try {
        courseData.tags = JSON.parse(req.body.tags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        courseData.tags = [];
      }
    }
    
    // Convert string values to appropriate types
    if (req.body.duration) {
      courseData.duration = parseInt(req.body.duration, 10);
    }
    
    if (req.body.price) {
      courseData.price = parseFloat(req.body.price);
    }
    
    if (req.body.isPublic) {
      courseData.isPublic = req.body.isPublic === 'true';
    }
    
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

// @desc    Enroll user in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
exports.enrollInCourse = async (req, res) => {
  try {
    // Get tenant connection
    const connection = req.tenantConnection;
    if (!connection) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
    
    // Use models from tenant connection
    const { getModel } = require('../models');
    const Course = getModel(connection, 'Course');
    const UserProgress = getModel(connection, 'UserProgress');
    
    console.log(`Enrolling user ${req.user.id} in course ${req.params.id}`);
    
    // Check if course exists
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
    
    // Check if already enrolled
    const existingEnrollment = await UserProgress.findOne({
      user: req.user.id,
      course: req.params.id,
      tenantId: req.tenantId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment / user progress
    const userProgress = await UserProgress.create({
      user: req.user.id,
      course: req.params.id,
      tenantId: req.tenantId,
      enrollmentDate: Date.now(),
      progress: 0,
      completed: false,
      lastActivity: Date.now()
    });
    
    // Increment course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();
    
    console.log(`User ${req.user.id} successfully enrolled in course ${req.params.id}`);
    
    res.status(201).json({
      success: true,
      data: {
        course: req.params.id,
        enrollmentDate: userProgress.enrollmentDate
      }
    });
  } catch (err) {
    console.error(`Error in enrollInCourse: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 
// @desc    Public: Get all courses for tenant "ngo"
// @route   GET /api/public/courses
// @access  Public

const { switchTenant } = require('../utils/tenantUtils'); // adjust this path to match your project

exports.getPublicCourses = async (req, res) => {
  try {
    const tenantId = 'ngo'; // 👈 hardcoded tenant

    const tenantConnection = await switchTenant(tenantId);

    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    const Course = tenantConnection.model('Course');

    const courses = await Course.find({ tenantId }) // optional: you can remove `tenantId` if not needed in schema
      .populate('instructor', 'name email')
      .sort('-createdAt')
      .lean();

    return res.status(200).json({
      success: true,
      totalRecords: courses.length,
      courses,
    });
  } catch (error) {
    console.error('getPublicCourses error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching courses',
    });
  }
};
