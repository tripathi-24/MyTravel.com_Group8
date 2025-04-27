const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['DEPOSIT', 'PAYMENT', 'REFUND'], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  bookingId: { type: String }
});

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  transactions: [transactionSchema]
});

module.exports = mongoose.model('Wallet', walletSchema);
