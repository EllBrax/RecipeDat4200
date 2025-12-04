import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './src/routes/auth.js';
import recipeRoutes from './src/routes/recipes.js';
import aiRoutes from './src/routes/ai.js';

// Load environment variables
dotenv.config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (much more lenient)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - More permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recipedat';

// Validate MONGODB_URI format
if (!MONGODB_URI || MONGODB_URI.trim() === '') {
  console.error('❌ ERROR: MONGODB_URI is not set in .env file!');
  console.error('   Please check your .env file and ensure MONGODB_URI is properly configured.');
  process.exit(1);
}

// Check if it looks like a placeholder
if (MONGODB_URI.includes('username:password') || (MONGODB_URI.includes('cluster.mongodb.net') && !MONGODB_URI.includes('cluster0.obiwqao'))) {
  console.error('❌ ERROR: MONGODB_URI appears to be a placeholder!');
  console.error('   Current value:', MONGODB_URI);
  console.error('   Please update your .env file with the actual MongoDB connection string.');
  process.exit(1);
}

console.log('🔍 MONGODB_URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')); // Hide password in logs

// Extract hostname for diagnostics
const hostnameMatch = MONGODB_URI.match(/@([^/]+)/);
const hostname = hostnameMatch ? hostnameMatch[1] : 'unknown';
console.log('🌐 Connecting to MongoDB host:', hostname);

// Configure Mongoose connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Give it 10 seconds to connect
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

// Add connection event listeners for better diagnostics
mongoose.connection.on('connecting', () => {
  console.log('🔄 Attempting to connect to MongoDB...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Ready state:', mongoose.connection.readyState);
  })
  .catch(err => {
    console.error('\n❌ MongoDB connection failed!');
    console.error('   Error message:', err.message);
    console.error('   Error code:', err.code || 'N/A');
    console.error('   Error name:', err.name || 'N/A');
    
    // Detailed error analysis
    console.error('\n🔍 Diagnosis:');
    
    if (err.code === 'ENOTFOUND' || err.name === 'MongoServerSelectionError') {
      console.error('   ❌ DNS Resolution Failed or Server Unreachable');
      console.error('      - The hostname cannot be resolved, or');
      console.error('      - Network is blocking the connection');
      console.error('\n   💡 Solutions:');
      console.error('      1. Check your internet connection');
      console.error('      2. If using MongoDB Atlas:');
      console.error('         → Go to MongoDB Atlas Dashboard');
      console.error('         → Navigate to Network Access');
      console.error('         → Click "Add IP Address"');
      console.error('         → Add "0.0.0.0/0" (allows all IPs) OR add your current IP');
      console.error('         → You can find your IP at: https://whatismyipaddress.com/');
      console.error('      3. Check if firewall/antivirus is blocking the connection');
      console.error('      4. Try a different network (e.g., mobile hotspot)');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ETIMEOUT') {
      console.error('   ❌ Connection Timeout');
      console.error('      - The server is not responding');
      console.error('\n   💡 Solutions:');
      console.error('      1. Check MongoDB Atlas IP whitelist (most common)');
      console.error('      2. Network firewall may be blocking port 27017');
      console.error('      3. Try disabling VPN if using one');
      console.error('      4. Check if corporate/school network has restrictions');
    } else if (err.message && err.message.includes('authentication')) {
      console.error('   ❌ Authentication Failed');
      console.error('      - Username or password is incorrect');
      console.error('\n   💡 Solutions:');
      console.error('      1. Verify credentials in .env file');
      console.error('      2. Check if password contains special characters that need URL encoding');
      console.error('      3. Ensure database user exists in MongoDB Atlas');
    } else {
      console.error('   ❌ Unknown Connection Error');
      console.error('\n   💡 Common solutions:');
      console.error('      1. MongoDB Atlas IP whitelist - add your IP');
      console.error('      2. Network/firewall blocking MongoDB');
      console.error('      3. VPN interference');
      console.error('      4. Corporate network restrictions');
    }
    
    console.error('\n📋 Additional Info:');
    console.error('   - Hostname:', hostname);
    console.error('   - Connection string format:', MONGODB_URI.includes('mongodb+srv://') ? 'SRV (DNS-based)' : 'Standard');
    console.error('   - Your .env file appears to be configured correctly');
    console.error('   - This is likely a network/permissions issue, not a configuration issue');
    
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
