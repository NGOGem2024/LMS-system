const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { 
  createNgoModule,
  validateModuleData,
  getNgoModule,
  getNgoModules,
  updateNgoModule,
  deleteNgoModule
} = require('../../controllers/ng/Ngomodule');

// Debug: Check if all functions are imported correctly
console.log('Controller functions:', {
  createNgoModule: typeof createNgoModule,
  validateModuleData: typeof validateModuleData,
  getNgoModule: typeof getNgoModule,
  getNgoModules: typeof getNgoModules,
  updateNgoModule: typeof updateNgoModule,
  deleteNgoModule: typeof deleteNgoModule
});
const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ======================
// PROTECTED ROUTES
// ======================
router.use(protect); // All routes below require authentication

// Module CRUD Operations
router.route('/courses/:courseId/modules')
  .post(authorize('admin', 'instructor'), validateModuleData, createNgoModule) // Create module
  .get(getNgoModules); // Get all modules for a course

router.route('/courses/:courseId/modules/:moduleId')
  .get(getNgoModule) // Get single module
  .put(authorize('admin', 'instructor'), validateModuleData, updateNgoModule) // Update module
  .delete(authorize('admin', 'instructor'), deleteNgoModule); // Delete module

// Additional custom routes can be added here
// For example, reordering modules:
// router.put('/courses/:courseId/modules/reorder', authorize('admin', 'instructor'), reorderModules);

module.exports = router;