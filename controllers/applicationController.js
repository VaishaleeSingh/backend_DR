const Application = require('../models/Application');
const Job = require('../models/Job');
const path = require('path');
const fs = require('fs');

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Recruiter/Admin
const getApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    let totalQuery = {};

    // If user is recruiter, only show applications for their jobs
    if (req.user.role === 'recruiter') {
      const userJobs = await Job.find({ postedBy: req.user.id }).select('_id');
      const jobIds = userJobs.map(job => job._id);
      query.job = { $in: jobIds };
      totalQuery.job = { $in: jobIds };
    }

    const applications = await Application.find(query)
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(totalQuery);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
const getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company description requirements')
      .populate('applicant', 'firstName lastName email phone')
      .populate('notes.author', 'firstName lastName');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isOwner = application.applicant._id.toString() === req.user.id;
    const isJobOwner = await Job.findOne({ _id: application.job._id, postedBy: req.user.id });
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private/Applicant
const createApplication = async (req, res, next) => {
  try {
    // Extract form data (multer parses multipart/form-data)
    const { jobId, coverLetter, customAnswers } = req.body;
    const resumeFile = req.file; // File uploaded via multer

    // Debug logging
    console.log('=== APPLICATION CONTROLLER DEBUG ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.file:', req.file ? 'File present' : 'No file');
    console.log('req.headers:', req.headers['content-type']);
    console.log('Received jobId:', jobId);
    console.log('jobId type:', typeof jobId);
    console.log('jobId length:', jobId?.length);

    const job = await Job.findById(jobId);
    console.log('Job found:', !!job);
    if (job) {
      console.log('Job status:', job.status);
      console.log('Job title:', job.title);
    }
    console.log('=== END CONTROLLER DEBUG ===');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Job is not accepting applications'
      });
    }

    // Check if application deadline has passed
    if (new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Prepare application data
    const applicationData = {
      job: jobId,
      applicant: req.user.id,
      coverLetter: coverLetter || '',
      customAnswers: customAnswers ? JSON.parse(customAnswers) : []
    };

    // Handle resume file if uploaded
    if (resumeFile) {
      applicationData.resume = {
        filename: resumeFile.filename,
        originalName: resumeFile.originalname,
        path: resumeFile.path,
        size: resumeFile.size,
        mimetype: resumeFile.mimetype,
        uploadedAt: new Date()
      };
    }

    // Create application
    const application = await Application.create(applicationData);

    // Update job applications count
    await job.updateApplicationsCount();

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: populatedApplication
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = async (req, res, next) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isOwner = application.applicant.toString() === req.user.id;
    const isJobOwner = await Job.findOne({ _id: application.job, postedBy: req.user.id });
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    // Applicants can only update certain fields
    if (isOwner && !isJobOwner && !isAdmin) {
      const allowedFields = ['coverLetter', 'expectedSalary', 'availableFrom', 'noticePeriod', 'willingToRelocate'];
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      req.body = updateData;
    }

    application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('job', 'title company')
     .populate('applicant', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isOwner = application.applicant.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this application'
      });
    }

    await application.deleteOne();

    // Update job applications count
    const job = await Job.findById(application.job);
    if (job) {
      await job.updateApplicationsCount();
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's applications
// @route   GET /api/applications/my-applications
// @access  Private/Applicant
const getMyApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ applicant: req.user.id })
      .populate('job', 'title company location type status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments({ applicant: req.user.id });

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private/Recruiter/Admin
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const validStatuses = [
      'pending', 'reviewing', 'shortlisted', 'interview_scheduled',
      'interviewed', 'selected', 'rejected', 'withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns the job or is admin
    const job = await Job.findById(application.job);
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    application._changedBy = req.user.id;
    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// Placeholder implementations for remaining functions
const addNote = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Note added' });
  } catch (error) {
    next(error);
  }
};

const rateApplication = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Application rated' });
  } catch (error) {
    next(error);
  }
};

const getApplicationsByJob = async (req, res, next) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

const exportApplications = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Applications exported' });
  } catch (error) {
    next(error);
  }
};

const bulkUpdateStatus = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Download resume for an application
// @route   GET /api/applications/:id/resume
// @access  Private
const downloadResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isOwner = application.applicant._id.toString() === req.user.id;
    const isJobOwner = await Job.findOne({ _id: application.job._id, postedBy: req.user.id });
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isJobOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this resume'
      });
    }

    // Check if resume exists
    if (!application.resume || !application.resume.path) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found for this application'
      });
    }

    // Try multiple possible file paths for different environments
    let filePath = application.resume.path;
    let fileExists = false;

    // Check if file exists at the stored path
    if (fs.existsSync(filePath)) {
      fileExists = true;
    } else {
      // Try alternative paths for deployed environments
      const possiblePaths = [
        path.join(__dirname, '..', 'uploads', 'resumes', application.resume.filename),
        path.join(__dirname, '..', 'uploads', 'resumes', application.resume.originalName),
        path.join(process.cwd(), 'uploads', 'resumes', application.resume.filename),
        path.join(process.cwd(), 'uploads', 'resumes', application.resume.originalName),
        path.join('/tmp', 'uploads', 'resumes', application.resume.filename),
        path.join('/tmp', 'uploads', 'resumes', application.resume.originalName)
      ];

      for (const altPath of possiblePaths) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          fileExists = true;
          break;
        }
      }
    }

    if (!fileExists) {
      console.error('Resume file not found at any location:', {
        originalPath: application.resume.path,
        filename: application.resume.filename,
        originalName: application.resume.originalName
      });
      
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server'
      });
    }

    // Set headers for file download
    const filename = application.resume.originalName || application.resume.filename;
    res.setHeader('Content-Type', application.resume.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', application.resume.size || fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming resume file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading resume file'
        });
      }
    });

  } catch (error) {
    console.error('Download resume error:', error);
    next(error);
  }
};

module.exports = {
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
  bulkUpdateStatus,
  downloadResume
};
