const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses,
  createCourseSimple,
  enrollInCourse,
  getPublicCourses
} = require('../../controllers/NgoLms/course');

const router = express.Router({ mergeParams: true });

// Include other resource routers
const moduleRouter = require('../../routes/modules');

// Import middleware
const { protect, authorize } = require('../../middleware/authMiddleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// ======================
// PUBLIC ROUTES
// ======================
router.get('/public/courses', getPublicCourses);

// ======================
// PROTECT ALL ROUTES BELOW
// ======================
router.use(protect);

// ======================
// COURSE MODULES ROUTES
// ======================
router.use('/courses/:courseId/modules', moduleRouter);

// ======================
// COURSE ROUTES
// ======================
router.route('/courses')
  .get(getCourses) // Get all courses
  .post(authorize('instructor', 'admin'), createCourse); // Create new course

// ======================
// ENROLLMENT ROUTES
// ======================
router.get('/courses/enrolled', getEnrolledCourses); // Get enrolled courses
router.post('/courses/:id/enroll', enrollInCourse); // Enroll in a course

// ======================
// ADMIN/INSTRUCTOR ROUTES
// ======================
router.post('/admin/courses', authorize('admin'), createCourse); // Admin-only course creation
router.post('/courses/simple', authorize('instructor', 'admin'), createCourseSimple); // Simplified course creation

// ======================
// SINGLE COURSE ROUTES
// ======================
router.route('/courses/:id')
  .get(getCourse) // Get single course
  .put(authorize('instructor', 'admin'), updateCourse) // Update course
  .delete(authorize('instructor', 'admin'), deleteCourse); // Delete course

module.exports = router;