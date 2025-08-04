const express = require('express');
const router = express.Router();

const {
  createAssessmentVideo,
  getAssessmentVideos,
  getAssessmentVideo,
  updateAssessmentVideo,
  deleteAssessmentVideo
} = require('../controllers/AssessmentVideoController');

const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Middleware
router.use(tenantMiddleware);
router.use(protect);

// Routes
router.route('/assessment-videos')
  .get(getAssessmentVideos)
  .post(authorize('instructor', 'admin'), createAssessmentVideo);

router.route('/assessment-videos/:id')
  .get(getAssessmentVideo)
  .put(authorize('instructor', 'admin'), updateAssessmentVideo)
  .delete(authorize('instructor', 'admin'), deleteAssessmentVideo);

module.exports = router;
