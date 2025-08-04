const { getModel } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { extractTenantId, getConnectionForTenant } = require('../utils/tenantUtils');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Get tenant ID from request
    const tenantId = extractTenantId(req);
  
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    console.log(`Register attempt - Email: ${email}, Tenant: ${tenantId}, Role: ${role || 'student'}`);

    // Get tenant connection
    const connection = await getConnectionForTenant(tenantId);
    
    // Get User model for this tenant
    const User = getModel(connection, 'User');

    // Check if user exists - add detailed logging
    console.log(`Checking if user exists with email: ${email} and tenantId: ${tenantId}`);
    const userExists = await User.findOne({ email, tenantId });
    console.log(`User exists check result:`, userExists ? `Found user with ID: ${userExists._id}` : 'No existing user found');

    if (userExists) {
      console.log(`Registration failed - User already exists with email: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user
    console.log(`Creating new user with email: ${email}, tenantId: ${tenantId}`);
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      tenantId
    });

    console.log(`User created successfully with ID: ${user._id}`);

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (err) {
    console.error(`Error in register: ${err.message}`);
    console.error(`Full error:`, err);
    
    // Check for duplicate email error
    if (err.code === 11000) {
      console.error(`Duplicate key error: ${JSON.stringify(err.keyValue)}`);
      return res.status(400).json({
        success: false,
        error: 'Email is already registered. Please use a different email or try logging in.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get tenant ID from request
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    console.log(`Attempting login for email: ${email} in tenant: ${tenantId}`);
    
    // Get tenant connection - ensure we're using the same connection throughout
    const connection = await getConnectionForTenant(tenantId);
    
    // Use the connection's User model if it exists, otherwise get it
    let User;
    if (connection.models.User) {
      User = connection.models.User;
    } else {
      try {
        // Get User model for this tenant using the getModel utility
        const { getModel } = require('../models');
        User = getModel(connection, 'User');
      } catch (modelErr) {
        console.error(`Error getting User model: ${modelErr.message}`);
        return res.status(500).json({
          success: false,
          error: 'Server Error - User model unavailable'
        });
      }
    }

    // Check for user
    const user = await User.findOne({ email, tenantId }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please check your email or sign up for a new account.'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again.'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    // Create a user object with all necessary fields including complete profile
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      profile: user.profile || {} // Ensure profile is included even if null
    };

    console.log('Login successful. User data with profile:', userResponse);

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (err) {
    console.error(`Error in login: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // Get tenant connection from request
    const connection = req.tenantConnection;
    
    // Get User model for this tenant
    const User = getModel(connection, 'User');
    
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in getMe: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      profile: {
        ...req.body.profile
      }
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Get tenant connection from request
    const connection = req.tenantConnection;
    
    // Get User model for this tenant
    const User = getModel(connection, 'User');

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`Error in updateProfile: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get tenant connection from request
    const connection = req.tenantConnection;
    
    // Get User model for this tenant
    const User = getModel(connection, 'User');

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(`Error in updatePassword: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 