const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { 
  createNgoCourse,
  getNgoCourses,
  getNgoCourse,
  updateNgoCourse,
  deleteNgoCourse,
  getPublicNgoCourses,
  getPublicNgoCourse    
} = require('../../controllers/ng/Ngocourse');

const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');

// ======================
// PUBLIC ROUTES (before middleware)
// ======================

// Public routes for courses
router.get('/ngo-public-courses', getPublicNgoCourses);
router.get('/ngo-public-course/:courseId', getPublicNgoCourse);

// Apply tenant middleware to protected routes
router.use(tenantMiddleware);

// Apply auth middleware to protected routes
router.use(protect);

// ======================
// PROTECTED ROUTES
// ======================

router
  .route('/courses')
  .get(getNgoCourses)
  .post(authorize('admin'), createNgoCourse);

router
  .route('/courses/:id')
  .get(getNgoCourse)
  .put(updateNgoCourse)
  .delete(deleteNgoCourse);

module.exports = router;