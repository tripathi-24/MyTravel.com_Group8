const express = require('express');
const router = express.Router();
const ticketController = require('../../controllers/ticketController');
const { authenticate, isProvider } = require('../../middleware/auth');

// Create a new ticket (protected route)
router.post('/', authenticate, isProvider, ticketController.createTicket);

router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.get('/:id/seats', ticketController.getAvailableSeats);
router.get('/provider/:providerId', ticketController.getTicketsByProvider);

module.exports = router;