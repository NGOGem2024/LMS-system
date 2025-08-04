const express = require('express');
const router = express.Router();
const {
  getContent,
  updateContent,
  deleteContent
} = require('../controllers/moduleContentController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

router.route('/:id')
  .get(protect, getContent)
  .put(protect, authorize('instructor', 'admin'), updateContent)
  .delete(protect, authorize('instructor', 'admin'), deleteContent);

module.exports = router; 