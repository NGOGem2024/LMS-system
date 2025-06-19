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

module.exports = router; 