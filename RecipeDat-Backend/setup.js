#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Setting up RecipeDat Backend...\n');

// Create uploads directory
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create .env file if it doesn't exist
const envFile = '.env';
const envExample = 'env.example';

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('✅ Created .env file from template');
    console.log('⚠️  Please edit .env file with your configuration');
  } else {
    // Create basic .env file
    const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/recipedat

# JWT Secret (generate a strong secret key)
JWT_SECRET=your-super-secret-jwt-key-here-${Math.random().toString(36).substring(2, 15)}
JWT_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS
FRONTEND_URL=http://localhost:5173
`;
    fs.writeFileSync(envFile, envContent);
    console.log('✅ Created .env file with default values');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if MongoDB is running (optional)
try {
  execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet', { stdio: 'ignore' });
  console.log('✅ MongoDB is running');
} catch (error) {
  console.log('⚠️  MongoDB not detected. Please ensure MongoDB is installed and running');
  console.log('   You can use MongoDB Atlas (cloud) or install MongoDB locally');
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Install dependencies: npm install');
console.log('3. Start development server: npm run dev');
console.log('\nAPI will be available at: http://localhost:3001');
console.log('Health check: http://localhost:3001/api/health');






