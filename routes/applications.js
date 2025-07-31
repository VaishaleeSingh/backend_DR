const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateApplication, validatePagination, validateObjectId } = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and DOC files for resumes
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed for resumes'), false);
    }
  }
});
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getMyApplications,
  updateApplicationStatus,
  addNote,
  rateApplication,
  getApplicationsByJob,
  exportApplications,
  bulkUpdateStatus
} = require('../controllers/applicationController');

// @route   GET /api/applications
// @desc    Get all applications (recruiter/admin only)
// @access  Private/Recruiter/Admin
router.get('/', protect, authorize('recruiter', 'admin'), validatePagination, getApplications);

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications (applicants only)
// @access  Private/Applicant
router.get('/my-applications', protect, authorize('applicant'), validatePagination, getMyApplications);

// @route   POST /api/applications
// @desc    Create new application (applicants only)
// @access  Private/Applicant
router.post('/', protect, authorize('applicant'), upload.single('resume'), validateApplication, createApplication);

// @route   GET /api/applications/job/:jobId
// @desc    Get applications for a specific job (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), validateObjectId('jobId'), validatePagination, getApplicationsByJob);

// @route   GET /api/applications/:id
// @desc    Get single application
// @access  Private
router.get('/:id', protect, validateObjectId('id'), getApplication);

// @route   PUT /api/applications/:id
// @desc    Update application (applicant can update own, recruiter/admin can update any)
// @access  Private
router.put('/:id', protect, validateObjectId('id'), validateApplication, updateApplication);

// @route   DELETE /api/applications/:id
// @desc    Delete application (applicant can delete own, admin can delete any)
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), deleteApplication);

// @route   PATCH /api/applications/:id/status
// @desc    Update application status (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), validateObjectId('id'), updateApplicationStatus);

// @route   POST /api/applications/:id/notes
// @desc    Add note to application
// @access  Private
router.post('/:id/notes', protect, validateObjectId('id'), addNote);

// @route   POST /api/applications/:id/rating
// @desc    Rate application (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.post('/:id/rating', protect, authorize('recruiter', 'admin'), validateObjectId('id'), rateApplication);

// @route   GET /api/applications/export/:jobId
// @desc    Export applications for a job (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.get('/export/:jobId', protect, authorize('recruiter', 'admin'), validateObjectId('jobId'), exportApplications);

// @route   PATCH /api/applications/bulk-status
// @desc    Bulk update application status (recruiters/admin only)
// @access  Private/Recruiter/Admin
router.patch('/bulk-status', protect, authorize('recruiter', 'admin'), bulkUpdateStatus);

module.exports = router;
