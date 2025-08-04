const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  updatePassword 
} = require('../controllers/authController');

const router = express.Router();

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);

module.exports = router; 