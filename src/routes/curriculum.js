const express = require('express');
const router = express.Router();
const {
    createSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
    createTopic,
    getTopicsBySubject,
    createSubtopic,
    getSubtopicsByTopic,
    createChapter,
    getChaptersBySubtopic,
    createVideo,
    getVideosByChapter,
    createQuiz,
    getQuizByVideo,
    getCurriculumStructure,
    getBoards, 
    getMediums, 
    postCurriculumForm
} = require('../controllers/curriculumController');
const { validateCurriculumForm } = require('../middleware/curriculumValidation');
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Subject routes
router.post('/postCurriculumForm', protect, authorize('instructor', 'admin'), postCurriculumForm);
router.post('/subjects', protect, authorize('instructor', 'admin'), validateCurriculumForm, createSubject);
router.get('/subjects', protect, getSubjects);
router.get('/subjects/:id', protect, getSubjectById);
router.put('/subjects/:id', protect, authorize('instructor', 'admin'), validateCurriculumForm, updateSubject);
router.delete('/subjects/:id', protect, authorize('instructor', 'admin'), deleteSubject);

// Topic routes
router.post('/topics', protect, authorize('instructor', 'admin'), validateCurriculumForm, createTopic);
router.get('/topics/:subjectId', protect, getTopicsBySubject);

// Subtopic routes
router.post('/subtopics', protect, authorize('instructor', 'admin'), validateCurriculumForm, createSubtopic);
router.get('/subtopics/:topicId', protect, getSubtopicsByTopic);

// Chapter routes
router.post('/chapters', protect, authorize('instructor', 'admin'), validateCurriculumForm, createChapter);
router.get('/chapters/:subtopicId', protect, getChaptersBySubtopic);

// Video routes
router.post('/videos', protect, authorize('instructor', 'admin'), validateCurriculumForm, createVideo);
router.get('/videos/:chapterId', protect, getVideosByChapter);

// Quiz routes
router.post('/quizzes', protect, authorize('instructor', 'admin'), validateCurriculumForm, createQuiz);
router.get('/quizzes/:videoId', protect, getQuizByVideo);

// Curriculum structure
router.get('/structure', protect, getCurriculumStructure);

// Helper routes for dropdown options
router.get('/boards', protect, getBoards);
router.get('/mediums', protect, getMediums);

module.exports = router; 