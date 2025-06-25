const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const UserProgress = require('../models/UserProgress');

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if student already submitted this assignment
    const existingSubmission = await AssignmentSubmission.findOne({
      assignment: req.params.id,
      student: req.user.id,
      tenantId: req.tenantId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted this assignment'
      });
    }

    // Check if submission is late
    const now = new Date();
    let isLate = false;
    let status = 'submitted';

    if (now > assignment.dueDate) {
      isLate = true;
      status = 'late';

      // Check if late submissions are allowed
      if (!assignment.allowLateSubmissions) {
        return res.status(400).json({
          success: false,
          error: 'Late submissions are not allowed for this assignment'
        });
      }
    }

    // Create submission
    const submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.user.id,
      content: req.body.content,
      submissionType: req.body.submissionType || 'text',
      submissionLink: req.body.submissionLink,
      attachments: req.body.attachments,
      isLate,
      status,
      tenantId: req.tenantId
    });

    // Update user progress
    await UserProgress.findOneAndUpdate(
      {
        user: req.user.id,
        course: assignment.course,
        tenantId: req.tenantId,
        'moduleProgress.module': assignment.module
      },
      {
        $push: {
          'moduleProgress.$.completedAssignments': {
            assignment: assignment._id,
            submissionDate: now
          }
        }
      }
    );

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (err) {
    console.error(`Error in submitAssignment: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private/Instructor
exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Make sure user is assignment creator or admin
    if (
      assignment.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'instructor'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to view these submissions'
      });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: req.params.id,
      tenantId: req.tenantId
    }).populate({
      path: 'student',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (err) {
    console.error(`Error in getSubmissions: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Grade a submission
// @route   PUT /api/assignments/:id/submissions/:submissionId
// @access  Private/Instructor
exports.gradeSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Make sure user is assignment creator or admin
    if (
      assignment.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'instructor'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to grade this submission'
      });
    }

    const { grade, feedback } = req.body;

    if (!grade) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a grade'
      });
    }

    // Make sure grade is within range
    if (grade < 0 || grade > assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        error: `Grade must be between 0 and ${assignment.totalPoints}`
      });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      {
        _id: req.params.submissionId,
        assignment: req.params.id,
        tenantId: req.tenantId
      },
      {
        grade,
        feedback,
        status: 'graded',
        gradedBy: req.user.id,
        gradedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Update user progress with grade
    const passed = grade >= assignment.passingPoints;

    await UserProgress.findOneAndUpdate(
      {
        user: submission.student,
        course: assignment.course,
        tenantId: req.tenantId,
        'moduleProgress.module': assignment.module,
        'moduleProgress.completedAssignments.assignment': assignment._id
      },
      {
        $set: {
          'moduleProgress.$.completedAssignments.$[elem].grade': grade,
          'moduleProgress.$.completedAssignments.$[elem].passed': passed
        }
      },
      {
        arrayFilters: [{ 'elem.assignment': assignment._id }]
      }
    );

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (err) {
    console.error(`Error in gradeSubmission: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 