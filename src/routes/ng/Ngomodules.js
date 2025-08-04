const express = require("express");
const router = express.Router();

const {
  createNgoModule,
  validateModuleData,
  getNgoModule,
  getNgoModules,
  updateNgoModule,
  deleteNgoModule,
  getPublicNgoModules,
  getPublicNgoModule
} = require("../../controllers/ng/Ngomodule");

const tenantMiddleware = require("../../middleware/tenantMiddleware");

router.get("/ngo-public-course/:courseId/modules",getPublicNgoModules);
router.get("/ngo-public-course/:courseId/modules/:moduleId",getPublicNgoModule);

// Apply tenant middleware
router.use(tenantMiddleware);

// Protected routes
router
  .route("/courses/:courseId/modules")
  .post(validateModuleData, createNgoModule)
  .get(getNgoModules);

router
  .route("/courses/:courseId/modules/:moduleId")
  .get(getNgoModule)
  .put(validateModuleData, updateNgoModule)
  .delete(deleteNgoModule);

module.exports = router;
