const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// @desc    Get dashboard statistics based on user role
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;

    let stats = {};

    switch (role) {
      case 'applicant':
        stats = await getApplicantStats(req.user._id);
        break;
      case 'recruiter':
        stats = await getRecruiterStats(req.user._id);
        break;
      case 'admin':
        stats = await getAdminStats();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get applicant statistics
const getApplicantStats = async (userId) => {
  const [
    totalApplications,
    pendingApplications,
    interviewsScheduled,
    rejectedApplications,
    recentApplications,
    upcomingInterviews
  ] = await Promise.all([
    Application.countDocuments({ applicant: userId }),
    Application.countDocuments({ applicant: userId, status: 'pending' }),
    Interview.countDocuments({ applicant: userId, status: { $in: ['scheduled', 'confirmed'] } }),
    Application.countDocuments({ applicant: userId, status: 'rejected' }),
    Application.find({ applicant: userId })
      .populate('job', 'title company')
      .sort({ createdAt: -1 })
      .limit(5),
    Interview.find({ applicant: userId, scheduledDate: { $gte: new Date() } })
      .populate('job', 'title company')
      .populate('interviewer', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(5)
  ]);

  return {
    totalApplications,
    pendingApplications,
    interviewsScheduled,
    rejectedApplications,
    successRate: totalApplications > 0 ? Math.round(((totalApplications - rejectedApplications) / totalApplications) * 100) : 0,
    recentApplications,
    upcomingInterviews
  };
};

// Helper function to get recruiter statistics
const getRecruiterStats = async (userId) => {
  const [
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    scheduledInterviews,
    recentJobs,
    recentApplications
  ] = await Promise.all([
    Job.countDocuments({ postedBy: userId }),
    Job.countDocuments({ postedBy: userId, status: 'active' }),
    Application.countDocuments().populate({
      path: 'job',
      match: { postedBy: userId }
    }),
    Application.countDocuments({ status: 'pending' }).populate({
      path: 'job',
      match: { postedBy: userId }
    }),
    Interview.countDocuments({ interviewer: userId, status: { $in: ['scheduled', 'confirmed'] } }),
    Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5),
    Application.find()
      .populate({
        path: 'job',
        match: { postedBy: userId },
        select: 'title company'
      })
      .populate('applicant', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Filter out applications where job is null (due to populate match)
  const filteredRecentApplications = recentApplications.filter(app => app.job);

  return {
    totalJobs,
    activeJobs,
    totalApplications: filteredRecentApplications.length,
    pendingApplications,
    scheduledInterviews,
    recentJobs,
    recentApplications: filteredRecentApplications
  };
};

// Helper function to get admin statistics
const getAdminStats = async () => {
  const [
    totalUsers,
    totalApplicants,
    totalRecruiters,
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    totalInterviews,
    recentUsers,
    recentJobs,
    recentApplications
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'applicant', isActive: true }),
    User.countDocuments({ role: 'recruiter', isActive: true }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    Application.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    Interview.countDocuments(),
    User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email role createdAt'),
    Job.find()
      .populate('postedBy', 'firstName lastName company')
      .sort({ createdAt: -1 })
      .limit(5),
    Application.find()
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  return {
    totalUsers,
    totalApplicants,
    totalRecruiters,
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    totalInterviews,
    recentUsers,
    recentJobs,
    recentApplications
  };
};

// @desc    Get applicant dashboard data
// @route   GET /api/dashboard/applicant
// @access  Private/Applicant
const getApplicantDashboard = async (req, res, next) => {
  try {
    const stats = await getApplicantStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruiter dashboard data
// @route   GET /api/dashboard/recruiter
// @access  Private/Recruiter
const getRecruiterDashboard = async (req, res, next) => {
  try {
    const stats = await getRecruiterStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const stats = await getAdminStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
const getRecentActivity = async (req, res, next) => {
  try {
    // Implementation for recent activity
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/dashboard/analytics
// @access  Private/Recruiter/Admin
const getAnalytics = async (req, res, next) => {
  try {
    // Implementation for analytics
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports
// @route   GET /api/dashboard/reports
// @access  Private/Admin
const getReports = async (req, res, next) => {
  try {
    // Implementation for reports
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getApplicantDashboard,
  getRecruiterDashboard,
  getAdminDashboard,
  getRecentActivity,
  getAnalytics,
  getReports
};
