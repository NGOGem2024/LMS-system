const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const AssignmentSubmission = require('../models/AssignmentSubmission');

/**
 * Helper function to calculate submission status
 * @param {Object} assignment - Assignment object
 * @param {Date} now - Current date
 * @param {Object} submission - Submission object (optional)
 * @returns {String} - Submission status: 'completed', 'pending', 'overdue', 'graded', 'late', or 'resubmit'
 */
const calculateSubmissionStatus = (assignment, now, submission = null) => {
  // If there's no submission
  if (!submission) {
    const dueDate = new Date(assignment.dueDate);
    
    // Check if the assignment is overdue
    if (dueDate < now) {
      // If late submissions are allowed, it's still submittable but marked as overdue
      if (assignment.allowLateSubmissions) {
        return 'overdue';
      } else {
        // If late submissions are not allowed, it's missed
        return 'missed';
      }
    }
    
    // Not submitted and not overdue
    return 'pending';
  }
  
  // If there's a submission, check its status
  switch (submission.status) {
    case 'graded':
      // Check if the submission passed the passing threshold
      if (submission.grade >= assignment.passingPoints) {
        return 'passed';
      } else {
        return 'failed';
      }
    case 'returned':
      // Returned for revision
      return 'resubmit';
    case 'late':
      // Submitted late
      return 'late';
    case 'submitted':
    default:
      // Submitted but not graded
      return 'submitted';
  }
};

exports.getAssignments = async (req, res) => {
  try {
    console.log('Starting getAssignments request...');
    
    // Check if connection is valid
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error('No valid database connection available');
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Get Assignment model from tenant connection
    const AssignmentModel = req.tenantConnection.model('Assignment');
    const AssignmentSubmissionModel = req.tenantConnection.model('AssignmentSubmission');

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Add tenant filter from middleware
    reqQuery.tenantId = req.tenantId;

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    console.log(`Assignment query filters: ${queryStr}`);

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build the query in stages to avoid timeouts
    try {
      console.log('Executing assignments query...');
      
      // First, get just the IDs with a short timeout
      const assignmentIds = await AssignmentModel.find(JSON.parse(queryStr))
        .select('_id')
        .sort(req.query.sort ? req.query.sort.split(',').join(' ') : '-createdAt')
        .skip(startIndex)
        .limit(limit)
        .lean()
        .maxTimeMS(10000);
      
      console.log(`Found ${assignmentIds.length} assignment IDs`);
      
      if (assignmentIds.length === 0) {
        return res.status(200).json({
          success: true,
          totalRecords: 0,
          assignments: []
        });
      }
      
      // Then fetch the full documents for those IDs
      const idList = assignmentIds.map(item => item._id);
      const assignments = await AssignmentModel.find({ _id: { $in: idList } })
        .populate('course', 'title')
        .lean()
        .maxTimeMS(10000);
      
      console.log(`Fetched ${assignments.length} full assignment documents`);
      
      // Get current date for submission status calculation
      const now = new Date();
      
      // If user is authenticated, check for submissions
      let userSubmissions = [];
      if (req.user) {
        try {
          userSubmissions = await AssignmentSubmissionModel.find({
            student: req.user.id,
            assignment: { $in: idList },
            tenantId: req.tenantId
          })
          .lean()
          .maxTimeMS(5000);
          
          console.log(`Found ${userSubmissions.length} submissions for user ${req.user.id}`);
        } catch (submissionErr) {
          console.error(`Error fetching submissions: ${submissionErr.message}`);
          // Continue without submissions data
        }
      }
      
      // Add submission status to each assignment
      const processedAssignments = assignments.map(assignment => {
        // Find submission for this assignment if it exists
        const submission = userSubmissions.find(
          sub => sub.assignment.toString() === assignment._id.toString()
        );
        
        // Calculate submission status
        const submissionStatus = calculateSubmissionStatus(assignment, now, submission);
        
        return {
          ...assignment,
          submissionStatus
        };
      });
      
      console.log(`Returning ${processedAssignments.length} processed assignments`);
      
      // Return assignments
      return res.status(200).json({
        success: true,
        totalRecords: processedAssignments.length,
        assignments: processedAssignments
      });
    } catch (queryErr) {
      console.error(`Assignment query error: ${queryErr.message}`);
      
      // Try a simpler query as fallback
      try {
        console.log('Trying simplified fallback query...');
        const simpleAssignments = await AssignmentModel.find({ tenantId: req.tenantId })
          .limit(limit)
          .lean()
          .maxTimeMS(5000);
        
        return res.status(200).json({
          success: true,
          totalRecords: simpleAssignments.length,
          assignments: simpleAssignments,
          note: 'Using simplified query due to timeout'
        });
      } catch (fallbackErr) {
        console.error(`Fallback query error: ${fallbackErr.message}`);
        throw queryErr; // Throw the original error
      }
    }
  } catch (err) {
    console.error(`Error in getAssignments: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Check if this is a timeout error
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        error: 'Database operation timed out. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get upcoming assignments for current user
// @route   GET /api/assignments/upcoming
// @access  Private
exports.getUpcomingAssignments = async (req, res) => {
  try {
    console.log(`Getting upcoming assignments for user: ${req.user.id}`);
    
    // Make sure we have a tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`No valid tenant connection available`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use models from the tenant connection
    const AssignmentModel = req.tenantConnection.model('Assignment');
    const UserProgressModel = req.tenantConnection.model('UserProgress');
    const AssignmentSubmissionModel = req.tenantConnection.model('AssignmentSubmission');
    
    // Get courses the user is enrolled in
    const userProgress = await UserProgressModel.find({
      user: req.user.id,
      tenantId: req.tenantId
    })
    .select('course')
    .lean()
    .maxTimeMS(3000); // Set a 3-second timeout
    
    const courseIds = userProgress.map(progress => progress.course);
    
    if (courseIds.length === 0) {
      console.log(`No enrolled courses found for user: ${req.user.id}`);
      return res.status(200).json([]);
    }
    
    // Find upcoming assignments for these courses
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
    
    const assignments = await AssignmentModel.find({
      course: { $in: courseIds },
      tenantId: req.tenantId,
      dueDate: { $gt: now, $lt: twoWeeksFromNow } // Due date is in the future but within 2 weeks
    })
    .populate('course', 'title')
    .sort('dueDate') // Sort by due date (ascending)
    .lean()
    .maxTimeMS(5000); // Set a 5-second timeout
    
    if (assignments.length === 0) {
      console.log(`No upcoming assignments found for user: ${req.user.id}`);
      return res.status(200).json([]);
    }
    
    // Get user's submissions for these assignments
    let submissions = [];
    try {
      const assignmentIds = assignments.map(a => a._id);
      submissions = await AssignmentSubmissionModel.find({
        student: req.user.id,
        assignment: { $in: assignmentIds },
        tenantId: req.tenantId
      })
      .lean()
      .maxTimeMS(3000); // Set a 3-second timeout
    } catch (submissionErr) {
      console.error(`Error fetching submissions: ${submissionErr.message}`);
      // Continue without submissions data
    }
    
    // Add submission status to each assignment
    const processedAssignments = assignments.map(assignment => {
      // Find submission for this assignment if it exists
      const submission = submissions.find(
        sub => sub.assignment.toString() === assignment._id.toString()
      );
      
      // Calculate submission status
      const submissionStatus = calculateSubmissionStatus(assignment, now, submission);
      
      return {
        ...assignment,
        submissionStatus
      };
    });
    
    console.log(`Found ${processedAssignments.length} upcoming assignments for user: ${req.user.id}`);
    
    // Return assignments array directly
    res.status(200).json(processedAssignments);
  } catch (err) {
    console.error(`Error in getUpcomingAssignments: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Check if this is a timeout error
    if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
      return res.status(503).json({
        success: false,
        error: 'Database operation timed out. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = async (req, res) => {
  try {
    console.log(`Fetching assignment with id: ${req.params.id}`);
    
    // Check if connection is valid
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error('No valid database connection available');
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Get models from tenant connection
    const AssignmentModel = req.tenantConnection.model('Assignment');
    const AssignmentSubmissionModel = req.tenantConnection.model('AssignmentSubmission');

    const assignment = await AssignmentModel.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'course', select: 'title' },
      { path: 'module', select: 'title' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    // Convert to object for modification
    const assignmentObj = assignment.toObject();
    
    // Get current date for submission status calculation
    const now = new Date();
    
    // If user is authenticated, check for submission
    let submission = null;
    if (req.user) {
      submission = await AssignmentSubmissionModel.findOne({
        assignment: req.params.id,
        student: req.user.id,
        tenantId: req.tenantId
      }).lean();
      
      // Add submission to assignment object if found
      if (submission) {
        assignmentObj.submission = submission;
      }
    }
    
    // Calculate submission status
    assignmentObj.submissionStatus = calculateSubmissionStatus(assignmentObj, now, submission);

    // Return assignment directly to match frontend expectations
    res.status(200).json(assignmentObj);
  } catch (err) {
    console.error(`Error in getAssignment: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private/Instructor
exports.createAssignment = async (req, res) => {
  try {
    console.log('Creating assignment with data:', JSON.stringify(req.body));
    
    // Set connection timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 10000);
    });
    
    // Add user to req.body directly without course validation first
    req.body.createdBy = req.user.id;
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;
    
    // Remove module if it's empty or not provided
    if (!req.body.module || req.body.module === '') {
      delete req.body.module;
    }
    
    // Use the tenant connection directly if available
    if (req.tenantConnection) {
      console.log('Using tenant connection to create assignment');
      try {
        const AssignmentModel = req.tenantConnection.model('Assignment');
        const assignment = await Promise.race([
          AssignmentModel.create(req.body),
          timeoutPromise
        ]);
        
        console.log('Assignment created successfully:', assignment._id);
        
        // Get current date for submission status calculation
        const now = new Date();
        
        // Calculate submission status (will always be 'pending' for new assignments)
        const assignmentObj = assignment.toObject();
        assignmentObj.submissionStatus = calculateSubmissionStatus(assignmentObj, now);
        
        return res.status(201).json({
          success: true,
          data: assignmentObj
        });
      } catch (connErr) {
        console.error(`Error creating assignment with tenant connection: ${connErr.message}`);
        throw connErr; // Rethrow for general error handling
      }
    } else {
      // Fallback to default model if tenant connection not available
      const assignment = await Promise.race([
        Assignment.create(req.body),
        timeoutPromise
      ]);
      
      console.log('Assignment created successfully (fallback):', assignment._id);
      
      // Get current date for submission status calculation
      const now = new Date();
      
      // Calculate submission status (will always be 'pending' for new assignments)
      const assignmentObj = assignment.toObject();
      assignmentObj.submissionStatus = calculateSubmissionStatus(assignmentObj, now);
      
      return res.status(201).json({
        success: true,
        data: assignmentObj
      });
    }
  } catch (err) {
    console.error(`Error in createAssignment: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    // Specific timeout error
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please try again later.'
      });
    }
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Instructor
exports.updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findOne({
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
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this assignment'
      });
    }

    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.tenantId;

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    // Get current date for submission status calculation
    const now = new Date();
    
    // Check for user submission if available
    let submission = null;
    if (req.user) {
      submission = await AssignmentSubmission.findOne({
        assignment: req.params.id,
        student: req.user.id,
        tenantId: req.tenantId
      }).lean();
    }
    
    // Convert to object for modification
    const assignmentObj = assignment.toObject();
    
    // Calculate submission status
    assignmentObj.submissionStatus = calculateSubmissionStatus(assignmentObj, now, submission);

    res.status(200).json({
      success: true,
      data: assignmentObj
    });
  } catch (err) {
    console.error(`Error in updateAssignment: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Instructor
exports.deleteAssignment = async (req, res) => {  
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
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this assignment'
      });
    }

    await assignment.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteAssignment: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 