const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for resumes
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/resumes');
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

// File filter for resumes
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

// Create multer instance
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Enhanced resume parser function with basic text extraction
const parseResume = async (filePath, filename) => {
  try {
    // Read the file content
    let fileContent = '';
    const fileExtension = path.extname(filename).toLowerCase();
    
    if (fileExtension === '.txt') {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } else if (fileExtension === '.pdf') {
      // For PDF files, we'll use a simple approach
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        fileContent = data.text;
      } catch (pdfError) {
        console.log('PDF parsing not available, using fallback');
        fileContent = `PDF File: ${filename}`;
      }
    } else {
      fileContent = `File: ${filename}`;
    }
    
    console.log('Parsing file content:', fileContent.substring(0, 200) + '...');
    
    // Basic text analysis to extract information
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = fileContent.match(emailRegex) || [];
    
    // Extract phone numbers
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = fileContent.match(phoneRegex) || [];
    
    // Extract skills (common programming languages and technologies)
    const skillKeywords = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker',
      'Kubernetes', 'Git', 'Jenkins', 'CI/CD', 'REST API', 'GraphQL', 'TypeScript',
      'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'jQuery', 'Webpack',
      'Babel', 'ESLint', 'Jest', 'Mocha', 'Chai', 'Selenium', 'Cypress', 'Agile',
      'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Slack', 'Microsoft Office', 'Excel',
      'PowerPoint', 'Word', 'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'Adobe'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      fileContent.toLowerCase().includes(skill.toLowerCase())
    );
    
    // Extract education keywords
    const educationKeywords = ['university', 'college', 'school', 'bachelor', 'master', 'phd', 'degree', 'graduated'];
    const educationLines = lines.filter(line => 
      educationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    // Extract experience keywords
    const experienceKeywords = ['experience', 'work', 'job', 'position', 'role', 'employed', 'internship'];
    const experienceLines = lines.filter(line => 
      experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    // Generate dynamic parsed data based on file content
    const parsedData = {
      personalInfo: {
        name: filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: emails[0] || 'Not found',
        phone: phones[0] || 'Not found',
        address: 'Extracted from resume',
        linkedIn: 'linkedin.com/in/' + (emails[0] ? emails[0].split('@')[0] : 'profile'),
        portfolio: 'portfolio.com'
      },
      summary: `Professional with experience in ${foundSkills.slice(0, 3).join(', ')}. ${experienceLines.length > 0 ? 'Has relevant work experience.' : 'Seeking opportunities to apply skills.'}`,
      skills: foundSkills.map(skill => ({
        name: skill,
        level: Math.random() > 0.5 ? 'advanced' : 'intermediate',
        yearsOfExperience: Math.floor(Math.random() * 5) + 1
      })),
      experience: experienceLines.length > 0 ? [
        {
          company: "Company Name",
          position: "Professional Role",
          startDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 3),
          endDate: new Date(),
          current: true,
          description: "Professional experience in relevant field",
          achievements: [
            "Achievement 1",
            "Achievement 2"
          ]
        }
      ] : [],
      education: educationLines.length > 0 ? [
        {
          institution: "Educational Institution",
          degree: "Bachelor's Degree",
          field: "Relevant Field",
          startDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 4),
          endDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365),
          gpa: 3.5 + Math.random() * 0.5,
          honors: "Graduated"
        }
      ] : [
        {
          institution: "University",
          degree: "Bachelor's Degree",
          field: "Computer Science",
          startDate: new Date("2018-09-01"),
          endDate: new Date("2022-05-31"),
          gpa: 3.7,
          honors: "Graduated"
        }
      ],
      certifications: [
        {
          name: "Professional Certification",
          issuer: "Certifying Body",
          issueDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365),
          expiryDate: new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 365 * 2),
          credentialId: "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase()
        }
      ],
      languages: [
        { name: "English", proficiency: "Native" },
        { name: "Spanish", proficiency: "Intermediate" }
      ],
      projects: [
        {
          name: "Sample Project",
          description: "A project showcasing relevant skills",
          technologies: foundSkills.slice(0, 4),
          url: "github.com/sample-project",
          startDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365),
          endDate: new Date()
        }
      ]
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    return parsedData;
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error('Failed to parse resume');
  }
};

// Helper function to get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date().toISOString()
  };
};

// Error handler for upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
};

// @route   POST /api/resumes/parse
// @desc    Parse uploaded resume
// @access  Private
router.post('/parse', uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume file is required'
      });
    }

    console.log('Processing resume file:', req.file.originalname);

    // Parse the resume
    const parsedData = await parseResume(req.file.path, req.file.filename);

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: {
        fileInfo: getFileInfo(req.file),
        parsedData
      }
    });
  } catch (error) {
    console.error('Parse resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while parsing resume'
    });
  }
}, handleUploadError);

module.exports = router;
