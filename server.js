const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const dashboardRoutes = require('./routes/dashboard');
const interviewRoutes = require('./routes/interviews');
const resumeRoutes = require('./routes/resumes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - very lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // increased to 10000 requests per windowMs for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
});

// More lenient rate limiting for development
const devLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // 50000 requests per 15 minutes for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

// Apply rate limiting based on environment
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
} else {
  // In development, use more lenient rate limiting
  app.use('/api/', devLimiter);
}

// CORS configuration - more permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000', 
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173',
      'http://localhost:8080', // Vue CLI default
      'http://127.0.0.1:8080'
    ];
    
    // Add production frontend URL if set
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('*');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rate limit status endpoint (for debugging)
app.get('/api/rate-limit-status', (req, res) => {
  res.status(200).json({
    message: 'Rate limit status',
    environment: process.env.NODE_ENV,
    rateLimitWindow: process.env.NODE_ENV === 'production' ? '15 minutes' : '15 minutes',
    maxRequests: process.env.NODE_ENV === 'production' ? '10000' : '50000',
    currentTime: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resumes', resumeRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Recruitment Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment_system';
    console.log('Connecting to MongoDB:', mongoUri);
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 To fix this:');
    console.log('   1. Install MongoDB locally, or');
    console.log('   2. Update MONGODB_URI in .env with your MongoDB Atlas connection string');
  }
};

// Connect to database (non-blocking)
connectDB();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🌐 API Base URL: http://localhost:${PORT}/api
📱 Frontend URL: ${process.env.FRONTEND_URL}
  `);
});

module.exports = app;
