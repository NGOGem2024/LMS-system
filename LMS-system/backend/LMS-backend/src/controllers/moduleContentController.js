const ModuleContent = require('../models/ModuleContent');
const Module = require('../models/Module');
const Course = require('../models/Course');

// @desc    Get all content for a module
// @route   GET /api/modules/:moduleId/content
// @access  Private
exports.getModuleContent = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    
    // Check if module exists and belongs to tenant
    const module = await Module.findOne({
      _id: moduleId,
      tenantId: req.tenantId
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    const content = await ModuleContent.find({
      module: moduleId,
      tenantId: req.tenantId
    }).sort('order');
    
    res.status(200).json(content);
  } catch (err) {
    console.error(`Error in getModuleContent: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single content item
// @route   GET /api/content/:id
// @access  Private
exports.getContent = async (req, res) => {
  try {
    const content = await ModuleContent.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'module', select: 'title' },
      { path: 'course', select: 'title' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.status(200).json(content);
  } catch (err) {
    console.error(`Error in getContent: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new content
// @route   POST /api/modules/:moduleId/content
// @access  Private/Instructor
exports.createContent = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    
    // Check if module exists and belongs to tenant
    const module = await Module.findOne({
      _id: moduleId,
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
        error: 'Not authorized to add content to this module'
      });
    }
    
    // Get the highest order number for existing content
    const highestOrder = await ModuleContent.findOne({
      module: moduleId,
      tenantId: req.tenantId
    }).sort('-order');
    
    const order = highestOrder ? highestOrder.order + 1 : 1;
    
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Add module to req.body
    req.body.module = moduleId;
    
    // Add course to req.body
    req.body.course = module.course;
    
    // Add tenant to req.body
    req.body.tenantId = req.tenantId;
    
    // Add order to req.body
    req.body.order = req.body.order || order;

    const content = await ModuleContent.create(req.body);

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(`Error in createContent: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Instructor
exports.updateContent = async (req, res) => {
  try {
    let content = await ModuleContent.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Get the course
    const course = await Course.findOne({
      _id: content.course,
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
        error: 'Not authorized to update this content'
      });
    }

    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.tenantId;
    delete updateData.course;
    delete updateData.module;

    content = await ModuleContent.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(`Error in updateContent: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Instructor
exports.deleteContent = async (req, res) => {
  try {
    const content = await ModuleContent.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Get the course
    const course = await Course.findOne({
      _id: content.course,
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
        error: 'Not authorized to delete this content'
      });
    }

    await content.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteContent: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 