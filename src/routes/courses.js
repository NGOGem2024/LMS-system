const express = require('express');
const { 
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses
} = require('../controllers/courseController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('instructor', 'admin'), createCourse);

// Special route for enrolled courses
router.route('/enrolled')
  .get(protect, getEnrolledCourses);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

module.exports = router; 