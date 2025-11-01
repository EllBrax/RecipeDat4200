import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('📊 Connected to MongoDB');
    
    // Define User schema (same as in your models)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', userSchema);
    
    // Get all users
    User.find({})
      .select('-password') // Exclude password for security
      .then(users => {
        console.log('\n👥 Users in your database:');
        console.log('========================');
        
        if (users.length === 0) {
          console.log('No users found in the database.');
        } else {
          users.forEach((user, index) => {
            console.log(`${index + 1}. Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
            console.log('   ---');
          });
        }
        
        console.log(`\nTotal users: ${users.length}`);
        process.exit(0);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
