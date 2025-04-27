const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/bookingController');
const { authenticate, isCustomer } = require('../../middleware/auth');


router.post('/', authenticate, isCustomer, bookingController.bookTicket);
router.post('/payment', authenticate, isCustomer, bookingController.confirmPayment);
router.get('/:id', authenticate, bookingController.getBookingById);
router.put('/:bookingId/cancel', authenticate, isCustomer, bookingController.cancelBooking);

module.exports = router;
