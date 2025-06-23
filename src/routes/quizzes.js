const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  startQuizAttempt,
  submitQuizAttempt,
  getStudentAttempts,
  getQuizAttempts
} = require('../controllers/quizController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// @route   GET /api/quizzes
// @desc    Get all quizzes
// @access  Private
router.get('/', protect, getQuizzes);

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private/Instructor
router.post('/', protect, authorize('instructor', 'admin'), createQuiz);

// @route   GET /api/quizzes/:id
// @desc    Get single quiz
// @access  Private
router.get('/:id', protect, getQuiz);

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private/Instructor
router.put('/:id', protect, authorize('instructor', 'admin'), updateQuiz);

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private/Instructor
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);

// @route   POST /api/quizzes/:id/attempt
// @desc    Start a quiz attempt
// @access  Private/Student
router.post('/:id/attempt', protect, authorize('student'), startQuizAttempt);

// @route   PUT /api/quizzes/attempts/:attemptId
// @desc    Submit a quiz attempt
// @access  Private/Student
router.put('/attempts/:attemptId', protect, authorize('student'), submitQuizAttempt);

// @route   GET /api/quizzes/attempts
// @desc    Get all attempts for a student
// @access  Private/Student
router.get('/attempts', protect, authorize('student'), getStudentAttempts);

// @route   GET /api/quizzes/:id/attempts
// @desc    Get all attempts for a quiz
// @access  Private/Instructor
router.get('/:id/attempts', protect, authorize('instructor', 'admin'), getQuizAttempts);

module.exports = router; 