const express = require('express');
const router = express.Router();
const providerController = require('../../controllers/providerController');
const { authenticate, isProvider, isAdmin } = require('../../middleware/auth');

// ✅ Import updateProviderDetails correctly
const { updateProviderDetails } = require('../../controllers/providerController');

// ✅ Get provider profile
router.get('/profile', authenticate, isProvider, providerController.getProviderProfile);

// ✅ Create a new ticket
router.post('/tickets', authenticate, isProvider, providerController.createTicket);

// ✅ Get all provider tickets
router.get('/tickets', authenticate, isProvider, providerController.getProviderTickets);

// ✅ Update dynamic price of a ticket
router.put('/tickets/:ticketId/price', authenticate, isProvider, providerController.updateTicketPrice);

// ✅ Provider deactivates their own account
router.put('/deactivate', authenticate, isProvider, providerController.deactivateAccount);

// ✅ Admin deregisters a provider
router.put('/:id/deregister', authenticate, isAdmin, providerController.deregisterProvider);

// ✅ Update provider rating
router.put('/rating/update', authenticate, providerController.updateProviderRating);

// ✅ New: Update provider
router.put('/update', authenticate, isProvider, updateProviderDetails);

// ✅ Export the router
module.exports = router;
