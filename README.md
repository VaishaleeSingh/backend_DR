# Recruitment Management System - Backend API

A comprehensive Node.js/Express backend API for the Recruitment Management System with MongoDB integration.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Support for applicants, recruiters, and administrators
- **Job Management**: CRUD operations for job postings with advanced filtering
- **Application Management**: Handle job applications with status tracking
- **Interview Management**: Schedule and manage interviews
- **Dashboard Analytics**: Role-specific dashboard statistics
- **File Upload**: Resume and document upload functionality
- **Security**: Helmet, rate limiting, input validation, and CORS protection
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recruitment-management-system/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the server root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/recruitment_management
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recruitment_management?retryWrites=true&w=majority

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d

   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000

   # Security
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Database Setup**
   
   **Option 1: Local MongoDB**
   - Install MongoDB locally
   - Start MongoDB service
   - Use: `MONGODB_URI=mongodb://localhost:27017/recruitment_management`

   **Option 2: MongoDB Atlas (Cloud)**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Replace the MONGODB_URI in .env file

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Job Endpoints
- `GET /api/jobs` - Get all jobs (with filtering)
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job (recruiters only)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Application Endpoints
- `GET /api/applications` - Get applications
- `POST /api/applications` - Create application
- `GET /api/applications/my-applications` - Get user's applications
- `PATCH /api/applications/:id/status` - Update application status

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/applicant` - Applicant dashboard
- `GET /api/dashboard/recruiter` - Recruiter dashboard
- `GET /api/dashboard/admin` - Admin dashboard

### Health Check
- `GET /health` - Server health status

## 🔐 User Roles

1. **Applicant**
   - Apply for jobs
   - View application status
   - Upload resume
   - Manage profile

2. **Recruiter**
   - Post jobs
   - Manage applications
   - Schedule interviews
   - View analytics

3. **Admin**
   - Manage all users
   - View system analytics
   - Manage all jobs and applications

## 🗄️ Database Schema

### User Model
- Personal information (name, email, phone)
- Role-based fields (skills for applicants, company for recruiters)
- Authentication data (password, tokens)

### Job Model
- Job details (title, description, requirements)
- Company information
- Salary and experience requirements
- Application deadline and status

### Application Model
- Job and applicant references
- Application status tracking
- Cover letter and resume
- Timeline and notes

### Interview Model
- Interview scheduling and management
- Feedback and ratings
- Status tracking

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Prevent abuse with configurable limits
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express apps

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | Required |
| JWT_SECRET | JWT signing secret | Required |
| JWT_EXPIRE | JWT expiration time | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "recruitment-api"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the environment configuration

---

**Happy Coding! 🎉**
#   b a c k e n d _ D R  
 