const { body, validationResult } = require('express-validator');

exports.validateCurriculumForm = [
    // Subject level validation
    body('subjectName').trim().notEmpty().withMessage('Subject name is required'),
    body('board').trim().notEmpty().withMessage('Board is required'),
    body('grade').trim().notEmpty().withMessage('Grade is required'),
    
    // Chapters validation
    body('chapters').isArray().withMessage('Chapters must be an array'),
    body('chapters.*.chapterName').trim().notEmpty().withMessage('Chapter name is required'),
    
    // Topics validation
    body('chapters.*.topics').optional().isArray().withMessage('Topics must be an array'),
    body('chapters.*.topics.*.topicName').optional().trim().notEmpty().withMessage('Topic name is required'),
    
    // Subtopics validation
    body('chapters.*.topics.*.subtopics').optional().isArray().withMessage('Subtopics must be an array'),
    body('chapters.*.topics.*.subtopics.*.subtopicName').optional().trim().notEmpty().withMessage('Subtopic name is required'),
    
    // Videos validation
    body('chapters.*.videos').optional().isArray().withMessage('Videos must be an array'),
    body('chapters.*.videos.*.videoUrl').optional().trim().notEmpty().withMessage('Video URL is required'),
    
    // Quiz validation (optional)
    body('chapters.*.videos.*.quiz').optional(),
    body('chapters.*.videos.*.quiz.questions').optional().isArray(),
    body('chapters.*.videos.*.quiz.questions.*.que').optional().trim().notEmpty().withMessage('Question text is required'),
    body('chapters.*.videos.*.quiz.questions.*.opt').optional().isObject(),
    body('chapters.*.videos.*.quiz.questions.*.opt.a').optional().trim(),
    body('chapters.*.videos.*.quiz.questions.*.opt.b').optional().trim(),
    body('chapters.*.videos.*.quiz.questions.*.opt.c').optional().trim(),
    body('chapters.*.videos.*.quiz.questions.*.opt.d').optional().trim(),
    body('chapters.*.videos.*.quiz.questions.*.correctAnswer').optional().trim().notEmpty().withMessage('Correct answer is required'),
    body('chapters.*.videos.*.quiz.questions.*.explanation').optional().trim(),

    // Validation result handler
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
]; 