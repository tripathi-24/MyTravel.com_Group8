const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  ticketId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  seatIds: {
    type: [String],
    required: true
  },
  numberOfSeats: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    required: true
  },
  isPaymentConfirmed: {
    type: Boolean,
    default: false
  },
  paymentBlockHeight: {
    type: String,
    required: false,
    default: null
  },
  createdAt: {
    type: String,
    required: true
  },
  updatedAt: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
