import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    
    // Create a new mock user
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123' // This will be hashed
    };
    
    // Hash the password
    bcrypt.hash(mockUser.password, 10)
      .then(hashedPassword => {
        const newUser = new User({
          name: mockUser.name,
          email: mockUser.email,
          password: hashedPassword
        });
        
        return newUser.save();
      })
      .then(savedUser => {
        console.log('\n✅ New mock user created successfully!');
        console.log('=====================================');
        console.log(`Name: ${savedUser.name}`);
        console.log(`Email: ${savedUser.email}`);
        console.log(`Password: password123`);
        console.log(`Created: ${savedUser.createdAt.toLocaleDateString()}`);
        console.log('\n🔑 Login credentials:');
        console.log('Email: john@example.com');
        console.log('Password: password123');
        console.log('\nYou can now use these credentials to login!');
        process.exit(0);
      })
      .catch(err => {
        if (err.code === 11000) {
          console.log('❌ User with this email already exists!');
          console.log('Try using a different email or delete the existing user first.');
        } else {
          console.error('Error creating user:', err);
        }
        process.exit(1);
      });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });






