const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the Application model
const Application = require('../models/Application');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment_system';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Function to find resume file in multiple possible locations
const findResumeFile = (resumeData) => {
  if (!resumeData || !resumeData.filename) {
    return null;
  }

  const possiblePaths = [
    // Original path
    resumeData.path,
    // Relative to current working directory
    path.join(process.cwd(), 'uploads', 'resumes', resumeData.filename),
    path.join(process.cwd(), 'uploads', 'resumes', resumeData.originalName),
    // Relative to server directory
    path.join(__dirname, '..', 'uploads', 'resumes', resumeData.filename),
    path.join(__dirname, '..', 'uploads', 'resumes', resumeData.originalName),
    // Temp directory (for some cloud platforms)
    path.join('/tmp', 'uploads', 'resumes', resumeData.filename),
    path.join('/tmp', 'uploads', 'resumes', resumeData.originalName)
  ];

  for (const filePath of possiblePaths) {
    if (filePath && fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};

// Main function to fix resume paths
const fixResumePaths = async () => {
  try {
    console.log('🔍 Finding applications with resume files...');
    
    const applications = await Application.find({
      'resume.filename': { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${applications.length} applications with resume files`);

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const application of applications) {
      console.log(`\n🔍 Processing application ${application._id}`);
      console.log(`   Current path: ${application.resume.path}`);
      console.log(`   Filename: ${application.resume.filename}`);

      const correctPath = findResumeFile(application.resume);

      if (correctPath) {
        if (correctPath !== application.resume.path) {
          console.log(`   ✅ Found file at: ${correctPath}`);
          console.log(`   🔄 Updating path from: ${application.resume.path}`);
          console.log(`   🔄 Updating path to: ${correctPath}`);

          application.resume.path = correctPath;
          await application.save();
          fixedCount++;
        } else {
          console.log(`   ✅ Path is already correct`);
        }
      } else {
        console.log(`   ❌ File not found at any location`);
        notFoundCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} applications`);
    console.log(`   ❌ Not found: ${notFoundCount} applications`);
    console.log(`   📊 Total processed: ${applications.length} applications`);

  } catch (error) {
    console.error('❌ Error fixing resume paths:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await fixResumePaths();
  await mongoose.connection.close();
  console.log('✅ Script completed');
  process.exit(0);
};

runScript().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 