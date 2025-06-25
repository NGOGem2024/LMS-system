const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  togglePublicStatus,
  deleteCourse
} = require('../../controllers/ngoControllers/Courses');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Base route: /api/ngo/courses
router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('admin', 'ngo_admin'), createCourse);

router.route('/:id')
  .get(protect, getCourse)
  .put(protect, authorize('admin', 'ngo_admin'), updateCourse)
  .delete(protect, authorize('admin', 'ngo_admin'), deleteCourse);

router.route('/:id/public-status')
  .patch(protect, authorize('admin', 'ngo_admin'), togglePublicStatus);

module.exports = router;