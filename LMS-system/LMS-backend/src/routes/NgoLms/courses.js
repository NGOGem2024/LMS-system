const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { 
  getCourses,           
  getCourse,            
  createCourse,         
  updateCourse,        
  deleteCourse,        
  getEnrolledCourses,  
  createCourseSimple,   
  enrollInCourse,       
  getPublicCourses      
} = require('../../controllers/NgoLms/courseController');

const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
const moduleRouter = require('../ngolms/module');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ======================
// PUBLIC ROUTES
// ======================

/**
 * @route   GET /api/ngo-lms/courses/public
 * @desc    Get all public NGO courses
 * @access  Public
 */
router.get('/courses/public', getPublicCourses);

// ======================
// PROTECTED ROUTES
// ======================
router.use(protect); // All routes below require authentication

// CRUD Operations
router.route('/courses')
  .get(getCourses)                 // GET /api/ngo-lms/courses
  .post(authorize('admin'), createCourse); // POST /api/ngo-lms/courses

router.route('/courses/simple')
  .post(authorize('admin'), createCourseSimple); // POST /api/ngo-lms/courses/simple

router.route('/courses/enrolled')
  .get(getEnrolledCourses); // GET /api/ngo-lms/courses/enrolled

router.route('/courses/:id')
  .get(getCourse)                   // GET /api/ngo-lms/courses/:id
  .put(authorize('admin'), updateCourse)   // PUT /api/ngo-lms/courses/:id
  .delete(authorize('admin'), deleteCourse); // DELETE /api/ngo-lms/courses/:id

router.post('/courses/:id/enroll', enrollInCourse); // POST /api/ngo-lms/courses/:id/enroll

// Module sub-router
router.use('/courses/:courseId/modules', moduleRouter);

module.exports = router;