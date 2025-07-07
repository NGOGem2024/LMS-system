const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  getCourseProgress,
  updateProgress,
  markContentCompleted,
  getProgressStats
} = require('../controllers/userProgressController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// For now, we'll set up route stubs
// These will be connected to controllers later

// @route   GET /api/progress
// @desc    Get progress for current user
// @access  Private
router.get('/', protect, getUserProgress);

// @route   GET /api/progress/courses/:courseId
// @desc    Get progress for a specific course
// @access  Private
router.get('/courses/:courseId', protect, getCourseProgress);

// @route   POST /api/progress/courses/:courseId
// @desc    Enroll in a course
// @access  Private
router.post('/courses/:courseId', protect, (req, res) => {
  res.status(201).json({
    success: true,
    message: `Enroll in course ${req.params.courseId} - Route stub`
  });
});

// @route   PUT /api/progress/:courseId
// @desc    Update course progress
// @access  Private
router.put('/:courseId', protect, updateProgress);

// @route   POST /api/progress/:courseId/modules/:moduleId/content/:contentId/complete
// @desc    Mark content as completed
// @access  Private
router.post('/:courseId/modules/:moduleId/content/:contentId/complete', protect, markContentCompleted);

// @route   GET /api/progress/stats
// @desc    Get user progress statistics
// @access  Private
router.get('/stats', protect, getProgressStats);

// @route   GET /api/progress/admin/courses/:courseId
// @desc    Get progress for all users in a course
// @access  Private/Instructor or Admin
router.get('/admin/courses/:courseId', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Get progress for all users in course ${req.params.courseId} - Route stub`
  });
});

// @route   GET /api/progress/admin/users/:userId
// @desc    Get progress for a specific user
// @access  Private/Instructor or Admin
router.get('/admin/users/:userId', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Get progress for user ${req.params.userId} - Route stub`
  });
});

module.exports = router; 