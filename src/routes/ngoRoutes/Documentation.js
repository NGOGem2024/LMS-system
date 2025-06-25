const express = require('express');
const router = express.Router();
const {
  createDocumentation,
  getAllDocumentation,
  getDocumentationById,
  updateDocumentation,
  deleteDocumentation,
  getDocumentationByCourse
} = require('../../controllers/ngoControllers/Documentation');
const { protect, authorize } = require('../../middleware/authMiddleware');

// @desc    Documentation routes
// @route   /api/ngo/docs
// @access  Protected (Role-based)

// Get all documentation (for admin)
router.get('/', protect, authorize('admin'), getAllDocumentation);

// Get documentation by course ID
router.get('/course/:courseId', protect, getDocumentationByCourse);

// Create new documentation
router.post('/', protect, authorize('instructor', 'admin'), createDocumentation);

// Get single documentation
router.get('/:id', protect, getDocumentationById);

// Update documentation
router.put('/:id', protect, authorize('instructor', 'admin'), updateDocumentation);

// Delete documentation
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteDocumentation);

module.exports = router;