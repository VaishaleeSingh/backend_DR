const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = { status: 'active' };

    // Filters
    if (req.query.type) query.type = req.query.type;
    if (req.query.category) query.category = req.query.category;
    if (req.query.location) query.location = new RegExp(req.query.location, 'i');
    if (req.query.company) query.company = new RegExp(req.query.company, 'i');
    if (req.query.remote) query.remote = req.query.remote === 'true';

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Experience filter
    if (req.query.minExperience || req.query.maxExperience) {
      query['experience.min'] = {};
      if (req.query.minExperience) query['experience.min'].$gte = parseInt(req.query.minExperience);
      if (req.query.maxExperience) query['experience.max'].$lte = parseInt(req.query.maxExperience);
    }

    // Salary filter
    if (req.query.minSalary || req.query.maxSalary) {
      query['salary.min'] = {};
      if (req.query.minSalary) query['salary.min'].$gte = parseInt(req.query.minSalary);
      if (req.query.maxSalary) query['salary.max'].$lte = parseInt(req.query.maxSalary);
    }

    // Sort
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'salary_high':
          sort = { 'salary.max': -1 };
          break;
        case 'salary_low':
          sort = { 'salary.min': 1 };
          break;
        case 'featured':
          sort = { featured: -1, createdAt: -1 };
          break;
      }
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName company')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName company email phone');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views if user is not the poster
    if (!req.user || req.user._id.toString() !== job.postedBy._id.toString()) {
      await job.incrementViews();
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private/Recruiter
const createJob = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.postedBy = req.user.id;

    const job = await Job.create(req.body);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Recruiter (own jobs) or Admin
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Recruiter (own jobs) or Admin
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get jobs posted by current user
// @route   GET /api/jobs/my-jobs
// @access  Private/Recruiter
const getMyJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ postedBy: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments({ postedBy: req.user.id });

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res, next) => {
  try {
    // Use the same logic as getJobs but with text search focus
    return getJobs(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
const getFeaturedJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ featured: true, status: 'active' })
      .populate('postedBy', 'firstName lastName company')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get job statistics
// @route   GET /api/jobs/:id/stats
// @access  Private/Recruiter (own jobs) or Admin
const getJobStats = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view job statistics'
      });
    }

    const stats = {
      views: job.viewsCount,
      applications: job.applicationsCount,
      // Add more statistics as needed
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle job status
// @route   PATCH /api/jobs/:id/status
// @access  Private/Recruiter (own jobs) or Admin
const toggleJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'paused', 'closed', 'filled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job.status = status;
    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate job
// @route   POST /api/jobs/:id/duplicate
// @access  Private/Recruiter (own jobs) or Admin
const duplicateJob = async (req, res, next) => {
  try {
    const originalJob = await Job.findById(req.params.id);

    if (!originalJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (originalJob.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to duplicate this job'
      });
    }

    // Create new job with same data but reset certain fields
    const jobData = originalJob.toObject();
    delete jobData._id;
    delete jobData.createdAt;
    delete jobData.updatedAt;
    delete jobData.applicationsCount;
    delete jobData.viewsCount;
    
    jobData.title = `${jobData.title} (Copy)`;
    jobData.status = 'draft';

    const newJob = await Job.create(jobData);

    res.status(201).json({
      success: true,
      data: newJob
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
