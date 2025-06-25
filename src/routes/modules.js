const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule
} = require('../controllers/moduleController');

const {
  getModuleContent,
  createContent
} = require('../controllers/moduleContentController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Module routes
router.route('/')
  .get(protect, getModules)
  .post(protect, authorize('instructor', 'admin'), createModule);

router.route('/:id')
  .get(protect, getModule)
  .put(protect, authorize('instructor', 'admin'), updateModule)
  .delete(protect, authorize('instructor', 'admin'), deleteModule);

// Module content routes
router.route('/:moduleId/content')
  .get(protect, getModuleContent)
  .post(protect, authorize('instructor', 'admin'), createContent);

module.exports = router; 