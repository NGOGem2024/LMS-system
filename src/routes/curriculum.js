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
router.get('/subjects', protect, getSubjects);

// Helper routes for dropdown options
router.get('/boards', protect, getBoards);
router.get('/mediums', protect, getMediums);
router.post('/postCurriculumForm', protect, authorize('instructor', 'admin'), postCurriculumForm);

module.exports = router; 