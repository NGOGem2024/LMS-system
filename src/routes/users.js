const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// For now, we'll set up route stubs
// These will be connected to controllers later

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all users - Route stub'
  });
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Get user ${req.params.id} - Route stub`
  });
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Update user ${req.params.id} - Route stub`
  });
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Delete user ${req.params.id} - Route stub`
  });
});

// @route   PUT /api/users/:id/role
// @desc    Change user role
// @access  Private/Admin
router.put('/:id/role', protect, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Change role for user ${req.params.id} - Route stub`
  });
});

// @route   GET /api/users/instructors
// @desc    Get all instructors
// @access  Private
router.get('/instructors', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all instructors - Route stub'
  });
});

// @route   GET /api/users/students
// @desc    Get all students
// @access  Private/Instructor or Admin
router.get('/students', protect, authorize('instructor', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get all students - Route stub'
  });
});

module.exports = router; 