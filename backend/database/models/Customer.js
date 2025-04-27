const mongoose = require('mongoose');
const User = require('./User');

// Customer specific schema fields
const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false // 🔧 Made optional to avoid registration error
  },
  lastName: {
    type: String,
    required: false // 🔧 Made optional to avoid registration error
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  },
  preferences: {
    travelModes: {
      type: [String],
      default: []
    },
    destinations: {
      type: [String],
      default: []
    },
    accommodationTypes: {
      type: [String],
      default: []
    },
    budgetRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 10000
      }
    }
  },
  bookings: [{
    bookingId: {
      type: String,
      required: true
    },
    providerUserId: {
      type: String,
      required: true
    },
    serviceType: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    wallet: {
      balance: {
        type: Number,
        default: 1000  // or whatever default
      },
      transactions: [
        {
          id: String,
          type: String,
          amount: Number,
          description: String,
          timestamp: String
        }
      ]
    },
    transactionHash: String, // Reference to blockchain transaction
    bookingDate: {
      type: Date,
      default: Date.now
    },
    serviceDate: Date,
    amount: Number,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }]
});

// Create the Customer model using the User model discriminator
const Customer = User.discriminator('customer', customerSchema);

module.exports = Customer;
