const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getContractInstance, registerUser } = require('../fabric/network');
const { Customer } = require('../database/models');
const { initializePaymentWallet, getWalletBalanceById, getWallet } = require('../utils/walletUtils'); // ✅ Corrected: added getWallet and registerAndEnrollUser
const { updateCustomerLedger } = require('../fabric/fabricService'); // ✅

/**
 * ✅ Get customer profile (corrected for Mongo ID to Fabric ID mapping)
 */
const getCustomerProfile = async (req, res) => {
  try {
    const mongoId = req.user.id; // ⬅️ ID coming from JWT (Mongo _id)

    // 🔵 First, fetch corresponding userId (Fabric ID) from MongoDB
    const customerRecord = await Customer.findById(mongoId);

    if (!customerRecord) {
      return res.status(404).json({ error: 'Customer not found in database' });
    }

    const customerId = customerRecord.userId; // ⬅️ Fabric-compatible ID

    const { gateway, contract } = await getContractInstance('admin');

    try {
      console.log(`📘 Getting profile for customerId (Fabric): ${customerId}`);

      const customerData = await contract.evaluateTransaction('GetCustomer', customerId);
      const customer = JSON.parse(customerData.toString());

      // 🔧 Initialize virtual wallet if not present
      await initializePaymentWallet(customerId);
      const walletDetails = await getWalletBalanceById(customerId);

      res.json({
        id: customer.ID || customer.id,
        name: customer.Name || customer.name,
        email: customer.Email || customer.email,
        phone: customer.Phone || customer.phone,
        visibility: customer.Visibility || customer.visibility,
        registeredDate: customer.RegisteredDate || customer.registeredDate,
        isActive: customer.IsActive ?? customer.isActive,
        bookings: customer.BookingHistory || customer.bookingHistory || [],
        virtualWallet: walletDetails
      });
    } catch (error) {
      console.error(`❌ Error getting customer profile:`, error);
      res.status(500).json({ error: `Failed to get customer profile: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in getCustomerProfile:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * ✅ Update customer details
 */
const updateCustomerDetails = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const customerId = req.user.id;

    if (!name && !email && !phone && !password) {
      return res.status(400).json({ success: false, error: 'At least one field (name, email, phone, password) is required to update.' });
    }

    // ✅ No need to check wallet or register identity anymore

    // 🔵 Build update fields for MongoDB
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (password) updateFields.password = password; // plaintext as you prefer

    // 🔵 Update MongoDB
    const updatedCustomer = await Customer.findOneAndUpdate(
      { userId: customerId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ success: false, error: 'Customer not found in database' });
    }

    // 🔵 Prepare fields for Ledger update
    const ledgerFields = {};
    if (name) ledgerFields.name = name;
    if (phone) ledgerFields.phone = phone;
    if (email) ledgerFields.email = email; // optional

    // 🔵 Update on Ledger (no wallet check)
    await updateCustomerLedger(customerId, ledgerFields);

    return res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error('❌ Error updating customer:', error.message);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * ✅ Update customer visibility
 */
const updateVisibility = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { visibility } = req.body;

    if (!visibility || !['public', 'anonymous'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value. Must be "public" or "anonymous"' });
    }

    const { gateway, contract } = await getContractInstance(customerId);

    try {
      console.log(`📤 Updating visibility for ${customerId} to ${visibility}`);
      await contract.submitTransaction('UpdateCustomerVisibility', customerId, visibility);

      res.json({
        message: 'Visibility updated successfully',
        visibility
      });
    } catch (error) {
      console.error(`❌ Error updating customer visibility:`, error);
      res.status(500).json({ error: `Failed to update visibility: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in updateVisibility:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * ✅ Get customer bookings
 */
const getCustomerBookings = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id; // Fabric ID
    const { gateway, contract } = await getContractInstance('admin');

    try {
      const bookingsData = await contract.evaluateTransaction('QueryCustomerBookings', customerId);
      const bookings = JSON.parse(bookingsData.toString());

      const bookingsWithTickets = await Promise.all(
        bookings.map(async (booking) => {
          const ticketData = await contract.evaluateTransaction('GetTicket', booking.ticketId);
          const ticket = JSON.parse(ticketData.toString());

          return {
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
          };
        })
      );

      res.status(200).json(bookingsWithTickets);
    } catch (error) {
      console.error('❌ Error fetching customer bookings:', error);
      res.status(500).json({ error: `Failed to get customer bookings: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ Error in getCustomerBookings:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

 // Deactivate customer
const deactivateAccount = async (req, res) => {
  try {
    const mongoId = req.user.id; // JWT gives us Mongo _id

    // 🔍 Step 1: Fetch user details from MongoDB
    const customerDoc = await Customer.findById(mongoId);
    if (!customerDoc) {
      return res.status(404).json({ error: 'Customer not found in database' });
    }

    const customerId = customerDoc.userId; // Fabric blockchain ID (like customer_abc123)

    const { gateway, contract } = await getContractInstance(customerId);

    try {
      console.log(`📤 Deregistering customer on blockchain: ${customerId}`);
      
      await contract.submitTransaction('DeregisterCustomer', customerId);

      await Customer.findOneAndUpdate({ userId: customerId }, { isActive: false });

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error(`❌ Error during deregistration transaction:`, error);
      res.status(500).json({ error: `Failed to deactivate account: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in deactivateAccount:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};


// ✅ Final Export
module.exports = {
  getCustomerProfile,
  updateCustomerDetails,
  updateVisibility,
  getCustomerBookings,
  deactivateAccount
};
