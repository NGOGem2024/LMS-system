const User = require('../models/User');
const path = require('path');

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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    console.log('getUserProfile called');
    console.log('req.user:', req.user);
    console.log('req.tenantId:', req.tenantId);
    
    // Check if req.user exists
    if (!req.user || !req.user.id) {
      console.log('User not authenticated - missing user ID');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log(`Finding user with ID: ${req.user.id} and tenantId: ${req.tenantId}`);
    
    // Check if User model is available
    if (!req.tenantConnection || !req.tenantConnection.models || !req.tenantConnection.models.User) {
      console.error('User model not available on tenant connection');
      console.log('Available models:', req.tenantConnection ? Object.keys(req.tenantConnection.models || {}) : 'No connection');
      
      // Get User model from the default import
      const User = require('../models/User');
      console.log('Using default User model');
      
      const user = await User.findOne({
        _id: req.user.id,
        tenantId: req.tenantId
      });
      
      if (!user) {
        console.log('User not found with default model');
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      console.log('User found with default model:', user.name);
      return res.status(200).json({
        success: true,
        data: user
      });
    }
    
    // Get User model from tenant connection
    const User = req.tenantConnection.models.User;
    console.log('Using tenant connection User model');
    
    const user = await User.findOne({
      _id: req.user.id,
      tenantId: req.tenantId
    });

    if (!user) {
      console.log('User not found with tenant model');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('User found:', user.name);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in getUserProfile: ${err.message}`);
    console.error(err.stack);
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('updateUserProfile called');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Prepare update data
    const updateData = {
      name: req.body.name
    };

    // If profile data provided, update or create profile object
    if (req.body.bio) {
      updateData.profile = updateData.profile || {};
      updateData.profile.bio = req.body.bio;
    }

    // Handle file upload if there is one
    if (req.files && req.files.avatar) {
      try {
        const file = req.files.avatar;
        
        // Create a unique filename
        const fileName = `${Date.now()}_${file.name}`;
        const uploadPath = path.join(__dirname, '../../public/uploads/avatars', fileName);
        
        // Move the file (synchronously)
        await new Promise((resolve, reject) => {
          file.mv(uploadPath, (err) => {
            if (err) {
              console.error('File upload error:', err);
              reject(err);
            } else {
              console.log('File uploaded successfully to:', uploadPath);
              resolve();
            }
          });
        });
        
        // Use a path that will be accessible from the frontend via the proxy
        const avatarUrl = `/uploads/avatars/${fileName}`;
        
        // Log the path for debugging
        console.log('Avatar URL set to:', avatarUrl);
        
        // Set the avatar path in the profile
        updateData.profile = updateData.profile || {};
        updateData.profile.avatar = avatarUrl;
      } catch (uploadErr) {
        console.error('Error during file upload:', uploadErr);
        return res.status(500).json({
          success: false,
          error: 'File upload failed'
        });
      }
    }
    
    console.log('Update data:', updateData);

    // Determine which User model to use
    let User;
    if (req.tenantConnection && req.tenantConnection.models && req.tenantConnection.models.User) {
      User = req.tenantConnection.models.User;
    } else {
      User = require('../models/User');
    }
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      {
        _id: req.user.id,
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

    console.log('User profile updated successfully:', user);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in updateUserProfile: ${err.message}`);
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 