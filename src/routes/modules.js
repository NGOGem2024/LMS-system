const express = require('express');
const router = express.Router();
const {
  createSection,
  getSections,
  getSection,
  updateSection,
  deleteSection
} = require('../controllers/moduleController');

const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant and auth middleware
router.use(tenantMiddleware);
router.use(protect);

// Routes
router.route('/sections')
  .get(getSections)
  .post(authorize('instructor', 'admin'), createSection);

router.route('/sections/:id')
  .get(getSection)
  .put(authorize('instructor', 'admin'), updateSection)
  .delete(authorize('instructor', 'admin'), deleteSection);

module.exports = router;
