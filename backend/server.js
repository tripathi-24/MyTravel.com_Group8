const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./database/connect');
const { authenticate } = require('./middleware/auth');

// Import routes
const authRoutes = require('./api/routes/authRoutes');
const bookingRoutes = require('./api/routes/bookingRoutes');
const providerRoutes = require('./api/routes/providerRoutes');
const customerRoutes = require('./api/routes/customerRoutes');
const ticketRoutes = require('./api/routes/ticketRoutes');
const paymentRoutes = require('./api/routes/paymentRoutes');

// Load environment variables from .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRoutes); // ✅ Ensure POST /api/tickets is defined in ticketRoutes.js
app.use('/api/payments', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MyTravel API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server error'
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
