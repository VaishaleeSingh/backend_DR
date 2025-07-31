const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a more robust path that works in both local and deployed environments
    let uploadPath;
    if (process.env.NODE_ENV === 'production') {
      // In production, use a path that persists across deployments
      uploadPath = path.join(process.cwd(), 'uploads', 'resumes');
    } else {
      // In development, use relative path
      uploadPath = path.join(__dirname, '../uploads/resumes');
    }
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `resume-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Configure storage for interview attachments
const interviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/interviews');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `interview-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Configure storage for company logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/logos');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `logo-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter for resumes
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

// File filter for images (logos)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// File filter for general documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPEG, and PNG files are allowed.'), false);
  }
};

// File size limits
const fileSizeLimits = {
  resume: 5 * 1024 * 1024, // 5MB
  image: 2 * 1024 * 1024,  // 2MB
  document: 10 * 1024 * 1024 // 10MB
};

// Create multer instances
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: fileSizeLimits.resume
  }
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: fileSizeLimits.image
  }
});

const uploadInterviewAttachment = multer({
  storage: interviewStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: fileSizeLimits.document
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please upload a smaller file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please upload fewer files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'File upload error occurred.'
  });
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date()
  };
};

// Utility function to validate file size
const validateFileSize = (size, type) => {
  const maxSize = fileSizeLimits[type] || fileSizeLimits.document;
  return size <= maxSize;
};

// Utility function to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Utility function to generate safe filename
const generateSafeFilename = (originalName) => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  return `${safeName}_${timestamp}${extension}`;
};

// Cleanup old files (utility for maintenance)
const cleanupOldFiles = (directory, maxAgeInDays = 30) => {
  try {
    const files = fs.readdirSync(directory);
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

module.exports = {
  uploadResume,
  uploadLogo,
  uploadInterviewAttachment,
  handleUploadError,
  deleteFile,
  getFileInfo,
  validateFileSize,
  getFileExtension,
  generateSafeFilename,
  cleanupOldFiles,
  fileSizeLimits
};
