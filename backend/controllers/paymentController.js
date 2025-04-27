const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Simulated database for virtual wallets
const wallets = {};

// Load wallet data from persistent storage
const walletFile = path.join(__dirname, '../database/paymentWallet.json');
if (fs.existsSync(walletFile)) {
  Object.assign(wallets, JSON.parse(fs.readFileSync(walletFile, 'utf8')));
}

const persistWallets = () => {
  fs.writeFileSync(walletFile, JSON.stringify(wallets, null, 2));
};

// ✅ Initialize wallet for a user
const initializeWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    if (wallets[userId]) {
      return res.status(400).json({ error: 'Wallet already exists for this user' });
    }

    wallets[userId] = {
      balance: 1000,
      transactions: []
    };

    persistWallets();

    res.status(201).json({
      message: 'Wallet initialized successfully',
      balance: wallets[userId].balance
    });
  } catch (error) {
    console.error('Error in initializeWallet:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Get wallet balance and transaction history
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!wallets[userId]) {
      wallets[userId] = {
        balance: 1000,
        transactions: []
      };
      persistWallets();
    }

    res.json({
      balance: wallets[userId].balance,
      transactions: wallets[userId].transactions
    });
  } catch (error) {
    console.error('Error in getWalletBalance:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Add funds to wallet
const addFunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!wallets[userId]) {
      wallets[userId] = {
        balance: 0,
        transactions: []
      };
    }

    wallets[userId].balance += amount;

    const transaction = {
      id: uuidv4(),
      type: 'DEPOSIT',
      amount,
      timestamp: new Date().toISOString(),
      description: 'Added funds to wallet'
    };

    wallets[userId].transactions.push(transaction);
    persistWallets();

    res.json({
      message: 'Funds added successfully',
      balance: wallets[userId].balance,
      transaction
    });
  } catch (error) {
    console.error('Error in addFunds:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Process a wallet payment
const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Booking ID and valid amount are required' });
    }

    if (!wallets[userId]) {
      return res.status(404).json({ error: 'Wallet not found. Please initialize your wallet.' });
    }

    if (wallets[userId].balance < amount) {
      return res.status(400).json({
        error: 'Insufficient funds',
        balance: wallets[userId].balance,
        required: amount
      });
    }

    wallets[userId].balance -= amount;

    const transactionId = `tx_${uuidv4()}`;
    const transaction = {
      id: transactionId,
      type: 'PAYMENT',
      amount: -amount,
      timestamp: new Date().toISOString(),
      description: `Payment for booking ${bookingId}`,
      bookingId
    };

    wallets[userId].transactions.push(transaction);
    persistWallets();

    res.json({
      message: 'Payment processed successfully',
      balance: wallets[userId].balance,
      transaction,
      transactionId
    });
  } catch (error) {
    console.error('Error in processPayment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Process a refund
const processRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Booking ID and valid amount are required' });
    }

    if (!wallets[userId]) {
      return res.status(404).json({ error: 'Wallet not found. Please initialize your wallet.' });
    }

    wallets[userId].balance += amount;

    const transaction = {
      id: uuidv4(),
      type: 'REFUND',
      amount,
      timestamp: new Date().toISOString(),
      description: `Refund for booking ${bookingId}`,
      bookingId
    };

    wallets[userId].transactions.push(transaction);
    persistWallets();

    res.json({
      message: 'Refund processed successfully',
      balance: wallets[userId].balance,
      transaction
    });
  } catch (error) {
    console.error('Error in processRefund:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Export all handlers
module.exports = {
  initializeWallet,
  getWalletBalance,
  addFunds,
  processPayment,
  processRefund
};
