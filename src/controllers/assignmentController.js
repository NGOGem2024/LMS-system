const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    let query;

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

    // Finding resource
    query = Assignment.find(JSON.parse(queryStr));

    // Select Fields
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
    const total = await Assignment.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    if (req.query.populate) {
      const populateFields = req.query.populate.split(',');
      populateFields.forEach(field => {
        query = query.populate(field);
      });
    } else {
      query = query.populate('course', 'title');
    }

    // Executing query
    const assignments = await query;

    // Return assignments array directly to match frontend expectations
    res.status(200).json(assignments);
  } catch (err) {
    console.error(`Error in getAssignments: ${err.message}`);
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
    const assignment = await Assignment.findOne({
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

    // Return assignment directly to match frontend expectations
    res.status(200).json(assignment);
  } catch (err) {
    console.error(`Error in getAssignment: ${err.message}`);
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
    // Check if course exists and belongs to tenant
    const course = await Course.findOne({
      _id: req.body.course,
      tenantId: req.tenantId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;

    const assignment = await Assignment.create(req.body);

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (err) {
    console.error(`Error in createAssignment: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
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

    res.status(200).json({
      success: true,
      data: assignment
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