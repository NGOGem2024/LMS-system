const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changeUserRole,
  getInstructors,
  getStudents,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Profile route - accessible to all authenticated users
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Special routes
router.get('/instructors', protect, getInstructors);
router.get('/students', protect, authorize('instructor', 'admin'), getStudents);

// Standard CRUD routes
router.route('/')
  .get(protect, authorize('admin'), getUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

// Role management
router.put('/:id/role', protect, authorize('admin'), changeUserRole);

module.exports = router; 