const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/courseController');

const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant and auth middleware
router.use(tenantMiddleware);
router.use(protect);

// CRUD Routes
router.route('/categories')
  .get(getCategories)
  .post(authorize('admin'), createCategory);

router.route('/categories/:id')
  .get(getCategory)
  .put(authorize('admin'), updateCategory)
  .delete(authorize('admin'), deleteCategory);

module.exports = router;
