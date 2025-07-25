const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private/Instructor or Admin
exports.createQuiz = async (req, res) => {
  try {
    // Add user and tenant to request body
    req.body.createdBy = req.user.id;
    req.body.tenantId = req.tenantId;
    
    const quiz = await Quiz.create(req.body);
    
    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    console.error(`Error in createQuiz: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
exports.getQuizzes = async (req, res) => {
  try {
    // Build query
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude from matching
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Remove fields from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Add tenant filter
    reqQuery.tenantId = req.tenantId;
    
    // Filter by course if provided
    if (req.query.course) {
      reqQuery.course = req.query.course;
    }
    
    // Filter by module if provided
    if (req.query.module) {
      reqQuery.module = req.query.module;
    }
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = Quiz.find(JSON.parse(queryStr));
    
    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Quiz.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Populate
    query = query.populate([
      { path: 'course', select: 'title' },
      { path: 'module', select: 'title' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    // Executing query
    const quizzes = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: quizzes.length,
      pagination,
      data: quizzes
    });
  } catch (err) {
    console.error(`Error in getQuizzes: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'course', select: 'title' },
      { path: 'module', select: 'title' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // If student is accessing, hide correct answers
    if (req.user.role === 'student') {
      // Create a copy of the quiz to modify
      const studentQuiz = quiz.toObject();
      
      // Check if student has attempted this quiz
      const attempts = await QuizAttempt.find({
        quiz: quiz._id,
        student: req.user.id,
        tenantId: req.tenantId
      }).sort('-attemptNumber');
      
      // Add attempt info to response
      studentQuiz.attempts = attempts;
      studentQuiz.attemptsCount = attempts.length;
      studentQuiz.canAttempt = attempts.length < quiz.attemptLimit;
      
      // Hide correct answers if no completed attempts or showResults is false
      const hasCompletedAttempt = attempts.some(attempt => attempt.completed);
      if (!hasCompletedAttempt || !quiz.showResults) {
        studentQuiz.questions = studentQuiz.questions.map(question => {
          const { correctAnswer, options, ...rest } = question;
          
          // If multiple choice, remove isCorrect flag from options
          let sanitizedOptions = [];
          if (options && options.length > 0) {
            sanitizedOptions = options.map(({ text, _id }) => ({ text, _id }));
          }
          
          return {
            ...rest,
            options: sanitizedOptions
          };
        });
      }
      
      return res.status(200).json({
        success: true,
        data: studentQuiz
      });
    }
    
    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    console.error(`Error in getQuiz: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Instructor or Admin
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Make sure user is quiz creator or admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this quiz'
      });
    }
    
    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (err) {
    console.error(`Error in updateQuiz: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Instructor or Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Make sure user is quiz creator or admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this quiz'
      });
    }
    
    // Check if there are any attempts
    const attempts = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      tenantId: req.tenantId
    });
    
    if (attempts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete quiz with existing attempts'
      });
    }
    
    await quiz.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteQuiz: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Start quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Private/Student
exports.startQuizAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      status: 'published'
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found or not published'
      });
    }
    
    // Check if user has reached attempt limit
    const attemptCount = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      student: req.user.id,
      tenantId: req.tenantId
    });
    
    if (attemptCount >= quiz.attemptLimit) {
      return res.status(400).json({
        success: false,
        error: `You have reached the maximum number of attempts (${quiz.attemptLimit})`
      });
    }
    
    // Check if there's an incomplete attempt
    const incompleteAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      student: req.user.id,
      tenantId: req.tenantId,
      completed: false
    });
    
    if (incompleteAttempt) {
      return res.status(200).json({
        success: true,
        message: 'Continuing existing attempt',
        data: incompleteAttempt
      });
    }
    
    // Create new attempt
    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user.id,
      course: quiz.course,
      module: quiz.module,
      attemptNumber: attemptCount + 1,
      tenantId: req.tenantId,
      answers: []
    });
    
    res.status(201).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    console.error(`Error in startQuizAttempt: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Submit quiz attempt
// @route   PUT /api/quizzes/attempts/:attemptId
// @access  Private/Student
exports.submitQuizAttempt = async (req, res) => {
  try {
    let attempt = await QuizAttempt.findOne({
      _id: req.params.attemptId,
      student: req.user.id,
      tenantId: req.tenantId,
      completed: false
    });
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found or already completed'
      });
    }
    
    // Get the quiz
    const quiz = await Quiz.findOne({
      _id: attempt.quiz,
      tenantId: req.tenantId
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Update answers
    attempt.answers = req.body.answers || [];
    attempt.completed = true;
    attempt.endTime = Date.now();
    
    // Grade the answers
    attempt.answers = attempt.answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      
      if (!question) {
        return answer;
      }
      
      let isCorrect = false;
      let pointsAwarded = 0;
      
      // Grade based on question type
      switch (question.questionType) {
        case 'multiple-choice':
          // For multiple choice, check if selected option matches correct option
          if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            const correctOptions = question.options
              .filter(opt => opt.isCorrect)
              .map(opt => opt._id.toString());
            
            // Check if selected options match correct options exactly
            const selectedIds = answer.selectedOptions.map(id => id.toString());
            isCorrect = correctOptions.length === selectedIds.length && 
              correctOptions.every(id => selectedIds.includes(id));
          }
          break;
          
        case 'true-false':
          // For true-false, check if selected option is correct
          if (answer.selectedOptions && answer.selectedOptions.length === 1) {
            isCorrect = answer.selectedOptions[0] === question.correctAnswer;
          }
          break;
          
        case 'short-answer':
          // For short answer, check if text answer matches correct answer
          // This is a simple exact match - could be enhanced with fuzzy matching
          if (answer.textAnswer) {
            isCorrect = answer.textAnswer.trim().toLowerCase() === 
              question.correctAnswer.trim().toLowerCase();
          }
          break;
          
        default:
          isCorrect = false;
      }
      
      // Award points if correct
      if (isCorrect) {
        pointsAwarded = question.points;
      }
      
      return {
        ...answer,
        isCorrect,
        pointsAwarded
      };
    });
    
    await attempt.save();
    
    // Update user progress if module exists
    if (quiz.module) {
      const progress = await UserProgress.findOne({
        user: req.user.id,
        course: quiz.course,
        tenantId: req.tenantId
      });
      
      if (progress) {
        const moduleIndex = progress.moduleProgress.findIndex(
          m => m.module.toString() === quiz.module.toString()
        );
        
        if (moduleIndex !== -1) {
          // Add quiz to completed quizzes if not already there
          const quizIndex = progress.moduleProgress[moduleIndex].completedQuizzes.findIndex(
            q => q.quiz.toString() === quiz._id.toString()
          );
          
          if (quizIndex === -1) {
            progress.moduleProgress[moduleIndex].completedQuizzes.push({
              quiz: quiz._id,
              completionDate: Date.now(),
              score: attempt.score,
              passed: attempt.passed,
              attempts: attempt.attemptNumber
            });
            
            await progress.save();
          } else if (attempt.score > progress.moduleProgress[moduleIndex].completedQuizzes[quizIndex].score) {
            // Update if this attempt has a higher score
            progress.moduleProgress[moduleIndex].completedQuizzes[quizIndex] = {
              quiz: quiz._id,
              completionDate: Date.now(),
              score: attempt.score,
              passed: attempt.passed,
              attempts: attempt.attemptNumber
            };
            
            await progress.save();
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (err) {
    console.error(`Error in submitQuizAttempt: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get quiz attempts for a student
// @route   GET /api/quizzes/attempts
// @access  Private/Student
exports.getStudentAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      student: req.user.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'quiz', select: 'title totalPoints passingScore' },
      { path: 'course', select: 'title' }
    ]).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (err) {
    console.error(`Error in getStudentAttempts: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get quiz attempts for a quiz (instructor/admin)
// @route   GET /api/quizzes/:id/attempts
// @access  Private/Instructor or Admin
exports.getQuizAttempts = async (req, res) => {
  try {
    // Check if quiz exists and user has access
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    // Make sure user is quiz creator, course instructor, or admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to view attempts'
      });
    }
    
    const attempts = await QuizAttempt.find({
      quiz: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'student', select: 'name email' }
    ]).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts
    });
  } catch (err) {
    console.error(`Error in getQuizAttempts: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 