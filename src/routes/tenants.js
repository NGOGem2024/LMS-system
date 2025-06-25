const express = require('express');
const { 
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
  getCurrentTenant
} = require('../controllers/tenantController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Import database switcher utility
const { switchToDatabase, getActiveConnections } = require('../utils/dbSwitcher');

// Current tenant route (needs tenant middleware)
router.get('/current', tenantMiddleware, protect, getCurrentTenant);

// Super admin routes (no tenant middleware)
router.route('/')
  .get(protect, authorize('super_admin'), getTenants)
  .post(protect, authorize('super_admin'), createTenant);

router.route('/:id')
  .get(protect, authorize('super_admin'), getTenant)
  .put(protect, authorize('super_admin'), updateTenant)
  .delete(protect, authorize('super_admin'), deleteTenant);

// Database switching routes
router.post('/switch-db', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { tenantId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }
    
    const result = await switchToDatabase(tenantId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

router.get('/active-connections', protect, authorize('super_admin'), (req, res) => {
  try {
    const result = getActiveConnections();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`
    });
  }
});

module.exports = router; 