const BookingModel = require('../database/models/Booking');
const { getContractInstance } = require('../fabric/network');

// Helper to generate 6-character alphanumeric ID
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

//const BookingModel = require('../database/models/Booking');

// ✅ Book a ticket
const bookTicket = async (req, res) => {
  try {
    const { customerId, ticketId, seatNumbers } = req.body;

    if (!customerId || !ticketId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'customerId, ticketId, and seatNumbers (array) are required' });
    }

    const bookingId = generateId('booking');
    const { gateway, contract } = await getContractInstance(customerId);

    try {
      await contract.submitTransaction('BookTicket', bookingId, ticketId, customerId, JSON.stringify(seatNumbers));
      const bookingData = await contract.evaluateTransaction('GetBooking', bookingId);
      const booking = JSON.parse(bookingData.toString());

      booking.paymentBlockHeight = booking.paymentBlockHeight || null;

      // ✅ Save booking to MongoDB immediately after successful chaincode invocation
      await BookingModel.create({
        id: booking.id,
        ticketId: booking.ticketId,
        userId: booking.userId,
        seatIds: booking.seatIds,
        numberOfSeats: booking.numberOfSeats,
        totalPrice: booking.totalPrice,
        status: booking.status,
        isPaymentConfirmed: booking.isPaymentConfirmed,
        paymentBlockHeight: booking.paymentBlockHeight,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      });

      res.status(201).json({
        message: 'Ticket booked successfully',
        bookingId,
        booking,
        paymentRequired: true
      });
    } catch (error) {
      console.error('❌ BookTicket failed:', error);
      res.status(500).json({ error: `Failed to book ticket: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ Error in bookTicket:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// ✅ Confirm payment
const confirmPayment = async (req, res) => {
  try {
    const { bookingId, transactionId } = req.body;

    if (!bookingId || !transactionId) {
      return res.status(400).json({ error: 'bookingId and transactionId are required' });
    }

    // ✅ Fetch the booking from MongoDB to get Fabric userId (not Mongo _id)
    const bookingRecord = await BookingModel.findOne({ id: bookingId });
    if (!bookingRecord) {
      return res.status(404).json({ error: 'Booking not found in MongoDB' });
    }

    const fabricUserId = bookingRecord.userId;

    const { gateway, contract } = await getContractInstance(fabricUserId);

    try {
      await contract.submitTransaction('ConfirmPayment', bookingId, transactionId);
      const bookingData = await contract.evaluateTransaction('GetBooking', bookingId);
      const booking = JSON.parse(bookingData.toString());

      // ✅ Patch optional field
      booking.paymentBlockHeight = booking.paymentBlockHeight || null;

      // ✅ Update booking in MongoDB
      await BookingModel.findOneAndUpdate(
        { id: booking.id },
        booking,
        { upsert: true, new: true }
      );

      const ticketData = await contract.evaluateTransaction('GetTicket', booking.ticketId);
      const ticket = JSON.parse(ticketData.toString());

      res.json({
        message: 'Payment confirmed successfully',
        booking,
        ticket: {
          id: ticket.id,
          origin: ticket.origin,
          destination: ticket.destination,
          departureTime: ticket.departureTime,
          arrivalTime: ticket.arrivalTime,
          serviceProvider: ticket.serviceProvider,
          transportMode: ticket.transportMode
        }
      });
    } catch (error) {
      console.error('❌ ConfirmPayment failed:', error);
      res.status(500).json({ error: `Failed to confirm payment: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ Error in confirmPayment:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
//Cance Booking
const cancelBooking = async (req, res) => {
  try {
    const jwtUserId = req.user.userId || req.user.id;  // Use Fabric ID
    const { bookingId } = req.params;

    const { gateway, contract } = await getContractInstance('admin');

    try {
      const bookingData = await contract.evaluateTransaction('GetBooking', bookingId);
      const booking = JSON.parse(bookingData.toString());

      console.log("🔍 booking.userId:", booking.userId);
      console.log("🔍 jwtUserId from token:", jwtUserId);

      if (booking.userId !== jwtUserId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: You cannot cancel this booking' });
      }

      const { gateway: userGateway, contract: userContract } = await getContractInstance(booking.userId);

      const refundAmount = booking.totalPrice * 0.8;
      await userContract.submitTransaction('CancelBooking', bookingId);

      res.json({
        message: 'Booking cancelled successfully',
        refundAmount,
        booking
      });

      userGateway.disconnect();
    } catch (error) {
      console.error('❌ CancelBooking failed:', error);
      res.status(500).json({ error: `Failed to cancel booking: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ Error in cancelBooking:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
/// ✅ Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const customerId = String(req.user.id).trim();
    const { id } = req.params;

    const { gateway, contract } = await getContractInstance('admin');

    try {
      const bookingData = await contract.evaluateTransaction('GetBooking', id);
      const booking = JSON.parse(bookingData.toString());

      const bookingUserId = String(booking.userId).trim();
      const userRole = req.user.role;

      console.log('🔍 booking.userId:', bookingUserId);
      console.log('🔍 req.user.id:', customerId);
      console.log('🔍 req.user.role:', userRole);

      if (bookingUserId !== customerId && userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to view this booking' });
      }

      const ticketData = await contract.evaluateTransaction('GetTicket', booking.ticketId);
      const ticket = JSON.parse(ticketData.toString());

      res.json({
        ...booking,
        ticket: {
          id: ticket.id,
          origin: ticket.origin,
          destination: ticket.destination,
          departureTime: ticket.departureTime,
          arrivalTime: ticket.arrivalTime,
          serviceProvider: ticket.serviceProvider,
          transportMode: ticket.transportMode,
          price: ticket.price,
          dynamicPrice: ticket.dynamicPrice
        }
      });
    } catch (error) {
      console.error('❌ GetBooking failed:', error);
      res.status(500).json({ error: `Failed to get booking: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ Error in getBookingById:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
module.exports = {
  bookTicket,
  confirmPayment,
  cancelBooking,
  getBookingById
};
