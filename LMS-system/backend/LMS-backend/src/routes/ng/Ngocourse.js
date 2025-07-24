const express = require("express");
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
} = require("../../controllers/ng/Ngocourse");
// const {getPublicNgoModules} = require("../../controllers/ng/Ngomodule")
const { protect, authorize } = require("../../middleware/authMiddleware");
const tenantMiddleware = require("../../middleware/tenantMiddleware");
// ======================
// PUBLIC ROUTES
// ======================
/**
 * @route   GET /api/ngo-lms/public/ngo-courses
 * @desc    Get all public NGO courses
 * @access  Public
 */
// public route to get all
// router.route("/ngo-public-courses").get(getPublicNgoCourses);
router.route("/ngo-public-course/:courseId").get(getPublicNgoCourse);

// const moduleRouter = require('../ngolms/module');

// Apply middleware only to protected routes
router.use(tenantMiddleware); // Apply tenant middleware to all routes below
router.use(protect); // All routes below require authentication

// ======================
// PROTECTED ROUTES
// ======================
// router.use(protect);

// CRUD Operations
router.route("/courses").post(authorize("admin"), createNgoCourse);

router
  .route("/courses")
  .get(getNgoCourses)
  .post(authorize("admin"), createNgoCourse);
router.route("/courses/:id").get(getNgoCourse);

router.route("/courses/:id").delete(deleteNgoCourse).put(updateNgoCourse);

module.exports = router;
