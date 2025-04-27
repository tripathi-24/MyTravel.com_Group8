const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Cancelled'],
    required: true
  },
  serviceProvider: {
    type: String,
    required: true
  },
  transportMode: {
    type: String,
    enum: ['air', 'land', 'water'],
    required: true
  }
}, {
  timestamps: true // ✅ Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Ticket', ticketSchema);
