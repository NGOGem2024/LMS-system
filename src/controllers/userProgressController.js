const UserProgress = require('../models/UserProgress');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// @desc    Get user progress for all courses
// @route   GET /api/progress
// @access  Private
exports.getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({
      user: req.user.id,
      tenantId: req.tenantId
    }).populate('course', 'title description');

    res.status(200).json(progress);
  } catch (err) {
    console.error(`Error in getUserProgress: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user progress for a specific course
// @route   GET /api/progress/:courseId
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await UserProgress.findOne({
      user: req.user.id,
      course: req.params.courseId,
      tenantId: req.tenantId
    }).populate([
      { path: 'course', select: 'title description' },
      { path: 'moduleProgress.module', select: 'title order' },
      { path: 'moduleProgress.completedAssignments.assignment', select: 'title dueDate' }
    ]);

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress record not found'
      });
    }

    res.status(200).json(progress);
  } catch (err) {
    console.error(`Error in getCourseProgress: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update user progress for a course
// @route   PUT /api/progress/:courseId
// @access  Private
exports.updateProgress = async (req, res) => {
  try {
    let progress = await UserProgress.findOne({
      user: req.user.id,
      course: req.params.courseId,
      tenantId: req.tenantId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress record not found'
      });
    }

    // Update last access date
    progress.lastAccessDate = Date.now();
    
    // Update other fields if provided
    if (req.body.moduleProgress) {
      progress.moduleProgress = req.body.moduleProgress;
    }
    
    if (req.body.completed !== undefined) {
      progress.completed = req.body.completed;
      
      if (req.body.completed) {
        progress.completionDate = Date.now();
      }
    }
    
    await progress.save();

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (err) {
    console.error(`Error in updateProgress: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Mark content as completed
// @route   POST /api/progress/:courseId/modules/:moduleId/content/:contentId/complete
// @access  Private
exports.markContentCompleted = async (req, res) => {
  try {
    let progress = await UserProgress.findOne({
      user: req.user.id,
      course: req.params.courseId,
      tenantId: req.tenantId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        error: 'Progress record not found'
      });
    }

    // Find the module in moduleProgress array
    const moduleIndex = progress.moduleProgress.findIndex(
      m => m.module.toString() === req.params.moduleId
    );

    if (moduleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Module not found in progress record'
      });
    }

    // Add content to completedLessons if not already there
    if (!progress.moduleProgress[moduleIndex].completedLessons.includes(req.params.contentId)) {
      progress.moduleProgress[moduleIndex].completedLessons.push(req.params.contentId);
    }

    // Update last access date
    progress.lastAccessDate = Date.now();
    
    await progress.save();

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (err) {
    console.error(`Error in markContentCompleted: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get user progress statistics
// @route   GET /api/progress/stats
// @access  Private
exports.getProgressStats = async (req, res) => {
  try {
    // Get all user progress records
    const progressRecords = await UserProgress.find({
      user: req.user.id,
      tenantId: req.tenantId
    });
    
    // Get all assignments for the user
    const submissions = await AssignmentSubmission.find({
      student: req.user.id,
      tenantId: req.tenantId
    });
    
    // Calculate statistics
    const totalCourses = progressRecords.length;
    const completedCourses = progressRecords.filter(record => record.completed).length;
    const inProgressCourses = progressRecords.filter(record => !record.completed && record.progress > 0).length;
    
    const totalAssignments = submissions.length;
    const completedAssignments = submissions.filter(sub => sub.status === 'graded' || sub.status === 'submitted').length;
    const pendingAssignments = totalAssignments - completedAssignments;
    
    // Calculate overall progress
    const overallProgress = totalCourses > 0 
      ? progressRecords.reduce((sum, record) => sum + record.progress, 0) / totalCourses 
      : 0;
    
    const stats = {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      overallProgress
    };
    
    res.status(200).json(stats);
  } catch (err) {
    console.error(`Error in getProgressStats: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 