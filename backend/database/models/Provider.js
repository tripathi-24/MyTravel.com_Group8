const mongoose = require('mongoose');
const User = require('./User');

// Provider specific schema fields
const providerSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Please provide a business name']
  },
  serviceType: {
    type: String,
    required: [true, 'Please provide a service type'],
    enum: ['Bus', 'Taxi', 'Train', 'Flight', 'Ship', 'Bike', 'Boat', 'Others']
  },
  transportMode: {
    type: String,
    enum: ['land', 'air', 'water', 'n/a'],
    default: 'land'
  },
  businessAddress: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },
  businessDescription: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  services: [{
    serviceId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: { type: String, default: '' },
    price: {
      type: Number,
      required: true
    },
    availability: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      recurrence: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'],
        default: 'none'
      }
    },
    transactionHash: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    isActive: {
      type: Boolean,
      default: true
    },
    images: { type: [String], default: [] },
    category: { type: String, default: '' }
  }],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  bookings: [{
    bookingId: {
      type: String,
      required: true
    },
    customerUserId: {
      type: String,
      required: true
    },
    serviceId: {
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
    transactionHash: { type: String, default: '' },
    bookingDate: {
      type: Date,
      default: Date.now
    },
    serviceDate: { type: Date, default: null },
    amount: { type: Number, default: 0 }
  }]
});

// Create the Provider model using the User model discriminator
const Provider = User.discriminator('provider', providerSchema);

module.exports = Provider;
