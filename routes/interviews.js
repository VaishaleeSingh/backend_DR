const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateInterview, validatePagination, validateObjectId } = require('../middleware/validation');
const {
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  getMyInterviews,
  updateInterviewStatus,
  addFeedback,
  rescheduleInterview,
  getInterviewsByDate,
  getUpcomingInterviews
} = require('../controllers/interviewController');

// @route   GET /api/interviews
// @desc    Get interviews (filtered by user role)
// @access  Private
router.get('/', protect, validatePagination, getInterviews);

// @route   GET /api/interviews/my-interviews
// @desc    Get current user's interviews
// @access  Private
router.get('/my-interviews', protect, validatePagination, getMyInterviews);

// @route   GET /api/interviews/upcoming
// @desc    Get upcoming interviews for current user
// @access  Private
router.get('/upcoming', protect, getUpcomingInterviews);

// @route   GET /api/interviews/date/:date
// @desc    Get interviews by date
// @access  Private
router.get('/date/:date', protect, getInterviewsByDate);

// @route   POST /api/interviews
// @desc    Create new interview (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.post('/', protect, authorize('recruiter', 'admin'), validateInterview, createInterview);

// @route   GET /api/interviews/:id
// @desc    Get single interview
// @access  Private
router.get('/:id', protect, validateObjectId('id'), getInterview);

// @route   PUT /api/interviews/:id
// @desc    Update interview
// @access  Private/Recruiter/Admin
router.put('/:id', protect, authorize('recruiter', 'admin'), validateObjectId('id'), validateInterview, updateInterview);

// @route   DELETE /api/interviews/:id
// @desc    Delete interview
// @access  Private/Recruiter/Admin
router.delete('/:id', protect, authorize('recruiter', 'admin'), validateObjectId('id'), deleteInterview);

// @route   PATCH /api/interviews/:id/status
// @desc    Update interview status
// @access  Private
router.patch('/:id/status', protect, validateObjectId('id'), updateInterviewStatus);

// @route   POST /api/interviews/:id/feedback
// @desc    Add feedback to interview (interviewers only)
// @access  Private/Recruiter/Admin
router.post('/:id/feedback', protect, authorize('recruiter', 'admin'), validateObjectId('id'), addFeedback);

// @route   PATCH /api/interviews/:id/reschedule
// @desc    Reschedule interview
// @access  Private
router.patch('/:id/reschedule', protect, validateObjectId('id'), rescheduleInterview);

module.exports = router;
