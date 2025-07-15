const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  addModuleToCourse,
  updateModuleInCourse,
  deleteModuleFromCourse
} = require('../../controllers/NgoLms/course'); // Import from courseController since these are course module operations

// Import middleware
const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Course Module Routes
// Note: These routes are nested under courses/:id/modules
router.route('/')
  .post(protect, authorize('instructor', 'admin'), addModuleToCourse);

router.route('/:moduleId')
  .put(protect, authorize('instructor', 'admin'), updateModuleInCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteModuleFromCourse);

module.exports = router;