const Ngomodule = require('../../models/Ngomodule');
const Ngocourse = require('../../models/Ngocourse');

// @desc    Create new module
// @route   POST /api/ngo-lms/courses/:courseId/modules
// @access  Public
exports.createNgoModule = async (req, res) => {
  try {
    console.log('Creating module with data:', JSON.stringify(req.body));
    console.log('Course ID:', req.params.courseId);
    
    // Validate required fields
    if (!req.body.title || !req.body.description || !req.body.duration) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and duration are required fields'
      });
    }

    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const CourseModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngocourse') : 
      Ngocourse;
    
    const ModuleModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngomodule') : 
      Ngomodule;

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Prepare module data
    const moduleData = {
      ...req.body,
      courseId: req.params.courseId,
      tenantId: req.tenantId
    };

    // Create module with timeout protection
    const module = await Promise.race([
      ModuleModel.create(moduleData),
      timeoutPromise
    ]);

    console.log('Module created successfully:', module._id);

    // Update course to include this module
    try {
      await Promise.race([
        CourseModel.findByIdAndUpdate(
          req.params.courseId,
          { 
            $push: { modules: module._id },
            $inc: { moduleCount: 1 }
          },
          { new: true }
        ),
        timeoutPromise
      ]);
    } catch (updateErr) {
      console.warn('Warning: Could not update course with new module:', updateErr.message);
    }

    // Populate the module with course information for response
    const populatedModule = await Promise.race([
      ModuleModel.findById(module._id).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    res.status(201).json({
      success: true,
      data: populatedModule
    });

  } catch (err) {
    console.error(`Error in createNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A module with this ${field} already exists in this course`
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get all modules for a course
// @route   GET /api/ngo-lms/courses/:courseId/modules
// @access  Public
exports.getNgoModules = async (req, res) => {
  try {
    console.log('Getting modules for course:', req.params.courseId);
    
    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const CourseModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngocourse') : 
      Ngocourse;
    
    const ModuleModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngomodule') : 
      Ngomodule;

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get all modules for the course
    const modules = await Promise.race([
      ModuleModel.find({ courseId: req.params.courseId })
        .populate('courseId', 'title description')
        .sort({ order: 1 }),
      timeoutPromise
    ]);

    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });

  } catch (err) {
    console.error(`Error in getNgoModules: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Get single module
// @route   GET /api/ngo-lms/courses/:courseId/modules/:moduleId
// @access  Public
exports.getNgoModule = async (req, res) => {
  try {
    console.log('Getting module:', req.params.moduleId, 'for course:', req.params.courseId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const ModuleModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngomodule') : 
      Ngomodule;

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Find the module
    const module = await Promise.race([
      ModuleModel.findOne({
        _id: req.params.moduleId,
        courseId: req.params.courseId
      }).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found or does not belong to specified course'
      });
    }

    return res.status(200).json({
      success: true,
      data: module
    });

  } catch (err) {
    console.error(`Error in getNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Update module
// @route   PUT /api/ngo-lms/courses/:courseId/modules/:moduleId
// @access  Public
exports.updateNgoModule = async (req, res) => {
  try {
    console.log('Updating module:', req.params.moduleId, 'for course:', req.params.courseId);
    console.log('Update data:', JSON.stringify(req.body));

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const CourseModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngocourse') : 
      Ngocourse;
    
    const ModuleModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngomodule') : 
      Ngomodule;

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Find and update the module
    const module = await Promise.race([
      ModuleModel.findOneAndUpdate(
        { 
          _id: req.params.moduleId, 
          courseId: req.params.courseId
        },
        { ...req.body, updatedAt: Date.now() },
        { new: true, runValidators: true }
      ).populate('courseId', 'title description'),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });

  } catch (err) {
    console.error(`Error in updateNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A module with this ${field} already exists in this course`
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID or course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/ngo-lms/courses/:courseId/modules/:moduleId
// @access  Public
exports.deleteNgoModule = async (req, res) => {
  try {
    console.log('Deleting module:', req.params.moduleId, 'for course:', req.params.courseId);

    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    // Use tenant-specific models if available, otherwise use default
    const CourseModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngocourse') : 
      Ngocourse;
    
    const ModuleModel = req.tenantConnection ? 
      req.tenantConnection.model('Ngomodule') : 
      Ngomodule;

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Find and delete the module
    const module = await Promise.race([
      ModuleModel.findOneAndDelete({ 
        _id: req.params.moduleId, 
        courseId: req.params.courseId
      }),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // Update course to remove this module
    try {
      await Promise.race([
        CourseModel.findByIdAndUpdate(
          req.params.courseId,
          { 
            $pull: { modules: req.params.moduleId },
            $inc: { moduleCount: -1 }
          },
          { new: true }
        ),
        timeoutPromise
      ]);
    } catch (updateErr) {
      console.warn('Warning: Could not update course after module deletion:', updateErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
      data: module
    });

  } catch (err) {
    console.error(`Error in deleteNgoModule: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    
    if (err.message === 'Database operation timed out') {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out'
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID or course ID format'
      });
    }

    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Helper function to validate module data
const validateModuleData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (data.description && data.description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  
  if (data.duration && (typeof data.duration !== 'number' || data.duration < 0)) {
    errors.push('Duration must be a positive number');
  }
  
  if (data.order && (typeof data.order !== 'number' || data.order < 1)) {
    errors.push('Order must be a positive number starting from 1');
  }
  
  return errors;
};

// Middleware function to validate module data
exports.validateModuleData = (req, res, next) => {
  const errors = validateModuleData(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors.join(', ')
    });
  }
  
  next();
};

// @desc    Public: Get all modules for a course for tenant "ngo"
// @route   GET /api/ngo-lms/ngo-public-course/courseId/modules
// @access  Public
const { switchTenant } = require('../../utils/tenantUtils'); // adjust this path to match your project

exports.getPublicNgoModules = async (req, res) => {
  try {
    console.log('Getting modules for course (public):', req.params.courseId);
    
    // Validate courseId parameter
    if (!req.params.courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required'
      });
    }

    const tenantId = 'ngo'; // 👈 hardcoded tenant
    const tenantConnection = await switchTenant(tenantId);
    
    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    // Get models from tenant connection
    const CourseModel = tenantConnection.model('Ngocourse');
    const ModuleModel = tenantConnection.model('Ngomodule');

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Get all modules for the course
    const modules = await Promise.race([
      ModuleModel.find({ courseId: req.params.courseId })
        .populate('courseId', 'title description')
        .sort({ order: 1 }) // Sort by order
        .lean(),
      timeoutPromise
    ]);

    return res.status(200).json({
      success: true,
      totalRecords: modules.length,
      modules,
    });

  } catch (error) {
    console.error('getPublicNgoModules error:', error.message);
    console.error('Error stack:', error.stack);
        
    // Handle timeout errors
    if (error.message === 'Database operation timed out' || 
        error.message.includes('buffering timed out')) {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please check your database connection and try again.'
      });
    }
        
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
        
    // Generic server error
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching modules',
    });
  }
};

exports.getPublicNgoModule = async (req, res) => {
  try {
    console.log('Getting module:', req.params.moduleId, 'for course:', req.params.courseId, '(public)');
    
    // Validate parameters
    if (!req.params.courseId || !req.params.moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID and Module ID are required'
      });
    }

    const tenantId = 'ngo'; // 👈 hardcoded tenant
    const tenantConnection = await switchTenant(tenantId);
    
    if (!tenantConnection || tenantConnection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Could not connect to tenant database',
      });
    }

    // Get models from tenant connection
    const CourseModel = tenantConnection.model('Ngocourse');
    const ModuleModel = tenantConnection.model('Ngomodule');

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000);
    });

    // Check if course exists first
    const course = await Promise.race([
      CourseModel.findById(req.params.courseId),
      timeoutPromise
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Find the specific module
    const module = await Promise.race([
      ModuleModel.findOne({
        _id: req.params.moduleId,
        courseId: req.params.courseId
      })
        .populate('courseId', 'title description')
        .lean(),
      timeoutPromise
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found or does not belong to specified course'
      });
    }

    return res.status(200).json({
      success: true,
      data: module
    });

  } catch (error) {
    console.error('getPublicNgoModule error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle timeout errors
    if (error.message === 'Database operation timed out' ||
        error.message.includes('buffering timed out')) {
      return res.status(504).json({
        success: false,
        error: 'Database operation timed out. Please check your database connection and try again.'
      });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID or module ID format'
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        error: 'Database connection error. Please try again later.'
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      error: 'Server error while fetching module',
    });
  }
};