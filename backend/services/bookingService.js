const { Customer, Provider } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const { createBookingTransaction, updateBookingStatus, queryBookingHistory } = require('./blockchainService');

/**
 * Create a new booking
 * @param {string} customerId - Customer ID
 * @param {string} providerId - Provider ID
 * @param {string} serviceId - Service ID
 * @param {Object} bookingData - Booking data
 * @returns {Object} Booking document
 */
const createBooking = async (customerId, providerId, serviceId, bookingData) => {
  try {
    // Find the customer
    const customer = await Customer.findOne({ userId: customerId });
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Find the provider
    const provider = await Provider.findOne({ userId: providerId });
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // Find the service from the provider's services array
    const service = provider.services.find(s => s.serviceId === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Generate booking ID
    const bookingId = `booking_${uuidv4().slice(0, 8)}`;
    
    // Create booking transaction on blockchain
    const transactionHash = await createBookingTransaction(
      customerId,
      providerId,
      serviceId,
      {
        bookingId,
        amount: service.price,
        serviceDate: bookingData.serviceDate,
        status: 'pending'
      }
    );
    
    // Create booking object for customer
    const customerBooking = {
      bookingId,
      providerUserId: providerId,
      serviceType: service.category || provider.serviceType,
      status: 'pending',
      transactionHash,
      bookingDate: new Date(),
      serviceDate: bookingData.serviceDate,
      amount: service.price
    };
    
    // Add booking to customer's bookings array
    customer.bookings.push(customerBooking);
    await customer.save();
    
    // Create booking object for provider
    const providerBooking = {
      bookingId,
      customerUserId: customerId,
      serviceId,
      status: 'pending',
      transactionHash,
      bookingDate: new Date(),
      serviceDate: bookingData.serviceDate,
      amount: service.price
    };
    
    // Add booking to provider's bookings array
    provider.bookings.push(providerBooking);
    await provider.save();
    
    return {
      success: true,
      booking: customerBooking
    };
  } catch (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID making the update
 * @param {string} newStatus - New status
 * @returns {Object} Updated booking
 */
const updateBooking = async (bookingId, userId, newStatus) => {
  try {
    // Check if status is valid
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
      throw new Error('Invalid status');
    }
    
    // Find customer with this booking
    let customer = await Customer.findOne({ 'bookings.bookingId': bookingId });
    if (!customer) {
      throw new Error('Booking not found');
    }
    
    // Find provider with this booking
    let provider = await Provider.findOne({ 'bookings.bookingId': bookingId });
    if (!provider) {
      throw new Error('Booking not found');
    }
    
    // Check if user is authorized to update this booking
    if (customer.userId !== userId && provider.userId !== userId) {
      throw new Error('Unauthorized to update this booking');
    }
    
    // Create blockchain transaction to update booking status
    const transactionHash = await updateBookingStatus(bookingId, newStatus);
    
    // Update customer's booking
    const customerBookingIndex = customer.bookings.findIndex(b => b.bookingId === bookingId);
    if (customerBookingIndex !== -1) {
      customer.bookings[customerBookingIndex].status = newStatus;
      customer.bookings[customerBookingIndex].transactionHash = transactionHash;
      await customer.save();
    }
    
    // Update provider's booking
    const providerBookingIndex = provider.bookings.findIndex(b => b.bookingId === bookingId);
    if (providerBookingIndex !== -1) {
      provider.bookings[providerBookingIndex].status = newStatus;
      provider.bookings[providerBookingIndex].transactionHash = transactionHash;
      await provider.save();
    }
    
    return {
      success: true,
      booking: customer.bookings[customerBookingIndex],
      transactionHash
    };
  } catch (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }
};

/**
 * Get bookings for a user
 * @param {string} userId - User ID
 * @returns {Array} Bookings array
 */
const getUserBookings = async (userId) => {
  try {
    // Try to find user as customer first
    const customer = await Customer.findOne({ userId });
    if (customer) {
      return {
        success: true,
        bookings: customer.bookings
      };
    }
    
    // Try to find user as provider
    const provider = await Provider.findOne({ userId });
    if (provider) {
      return {
        success: true,
        bookings: provider.bookings
      };
    }
    
    throw new Error('User not found');
  } catch (error) {
    throw new Error(`Failed to get bookings: ${error.message}`);
  }
};

/**
 * Get booking details including blockchain history
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID requesting the booking
 * @returns {Object} Booking details and history
 */
const getBookingDetails = async (bookingId, userId) => {
  try {
    // Find customer with this booking
    let customer = await Customer.findOne({ 'bookings.bookingId': bookingId });
    if (!customer) {
      throw new Error('Booking not found');
    }
    
    // Find provider with this booking
    let provider = await Provider.findOne({ 'bookings.bookingId': bookingId });
    if (!provider) {
      throw new Error('Booking not found');
    }
    
    // Check if user is authorized to view this booking
    if (customer.userId !== userId && provider.userId !== userId) {
      throw new Error('Unauthorized to view this booking');
    }
    
    // Get customer booking
    const customerBooking = customer.bookings.find(b => b.bookingId === bookingId);
    
    // Get provider booking
    const providerBooking = provider.bookings.find(b => b.bookingId === bookingId);
    
    // Get booking history from blockchain
    const bookingHistory = await queryBookingHistory(bookingId);
    
    return {
      success: true,
      booking: {
        ...customerBooking.toObject(),
        provider: {
          id: provider.userId,
          businessName: provider.businessName,
          serviceType: provider.serviceType,
          phone: provider.phone
        },
        customer: {
          id: customer.userId,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone
        }
      },
      history: bookingHistory
    };
  } catch (error) {
    throw new Error(`Failed to get booking details: ${error.message}`);
  }
};

module.exports = {
  createBooking,
  updateBooking,
  getUserBookings,
  getBookingDetails
}; 