const Module = require('../../models/ngolms/NgoModule');
const Course = require('../../models/ngolms/NgoCourse');

// @desc    Get all modules for a course
// @route   GET /api/courses/:courseId/modules
// @access  Public (changed from Private)
exports.getModules = async (req, res) => {
  try {
    console.log(`GetModules: Fetching modules for course ID: ${req.params.courseId} and tenant: ${req.tenantId}`);
    
    // Validate tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`GetModules: No valid tenant connection available for tenant: ${req.tenantId}`);
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
    
    try {
      const filter = {
        course: courseId,
        tenantId: req.tenantId
      };
      
      // If user is not authenticated or is a student, only show published modules
      if (!req.user || req.user.role === 'student') {
        filter.status = 'published';
      }
      
      const modulesPromise = ModuleModel.find(filter)
        .sort('order')
        .populate({
          path: 'contents',
          match: { status: 'published' },
          select: 'title contentType duration order'
        })
        .lean();
      
      const modules = await Promise.race([modulesPromise, timeoutPromise]);
      
      // Calculate progress for each module
      const modulesWithProgress = modules.map(module => {
        const totalContents = module.contents?.length || 0;
        const completedContents = req.user?.completedContents?.filter(id => 
          module.contents?.some(content => content._id.equals(id))
        ).length || 0;
        
        const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
        
        return {
          ...module,
          progress,
          isCompleted: progress === 100
        };
      });
      
      console.log(`GetModules: Found ${modules.length} modules for course: ${courseId}`);
      
      return res.status(200).json({
        success: true,
        data: modulesWithProgress
      });
    } catch (queryErr) {
      console.error(`GetModules: Query execution error: ${queryErr.message}`);
      
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

// @desc    Get single module with progress
// @route   GET /api/modules/:id
// @access  Private
exports.getModule = async (req, res) => {
  try {
    console.log(`GetModule: Retrieving module with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`GetModule: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    
    const module = await ModuleModel.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    })
    .populate([
      { path: 'course', select: 'title description' },
      { path: 'createdBy', select: 'name email' },
      { 
        path: 'contents',
        options: { sort: { order: 1 } },
        match: req.user?.role === 'instructor' || req.user?.role === 'admin' ? {} : { status: 'published' }
      }
    ]);

    if (!module) {
      console.error(`GetModule: Module not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }

    // Calculate module progress
    const totalContents = module.contents.length;
    const completedContents = req.user?.completedContents?.filter(id => 
      module.contents.some(content => content._id.equals(id))
    ).length || 0;
    
    const progress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
    const isCompleted = progress === 100;

    console.log(`GetModule: Successfully retrieved module: ${module._id}`);
    res.status(200).json({
      success: true,
      data: {
        ...module.toObject(),
        progress,
        isCompleted
      }
    });
  } catch (err) {
    console.error(`Error in getModule: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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
    console.log(`CreateModule: Creating module for course ID: ${req.params.courseId} and tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`CreateModule: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    const courseId = req.params.courseId;
    
    // Use tenant connection for database operations
    const CourseModel = req.tenantConnection.model('Course');
    const ModuleModel = req.tenantConnection.model('Module');
    
    // Check if course exists and belongs to tenant
    const course = await CourseModel.findOne({
      _id: courseId,
      tenantId: req.tenantId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Verify user permissions
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
    const highestOrder = await ModuleModel.findOne({
      course: courseId,
      tenantId: req.tenantId
    }).sort('-order');
    
    const order = highestOrder ? highestOrder.order + 1 : 1;
    
    // Prepare module data with defaults
    const moduleData = {
      ...req.body,
      createdBy: req.user.id,
      course: courseId,
      tenantId: req.tenantId,
      order: req.body.order || order,
      status: req.body.status || 'published',
      difficulty: req.body.difficulty || 'Beginner',
      rating: req.body.rating || 4.5,
      enrolledUsers: req.body.enrolledUsers || 0,
      duration: req.body.duration || '0 min'
    };

    const module = await ModuleModel.create(moduleData);

    console.log(`CreateModule: Successfully created module: ${module._id}`);
    res.status(201).json({
      success: true,
      data: module
    });
  } catch (err) {
    console.error(`Error in createModule: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
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
    console.log(`UpdateModule: Updating module with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`UpdateModule: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    const CourseModel = req.tenantConnection.model('Course');
    
    let module = await ModuleModel.findOne({
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
    const course = await CourseModel.findOne({
      _id: module.course,
      tenantId: req.tenantId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Verify user permissions
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this module'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.tenantId;
    delete updateData.course;

    module = await ModuleModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    console.log(`UpdateModule: Successfully updated module: ${module._id}`);
    res.status(200).json({
      success: true,
      data: module
    });
  } catch (err) {
    console.error(`Error in updateModule: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
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
    console.log(`DeleteModule: Deleting module with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`DeleteModule: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    const CourseModel = req.tenantConnection.model('Course');
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    
    const module = await ModuleModel.findOne({
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
    const course = await CourseModel.findOne({
      _id: module.course,
      tenantId: req.tenantId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Verify user permissions
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this module'
      });
    }

    // Delete all associated content first
    await ModuleContentModel.deleteMany({
      module: req.params.id,
      tenantId: req.tenantId
    });

    await module.remove();

    console.log(`DeleteModule: Successfully deleted module: ${req.params.id}`);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteModule: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};