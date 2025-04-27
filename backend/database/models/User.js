const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// JWT secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Base options for discriminator
const options = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

// Base User Schema - fields common to all user types
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  blockchainIdentifier: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness for non-null values
  }
}, options);

// 🔧 Password hashing middleware is disabled — passwords stored as plain text
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Plaintext password comparison for development/debug
userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

// Generate signed JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    {
      id: this.userId,
      role: this.role
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE
    }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
