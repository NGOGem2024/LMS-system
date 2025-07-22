// @desc    Get all content for a module
// @route   GET /api/modules/:moduleId/content
// @access  Private
exports.getModuleContent = async (req, res) => {
  try {
    console.log(`GetModuleContent: Fetching content for module ID: ${req.params.moduleId} and tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`GetModuleContent: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    const moduleId = req.params.moduleId;
    
    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    
    // Check if module exists and belongs to tenant
    const module = await ModuleModel.findOne({
      _id: moduleId,
      tenantId: req.tenantId
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    
    // Set up filter based on user role
    const filter = {
      module: moduleId,
      tenantId: req.tenantId
    };

    // Only show published content for students
    if (!req.user || req.user.role === 'student') {
      filter.status = 'published';
    }
    
    const content = await ModuleContentModel.find(filter)
      .sort('order')
      .lean();
    
    // Mark completed content for authenticated users
    const contentWithCompletion = content.map(item => ({
      ...item,
      isCompleted: req.user?.completedContents?.includes(item._id.toString()) || false
    }));
    
    console.log(`GetModuleContent: Found ${content.length} content items for module: ${moduleId}`);
    res.status(200).json({
      success: true,
      data: contentWithCompletion
    });
  } catch (err) {
    console.error(`Error in getModuleContent: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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
    console.log(`GetContent: Retrieving content with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`GetContent: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    
    const content = await ModuleContentModel.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate([
      { path: 'module', select: 'title difficulty' },
      { path: 'course', select: 'title' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!content) {
      console.error(`GetContent: Content not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Check if content is published for students
    if (
      (req.user?.role === 'student' || !req.user) && 
      content.status !== 'published'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access to this content is restricted'
      });
    }

    // Check if content is completed by user
    const isCompleted = req.user?.completedContents?.includes(content._id.toString()) || false;

    console.log(`GetContent: Successfully retrieved content: ${content._id}`);
    res.status(200).json({
      success: true,
      data: {
        ...content.toObject(),
        isCompleted
      }
    });
  } catch (err) {
    console.error(`Error in getContent: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
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
    console.log(`CreateContent: Creating content for module ID: ${req.params.moduleId} and tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`CreateContent: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    const moduleId = req.params.moduleId;
    
    // Use tenant connection for database operations
    const ModuleModel = req.tenantConnection.model('Module');
    const CourseModel = req.tenantConnection.model('Course');
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    
    // Check if module exists and belongs to tenant
    const module = await ModuleModel.findOne({
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
        error: 'Not authorized to add content to this module'
      });
    }
    
    // Get the highest order number for existing content
    const highestOrder = await ModuleContentModel.findOne({
      module: moduleId,
      tenantId: req.tenantId
    }).sort('-order');
    
    const order = highestOrder ? highestOrder.order + 1 : 1;
    
    // Prepare content data with defaults
    const contentData = {
      ...req.body,
      createdBy: req.user.id,
      module: moduleId,
      course: module.course,
      tenantId: req.tenantId,
      order: req.body.order || order,
      status: req.body.status || 'published',
      isRequired: req.body.isRequired !== undefined ? req.body.isRequired : true,
      duration: req.body.duration || '0 min'
    };

    const content = await ModuleContentModel.create(contentData);

    console.log(`CreateContent: Successfully created content: ${content._id}`);
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(`Error in createContent: ${err.message}`);
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

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Instructor
exports.updateContent = async (req, res) => {
  try {
    console.log(`UpdateContent: Updating content with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`UpdateContent: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    const CourseModel = req.tenantConnection.model('Course');
    
    let content = await ModuleContentModel.findOne({
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
    const course = await CourseModel.findOne({
      _id: content.course,
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
        error: 'Not authorized to update this content'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.tenantId;
    delete updateData.course;
    delete updateData.module;

    content = await ModuleContentModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    console.log(`UpdateContent: Successfully updated content: ${content._id}`);
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(`Error in updateContent: ${err.message}`);
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

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Instructor
exports.deleteContent = async (req, res) => {
  try {
    console.log(`DeleteContent: Deleting content with ID: ${req.params.id} for tenant: ${req.tenantId}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`DeleteContent: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    const CourseModel = req.tenantConnection.model('Course');
    
    const content = await ModuleContentModel.findOne({
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
    const course = await CourseModel.findOne({
      _id: content.course,
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
        error: 'Not authorized to delete this content'
      });
    }

    await content.remove();

    console.log(`DeleteContent: Successfully deleted content: ${req.params.id}`);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteContent: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Mark content as completed
// @route   POST /api/content/:id/complete
// @access  Private
exports.markContentCompleted = async (req, res) => {
  try {
    console.log(`MarkContentCompleted: Marking content ${req.params.id} as completed for user ${req.user.id}`);
    
    // Check tenant connection
    if (!req.tenantConnection || req.tenantConnection.readyState !== 1) {
      console.error(`MarkContentCompleted: No valid tenant connection for tenant: ${req.tenantId}`);
      return res.status(503).json({
        success: false,
        error: 'Database connection not available. Please try again later.'
      });
    }

    // Use tenant connection for database operations
    const ModuleContentModel = req.tenantConnection.model('ModuleContent');
    const UserModel = req.tenantConnection.model('User');
    
    // Verify content exists
    const content = await ModuleContentModel.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      status: 'published'
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found or not published'
      });
    }

    // Update user's completed content
    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { completedContents: req.params.id } },
      { new: true }
    );

    console.log(`MarkContentCompleted: Successfully marked content ${req.params.id} as completed`);
    res.status(200).json({
      success: true,
      data: {
        contentId: req.params.id,
        completed: true
      }
    });
  } catch (err) {
    console.error(`Error in markContentCompleted: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};