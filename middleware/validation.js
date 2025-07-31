const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .isIn(['applicant', 'recruiter'])
    .withMessage('Role must be either applicant or recruiter'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Job validation rules
const validateJob = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3 and 100 characters'),
  
  body('company')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Job description must be between 50 and 5000 characters'),
  
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
    .withMessage('Invalid job type'),
  
  body('category')
    .isIn(['technology', 'marketing', 'sales', 'design', 'finance', 'hr', 'operations', 'customer-service', 'other'])
    .withMessage('Invalid job category'),
  
  body('applicationDeadline')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  
  body('experience.min')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum experience must be a non-negative integer'),
  
  body('experience.max')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum experience must be a non-negative integer')
    .custom((value, { req }) => {
      if (req.body.experience && req.body.experience.min && value < req.body.experience.min) {
        throw new Error('Maximum experience must be greater than or equal to minimum experience');
      }
      return true;
    }),
  
  body('salary.min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a non-negative number'),
  
  body('salary.max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a non-negative number')
    .custom((value, { req }) => {
      if (req.body.salary && req.body.salary.min && value < req.body.salary.min) {
        throw new Error('Maximum salary must be greater than or equal to minimum salary');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Application validation rules
const validateApplication = [
  body('coverLetter')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
  
  body('expectedSalary.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Expected salary must be a non-negative number'),
  
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  
  body('availableFrom')
    .optional()
    .isISO8601()
    .toDate(),
  
  body('noticePeriod')
    .optional()
    .isIn(['immediate', '1-week', '2-weeks', '1-month', '2-months', '3-months', 'other'])
    .withMessage('Invalid notice period'),
  
  body('willingToRelocate')
    .optional()
    .isBoolean()
    .withMessage('Willing to relocate must be a boolean'),
  
  handleValidationErrors
];

// Interview validation rules
const validateInterview = [
  body('type')
    .isIn(['phone', 'video', 'in-person', 'technical', 'hr', 'final'])
    .withMessage('Invalid interview type'),
  
  body('scheduledDate')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error('Interview date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('round')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Round must be a positive integer'),
  
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateJob,
  validateApplication,
  validateInterview,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};
