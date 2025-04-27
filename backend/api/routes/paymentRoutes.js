const express = require('express');
const { authenticate } = require('../../middleware/auth');
//const walletController = require('../../controllers/walletController'); // ✅ ensure this file exists
//const walletController = require('../../utils/walletUtils'); // ✅ or direct functions
// You can later use paymentController when needed
const paymentController = require('../../controllers/paymentController');

const router = express.Router();

// ✅ Wallet-related APIs
router.post('/wallet/init', authenticate, paymentController.initializeWallet);
router.get('/wallet/balance', authenticate, paymentController.getWalletBalance);
router.post('/wallet/add-funds', authenticate, paymentController.addFunds);
router.post('/wallet/pay', authenticate, paymentController.processPayment);
router.post('/wallet/refund', authenticate, paymentController.processRefund);

// 📝 Placeholder: add paymentController routes here if needed in future
// router.post('/payment/confirm', authenticate, paymentController.confirmPayment);
// router.get('/payment/history', authenticate, paymentController.getPaymentHistory);

module.exports = router;
console.log('✅ paymentRoutes loaded successfully');
