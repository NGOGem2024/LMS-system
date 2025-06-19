const Tenant = require('../models/Tenant');
const { getConnectionForTenant } = require('../utils/tenantUtils');

// @desc    Create a new tenant
// @route   POST /api/tenants
// @access  Private/SuperAdmin
exports.createTenant = async (req, res) => {
  try {
    // Create tenant
    const tenant = await Tenant.create({
      ...req.body,
      owner: req.user.id
    });

    // Initialize tenant database
    await getConnectionForTenant(tenant.slug);

    res.status(201).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    console.error(`Error in createTenant: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private/SuperAdmin
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (err) {
    console.error(`Error in getTenants: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single tenant
// @route   GET /api/tenants/:id
// @access  Private/SuperAdmin
exports.getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    console.error(`Error in getTenant: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private/SuperAdmin
exports.updateTenant = async (req, res) => {
  try {
    let tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Remove fields that shouldn't be updated directly
    const updateData = { ...req.body };
    delete updateData.slug; // Slug is generated from name

    tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    console.error(`Error in updateTenant: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete tenant
// @route   DELETE /api/tenants/:id
// @access  Private/SuperAdmin
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    await tenant.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in deleteTenant: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get current tenant
// @route   GET /api/tenants/current
// @access  Private
exports.getCurrentTenant = async (req, res) => {
  try {
    // Tenant ID comes from token or request header
    const tenantId = req.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID not found in request'
      });
    }
    
    const tenant = await Tenant.findOne({ slug: tenantId });
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (err) {
    console.error(`Error in getCurrentTenant: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 