const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getApplicantDashboard,
  getRecruiterDashboard,
  getAdminDashboard,
  getRecentActivity,
  getAnalytics,
  getReports
} = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics based on user role
// @access  Private
router.get('/stats', protect, getDashboardStats);

// @route   GET /api/dashboard/applicant
// @desc    Get applicant dashboard data
// @access  Private/Applicant
router.get('/applicant', protect, authorize('applicant'), getApplicantDashboard);

// @route   GET /api/dashboard/recruiter
// @desc    Get recruiter dashboard data
// @access  Private/Recruiter
router.get('/recruiter', protect, authorize('recruiter'), getRecruiterDashboard);

// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard data
// @access  Private/Admin
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

// @route   GET /api/dashboard/activity
// @desc    Get recent activity
// @access  Private
router.get('/activity', protect, getRecentActivity);

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data (admin/recruiter only)
// @access  Private/Recruiter/Admin
router.get('/analytics', protect, authorize('recruiter', 'admin'), getAnalytics);

// @route   GET /api/dashboard/reports
// @desc    Get reports (admin only)
// @access  Private/Admin
router.get('/reports', protect, authorize('admin'), getReports);

module.exports = router;
