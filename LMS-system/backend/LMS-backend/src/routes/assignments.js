const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getUpcomingAssignments
} = require('../controllers/assignmentController');

const {
  submitAssignment,
  getSubmissions,
  gradeSubmission
} = require('../controllers/assignmentSubmissionController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Special route for upcoming assignments
router.route('/upcoming')
  .get(protect, getUpcomingAssignments);

router.route('/')
  .get(protect, getAssignments)
  .post(protect, authorize('instructor', 'admin'), createAssignment);

router.route('/:id')
  .get(protect, getAssignment)
  .put(protect, authorize('instructor', 'admin'), updateAssignment)
  .delete(protect, authorize('instructor', 'admin'), deleteAssignment);

// Submission routes
router.post('/:id/submit', protect, authorize('student'), submitAssignment);
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), getSubmissions);
router.put('/:id/submissions/:submissionId', protect, authorize('instructor', 'admin'), gradeSubmission);

module.exports = router; 