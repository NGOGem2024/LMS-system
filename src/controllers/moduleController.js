const Module = require('../models/Module');
const Course = require('../models/Course');

// @desc    Get all modules for a course
// @route   GET /api/courses/:courseId/modules
// @access  Private
exports.getModules = async (req, res) => {
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
    
    const modules = await Module.find({
      course: courseId,
      tenantId: req.tenantId
    }).sort('order');
    
    res.status(200).json(modules);
  } catch (err) {
    console.error(`Error in getModules: ${err.message}`);
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