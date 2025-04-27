const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customerController');
const { authenticate, isCustomer } = require('../../middleware/auth');

// Get customer profile
router.get('/profile', authenticate, isCustomer, customerController.getCustomerProfile);

// Update visibility
router.put('/visibility', authenticate, isCustomer, customerController.updateVisibility);

// Get all bookings
router.get('/bookings', authenticate, isCustomer, customerController.getCustomerBookings);

// Deactivate customer account
router.put('/deactivate', authenticate, isCustomer, customerController.deactivateAccount);

//Update Customer Details
router.put('/update-details', authenticate, isCustomer, customerController.updateCustomerDetails);

module.exports = router;
