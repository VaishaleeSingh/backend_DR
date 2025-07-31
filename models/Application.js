const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'second_interview',
      'final_interview',
      'offer_extended',
      'offer_accepted',
      'offer_declined',
      'hired',
      'rejected',
      'withdrawn'
    ],
    default: 'submitted'
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  parsedResumeData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      address: String,
      linkedIn: String,
      portfolio: String
    },
    summary: String,
    skills: [{
      name: String,
      level: String,
      yearsOfExperience: Number
    }],
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String,
      achievements: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number,
      honors: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }],
    languages: [{
      name: String,
      proficiency: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      startDate: Date,
      endDate: Date
    }]
  },
  aiScreeningScore: {
    overall: {
      type: Number,
      min: 0,
      max: 100
    },
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    experienceMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    educationMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    analysis: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String]
    },
    lastUpdated: Date
  },
  customAnswers: [{
    question: String,
    answer: String,
    required: Boolean
  }],
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    isPrivate: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  interviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  rating: {
    technical: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cultural: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ratedAt: Date
  },
  withdrawalReason: String,
  rejectionReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one application per user per job
applicationSchema.index({ applicant: 1, job: 1 }, { unique: true });

// Other indexes for better query performance
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'aiScreeningScore.overall': -1 });

// Virtual for current interview
applicationSchema.virtual('currentInterview').get(function() {
  if (this.interviews && this.interviews.length > 0) {
    return this.interviews[this.interviews.length - 1];
  }
  return null;
});

// Pre-save middleware to add timeline entry on status change
applicationSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Method to update AI screening score
applicationSchema.methods.updateAIScore = function(scoreData) {
  this.aiScreeningScore = {
    ...scoreData,
    lastUpdated: new Date()
  };
  return this.save();
};

// Method to add note
applicationSchema.methods.addNote = function(content, author, isPrivate = true) {
  this.notes.push({
    content,
    author,
    isPrivate,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status, jobId = null) {
  const query = { status };
  if (jobId) query.job = jobId;
  return this.find(query).populate('applicant job');
};

module.exports = mongoose.model('Application', applicationSchema);
