const express = require('express');
const { 
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
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

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

module.exports = router; 