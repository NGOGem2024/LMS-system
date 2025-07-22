const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { 
  createNgoCourse ,
  getNgoCourses,
  getNgoCourse,
  updateNgoCourse,
  deleteNgoCourse     
} = require('../../controllers/ng/Ngocourse');

const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
// const moduleRouter = require('../ngolms/module');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ======================
// PUBLIC ROUTES
// ======================

/**
 * @route   GET /api/ngo-lms/courses/public
 * @desc    Get all public NGO courses
 * @access  Public
 */
// router.get('/courses/public', getPublicCourses);

// ======================
// PROTECTED ROUTES
// ======================
router.use(protect); // All routes below require authentication

// CRUD Operations
router.route('/courses')               // GET /api/ngo-lms/courses
  .post(authorize('admin'), createNgoCourse); // POST /api/ngo-lms/courses

router.route('/courses')
  .get(getNgoCourses)                    // GET /api/ngo-lms/courses
  .post(authorize('admin'), createNgoCourse); // POST /api/ngo-lms/courses

router.route('/courses/:id')
  .get(getNgoCourse);                    // GET /api/ngo-lms/courses/:id

router.route('/courses/:id')
  .delete(deleteNgoCourse)
  .put(updateNgoCourse);                    // GET /api/ngo-lms/courses/:id
module.exports = router;