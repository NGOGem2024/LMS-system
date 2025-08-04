const express = require("express");
const router = express.Router();

const {
  getPublicNgoModules,
} = require("../../controllers/ng/Ngomodule");

const {
  getPublicNgoCourses,
  getPublicNgoCourse
} = require("../../controllers/ng/Ngocourse");

const tenantMiddleware = require("../../middleware/tenantMiddleware");

// Apply tenant middleware
router.use(tenantMiddleware);

// Public routes for courses
router.get("/courses", getPublicNgoCourses);
router.get("/courses/:courseId", getPublicNgoCourse);
router.get("/courses/:courseId/modules", getPublicNgoModules);

module.exports = router; 