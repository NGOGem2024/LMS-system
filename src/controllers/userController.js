const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    // Add tenant filter from middleware
    const users = await User.find({ tenantId: req.tenantId });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(`Error in getUsers: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in getUser: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.tenantId;

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in updateUser: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteUser: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Check if role is valid
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      { role },
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in changeUserRole: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all instructors
// @route   GET /api/users/instructors
// @access  Private
exports.getInstructors = async (req, res) => {
  try {
    const instructors = await User.find({
      role: 'instructor',
      tenantId: req.tenantId
    });

    res.status(200).json({
      success: true,
      count: instructors.length,
      data: instructors
    });
  } catch (err) {
    console.error(`Error in getInstructors: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private/Instructor or Admin
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      tenantId: req.tenantId
    });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error(`Error in getStudents: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 