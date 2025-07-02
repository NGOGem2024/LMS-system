const Module = require('../models/Module');
const Course = require('../models/Course');

// @desc    Get all modules for a course
// @route   GET /api/courses/:courseId/modules
// @access  Public (changed from Private)
exports.getModules = async (req, res) => {
  try {
    console.log(`GetModules: Fetching modules for course ID: ${req.params.courseId} and tenant: ${req.tenantId}`);
    
    // Validate tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`GetModules: No valid tenant connection available`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 10000);
    });

    const courseId = req.params.courseId;
    
    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    
    // Get modules directly without checking the course first
    try {
      // Only fetch published modules if the user is not authenticated or is a student
      // Allow instructors and admins to see all modules
      const filter = {
        course: courseId,
        tenantId: req.tenantId
      };
      
      // If user is not authenticated or is a student, only show published modules
      if (!req.user || req.user.role === 'student') {
        filter.status = 'published';
      }
      
      const modulesPromise = ModuleModel.find(filter).sort('order').lean();
      
      const modules = await Promise.race([modulesPromise, timeoutPromise]);
      
      console.log(`GetModules: Found ${modules.length} modules for course: ${courseId}`);
      
      // Return even if empty array
      return res.status(200).json(modules);
    } catch (queryErr) {
      console.error(`GetModules: Query execution error: ${queryErr.message}`);
      
      // Handle timeout specifically
      if (queryErr.message === 'Database operation timed out') {
        return res.status(504).json({
          success: false,
          error: 'Database operation timed out. Please try again later.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve modules. Please try again later.'
      });
    }
  } catch (err) {
    console.error(`Error in getModules: ${err.message}`);
    console.error(`Error stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Private
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'course', select: 'title' },
      { path: 'createdBy', select: 'name email' },
      { path: 'content', options: { sort: { order: 1 } } }
    ]);

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    res.status(200).json(module);
  } catch (err) {
    console.error(`Error in getModule: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new module
// @route   POST /api/courses/:courseId/modules
// @access  Private/Instructor
exports.createModule = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Check if course exists and belongs to tenant
    const course = await Course.findOne({
      _id: courseId,
      tenantId: req.tenantId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to add modules to this course'
      });
    }
    
    // Get the highest order number for existing modules
    const highestOrder = await Module.findOne({
      course: courseId,
      tenantId: req.tenantId
    }).sort('-order');
    
    const order = highestOrder ? highestOrder.order + 1 : 1;
    
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Add course to req.body
    req.body.course = courseId;
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;
    
    // Add order to req.body
    req.body.order = req.body.order || order;

    const module = await Module.create(req.body);

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (err) {
    console.error(`Error in createModule: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Instructor
exports.updateModule = async (req, res) => {
  try {
    let module = await Module.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    // Get the course
    const course = await Course.findOne({
      _id: module.course,
      tenantId: req.tenantId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this module'
      });
    }

    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.tenantId;
    delete updateData.course;

    module = await Module.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (err) {
    console.error(`Error in updateModule: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Instructor
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    // Get the course
    const course = await Course.findOne({
      _id: module.course,
      tenantId: req.tenantId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Make sure user is course instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this module'
      });
    }

    await module.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteModule: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 