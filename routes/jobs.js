const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateJob, validatePagination, validateObjectId } = require('../middleware/validation');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  searchJobs,
  getFeaturedJobs,
  getJobStats,
  toggleJobStatus,
  duplicateJob
} = require('../controllers/jobController');

// @route   GET /api/jobs
// @desc    Get all jobs with filtering and pagination
// @access  Public
router.get('/', optionalAuth, validatePagination, getJobs);

// @route   GET /api/jobs/search
// @desc    Search jobs
// @access  Public
router.get('/search', optionalAuth, validatePagination, searchJobs);

// @route   GET /api/jobs/featured
// @desc    Get featured jobs
// @access  Public
router.get('/featured', optionalAuth, getFeaturedJobs);

// @route   GET /api/jobs/my-jobs
// @desc    Get jobs posted by current user (recruiters only)
// @access  Private/Recruiter
router.get('/my-jobs', protect, authorize('recruiter', 'admin'), validatePagination, getMyJobs);

// @route   POST /api/jobs
// @desc    Create new job (recruiters only)
// @access  Private/Recruiter
router.post('/', protect, authorize('recruiter', 'admin'), validateJob, createJob);

// @route   GET /api/jobs/:id
// @desc    Get single job
// @access  Public
router.get('/:id', optionalAuth, validateObjectId('id'), getJob);

// @route   PUT /api/jobs/:id
// @desc    Update job
// @access  Private/Recruiter (own jobs) or Admin
router.put('/:id', protect, authorize('recruiter', 'admin'), validateObjectId('id'), validateJob, updateJob);

// @route   DELETE /api/jobs/:id
// @desc    Delete job
// @access  Private/Recruiter (own jobs) or Admin
router.delete('/:id', protect, authorize('recruiter', 'admin'), validateObjectId('id'), deleteJob);

// @route   PATCH /api/jobs/:id/status
// @desc    Toggle job status (active/paused/closed)
// @access  Private/Recruiter (own jobs) or Admin
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), validateObjectId('id'), toggleJobStatus);

// @route   POST /api/jobs/:id/duplicate
// @desc    Duplicate job
// @access  Private/Recruiter (own jobs) or Admin
router.post('/:id/duplicate', protect, authorize('recruiter', 'admin'), validateObjectId('id'), duplicateJob);

// @route   GET /api/jobs/:id/stats
// @desc    Get job statistics
// @access  Private/Recruiter (own jobs) or Admin
router.get('/:id/stats', protect, authorize('recruiter', 'admin'), validateObjectId('id'), getJobStats);

module.exports = router;
