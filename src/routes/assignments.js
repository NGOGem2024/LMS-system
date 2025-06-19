const express = require('express');
const router = express.Router({ mergeParams: true });

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// For now, we'll set up route stubs
// These will be connected to controllers later

// @route   GET /api/assignments
// @desc    Get all assignments
// @access  Private
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all assignments - Route stub'
  });
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private/Instructor
router.post('/', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Create new assignment - Route stub'
  });
});

// @route   GET /api/assignments/:id
// @desc    Get single assignment
// @access  Private
router.get('/:id', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: `Get assignment ${req.params.id} - Route stub`
  });
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private/Instructor
router.put('/:id', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Update assignment ${req.params.id} - Route stub`
  });
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private/Instructor
router.delete('/:id', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Delete assignment ${req.params.id} - Route stub`
  });
});

// @route   POST /api/assignments/:id/submit
// @desc    Submit assignment
// @access  Private/Student
router.post('/:id/submit', protect, authorize('student'), (req, res) => {
  res.status(201).json({
    success: true,
    message: `Submit assignment ${req.params.id} - Route stub`
  });
});

// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for an assignment
// @access  Private/Instructor
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Get submissions for assignment ${req.params.id} - Route stub`
  });
});

module.exports = router; 