const express = require('express');
const { 
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses,
  createCourseSimple
} = require('../controllers/courseController');

const router = express.Router();

// Include other resource routers
const moduleRouter = require('./modules');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Re-route into other resource routers
router.use('/:courseId/modules', moduleRouter);

router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('instructor', 'admin'), createCourse);

// Special route for enrolled courses
router.route('/enrolled')
  .get(protect, getEnrolledCourses);

// Admin route for course management
router.route('/admin')
  .post(protect, authorize('admin'), createCourse);

// Simplified course creation route
router.route('/simple')
  .post(protect, authorize('instructor', 'admin'), createCourseSimple);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

module.exports = router; 