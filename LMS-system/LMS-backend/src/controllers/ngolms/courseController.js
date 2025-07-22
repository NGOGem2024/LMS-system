const Ngocourse = require('../../models/ng/NgoCourse')
const path = require('path');
const fs = require('fs');

// @desc    Get all courses
// @route   GET /api/ngo-lms/courses
// @access  Private
// exports.getNgoCourses = async (req, res) => {
//   try {
//     console.log(`GetCourses: Tenant ID = ${req.tenantId}, User ID = ${req.user ? req.user.id : 'Not authenticated'}`);
    
//     // Make sure we have a tenant connection
//     if (!req.tenantConnection) {
//       console.error(`GetCourses: No tenant connection available for tenant: ${req.tenantId}`);
//       return res.status(503).json({
//         success: false,
//         error: 'Database connection not available. Please try again later.'
//       });
//     }

//     if (req.tenantConnection.readyState !== 1) {
//       console.error(`GetCourses: Connection not ready for tenant: ${req.tenantId}, readyState: ${req.tenantConnection.readyState}`);
//       return res.status(503).json({
//         success: false,
//         error: 'Database connection not ready. Please try again later.'
//       });
//     }

//     // Get Course model from tenant connection
//     const NgoCourseModel = req.tenantConnection.model('Ngocourse');


//     console.log(`GetCourses: Got Course model for tenant: ${req.tenantId}`);

//     // Simple query to get all courses for this tenant
//     try {
//       const Ngocourses = await NgoCourseModel.find({ tenantId: req.tenantId })
//         .populate('instructor', 'name email')
//         .populate('institution')
//         .sort('-createdAt')
//         .lean();
      
//       // Get total count of courses
//       const totalRecords = Ngocourses.length;
      
//       console.log(`GetCourses: Found ${totalRecords} courses for tenant: ${req.tenantId}`);
      
//       // Return courses with totalRecords count
//       return res.status(200).json({
//         totalRecords,
//         courses
//       });
//     } catch (queryErr) {
//       console.error(`GetCourses: Query execution error: ${queryErr.message}`);
//       return res.status(500).json({
//         success: false,
//         error: 'Failed to retrieve courses. Please try again later.'
//       });
//     }
//   } catch (err) {
//     console.error(`Error in getCourses: ${err.message}`);
//     console.error(`Stack: ${err.stack}`);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// // @desc    Get single course
// // @route   GET /api/ngo-lms/courses/:id
// // @access  Private
// exports.getCourse = async (req, res) => {
//   try {
//     console.log(`GetCourse: Retrieving course with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    
//     if (!req.tenantConnection) {
//       console.error(`GetCourse: No tenant connection available for tenant: ${req.tenantId}`);
//       return res.status(503).json({
//         success: false,
//         error: 'Database connection not available. Please try again later.'
//       });
//     }

//     if (req.tenantConnection.readyState !== 1) {
//       console.error(`GetCourse: Connection not ready for tenant: ${req.tenantId}, readyState: ${req.tenantConnection.readyState}`);
//       return res.status(503).json({
//         success: false,
//         error: 'Database connection not ready. Please try again later.'
//       });
//     }

    
//     const NgoCourseModel = req.tenantConnection.model('NgoCourse');
//     console.log(`GetCourse: Got Course model for tenant: ${req.tenantId}`);
    
    
//     const course = await NgoCourseModel.findOne({
//       _id: req.params.id,
//       tenantId: req.tenantId
//     })
//     .populate('instructor', 'name email')
//     .populate('institution')
//     .populate('modules');

//     if (!course) {
//       console.error(`GetCourse: Course not found with ID: ${req.params.id}`);
//       return res.status(404).json({
//         success: false,
//         error: 'Course not found'
//       });
//     }

//     console.log(`GetCourse: Successfully retrieved course: ${course._id}`);
//     res.status(200).json({
//       success: true,
//       data: course
//     });
//   } catch (err) {
//     console.error(`Error in getCourse: ${err.message}`);
//     console.error(`Stack: ${err.stack}`);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// };

// @desc    Create new course
// @route   POST /api/ngo-lms/courses
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


    // Set iconName if not provided
    if (!req.body.iconName) {
      req.body.iconName = 'Users'; // Default icon
    }

    // Get Course model from tenant connection
    const NgoCourseModel = req.tenantConnection.model('NgoCourse');

    // Set timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 20000);
    });

    // Create course with timeout
    const course = await Promise.race([
      Ngocourse.create(req.body),
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
