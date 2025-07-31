const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadProfilePicture,
  uploadResume,
  getUserStats
} = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), validatePagination, getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, validateObjectId('id'), getUser);

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteUser);

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-picture', protect, uploadProfilePicture);

// @route   POST /api/users/upload-resume
// @desc    Upload resume (applicants only)
// @access  Private/Applicant
router.post('/upload-resume', protect, authorize('applicant'), uploadResume);

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private
router.get('/:id/stats', protect, validateObjectId('id'), getUserStats);

module.exports = router;
