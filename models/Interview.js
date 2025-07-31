const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application reference is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Interviewer reference is required']
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical', 'hr', 'final'],
    required: [true, 'Interview type is required']
  },
  round: {
    type: Number,
    min: 1,
    default: 1
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  duration: {
    type: Number, // in minutes
    min: 15,
    max: 480, // 8 hours max
    default: 60
  },
  location: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', 'no_show'],
    default: 'scheduled'
  },
  agenda: [{
    topic: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      min: 5
    },
    description: String
  }],
  questions: [{
    question: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'situational', 'cultural', 'general']
    },
    answer: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  }],
  feedback: {
    technical: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    communication: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    problemSolving: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    cultural: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    overall: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      recommendation: {
        type: String,
        enum: ['strongly-recommend', 'recommend', 'neutral', 'not-recommend', 'strongly-not-recommend']
      }
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  noteHistory: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'notification']
    },
    recipient: {
      type: String,
      enum: ['applicant', 'interviewer', 'both']
    },
    scheduledFor: Date,
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  actualStartTime: Date,
  actualEndTime: Date,
  rescheduledFrom: Date,
  rescheduledReason: String,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ interviewer: 1, scheduledDate: 1 });
interviewSchema.index({ applicant: 1 });
interviewSchema.index({ application: 1 });

// Virtual for formatted duration
interviewSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

// Virtual for overall rating
interviewSchema.virtual('overallRating').get(function() {
  if (!this.feedback.overall.rating) return null;
  return this.feedback.overall.rating;
});

// Method to calculate average rating
interviewSchema.methods.calculateAverageRating = function() {
  const ratings = [];
  
  if (this.feedback.technical.rating) ratings.push(this.feedback.technical.rating);
  if (this.feedback.communication.rating) ratings.push(this.feedback.communication.rating);
  if (this.feedback.problemSolving.rating) ratings.push(this.feedback.problemSolving.rating);
  if (this.feedback.cultural.rating) ratings.push(this.feedback.cultural.rating);
  
  if (ratings.length === 0) return null;
  
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
};

// Method to add note
interviewSchema.methods.addNote = function(author, content, isPrivate = false) {
  this.notes.push({
    author,
    content,
    isPrivate,
    createdAt: new Date()
  });
  return this.save();
};

// Method to reschedule
interviewSchema.methods.reschedule = function(newDate, reason) {
  this.rescheduledFrom = this.scheduledDate;
  this.scheduledDate = newDate;
  this.rescheduledReason = reason;
  this.status = 'rescheduled';
  return this.save();
};

module.exports = mongoose.model('Interview', interviewSchema);
