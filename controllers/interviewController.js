const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Get all interviews (for recruiters/admins)
// @route   GET /api/interviews
// @access  Private/Admin
const getInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, applicationId, jobId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (applicationId) query.application = applicationId;
    if (jobId) query.job = jobId;

    const interviews = await Interview.find(query)
      .populate('application', 'status')
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        interviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('application', 'status')
      .populate('job', 'title company description requirements')
      .populate('applicant', 'firstName lastName email phone')
      .populate('interviewer', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { interview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new interview
// @route   POST /api/interviews
// @access  Private/Recruiter/Admin
const createInterview = async (req, res, next) => {
  try {
    const { applicationId, scheduledDate, type, location, notes, duration, interviewerId } = req.body;

    // Check if application exists
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('applicant');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if interview already exists for this application
    const existingInterview = await Interview.findOne({ application: applicationId });
    if (existingInterview) {
      return res.status(400).json({
        success: false,
        message: 'Interview already scheduled for this application'
      });
    }

    // Create interview
    const interview = await Interview.create({
      application: applicationId,
      job: application.job._id,
      applicant: application.applicant._id,
      interviewer: interviewerId || req.user.id,
      type,
      scheduledDate,
      duration: duration || 60,
      location,
      notes: notes || '',
      status: 'scheduled'
    });

    // Add note to history if notes provided
    if (notes) {
      interview.noteHistory.push({
        author: req.user.id,
        content: notes,
        createdAt: new Date()
      });
      await interview.save();
    }

    // Update application status to interview_scheduled
    await Application.findByIdAndUpdate(applicationId, {
      status: 'interview_scheduled'
    });

    // Populate the created interview
    const populatedInterview = await Interview.findById(interview._id)
      .populate('application', 'status')
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: { interview: populatedInterview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private/Recruiter/Admin
const updateInterview = async (req, res, next) => {
  try {
    const { scheduledDate, type, location, notes, duration } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Update interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      req.params.id,
      {
        scheduledDate,
        type,
        location,
        duration
      },
      { new: true, runValidators: true }
    ).populate('application', 'status')
     .populate('job', 'title company')
     .populate('applicant', 'firstName lastName email')
     .populate('interviewer', 'firstName lastName email');

    // Add note if provided
    if (notes) {
      updatedInterview.notes.push({
        author: req.user.id,
        content: notes,
        createdAt: new Date()
      });
      await updatedInterview.save();
    }

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      data: { interview: updatedInterview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private/Recruiter/Admin
const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Update application status back to shortlisted
    await Application.findByIdAndUpdate(interview.application, {
      status: 'shortlisted'
    });

    await Interview.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's interviews
// @route   GET /api/interviews/my-interviews
// @access  Private
const getMyInterviews = async (req, res, next) => {
  try {
    console.log('getMyInterviews called for user:', req.user);
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (req.user.role === 'applicant') {
      // For applicants, get interviews for their applications
      const userApplications = await Application.find({ applicant: req.user.id }).select('_id');
      console.log('User applications:', userApplications);
      query.application = { $in: userApplications.map(app => app._id) };
    } else if (req.user.role === 'recruiter') {
      // For recruiters, get interviews they're conducting
      query.interviewer = req.user.id;
    }

    if (status) query.status = status;

    console.log('Interview query:', query);

    const interviews = await Interview.find(query)
      .populate('application', 'status')
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found interviews:', interviews.length);

    const total = await Interview.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        interviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('getMyInterviews error:', error);
    next(error);
  }
};

// @desc    Update interview status
// @route   PATCH /api/interviews/:id/status
// @access  Private
const updateInterviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Update interview status
    interview.status = status;
    await interview.save();

    // Update application status based on interview status
    if (status === 'completed') {
      await Application.findByIdAndUpdate(interview.application, {
        status: 'interviewed'
      });
    } else if (status === 'cancelled') {
      await Application.findByIdAndUpdate(interview.application, {
        status: 'shortlisted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview status updated successfully',
      data: { interview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add feedback to interview
// @route   POST /api/interviews/:id/feedback
// @access  Private/Recruiter/Admin
const addFeedback = async (req, res, next) => {
  try {
    const { feedback, rating, strengths, areasOfImprovement } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    interview.feedback = feedback;
    interview.rating = rating;
    interview.strengths = strengths;
    interview.areasOfImprovement = areasOfImprovement;
    interview.feedbackDate = new Date();
    interview.feedbackBy = req.user.id;

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      data: { interview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule interview
// @route   PATCH /api/interviews/:id/reschedule
// @access  Private
const rescheduleInterview = async (req, res, next) => {
  try {
    const { scheduledDate, notes } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    interview.scheduledDate = scheduledDate;
    if (notes) interview.notes = notes;
    interview.status = 'scheduled';

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: { interview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interviews by date
// @route   GET /api/interviews/date/:date
// @access  Private
const getInterviewsByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const interviews = await Interview.find({
      scheduledDate: {
        $gte: startDate,
        $lt: endDate
      }
    }).populate('application', 'status')
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: { interviews }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming interviews
// @route   GET /api/interviews/upcoming
// @access  Private
const getUpcomingInterviews = async (req, res, next) => {
  try {
    const now = new Date();
    
    let query = {
      scheduledDate: { $gte: now },
      status: { $nin: ['cancelled', 'completed'] }
    };

    if (req.user.role === 'applicant') {
      const userApplications = await Application.find({ applicant: req.user.id }).select('_id');
      query.application = { $in: userApplications.map(app => app._id) };
    } else if (req.user.role === 'recruiter') {
      query.interviewer = req.user.id;
    }

    const interviews = await Interview.find(query)
      .populate('application', 'status')
      .populate('job', 'title company')
      .populate('applicant', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email')
      .sort({ scheduledDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: { interviews }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
