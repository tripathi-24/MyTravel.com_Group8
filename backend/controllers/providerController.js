const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getContractInstance, registerUser } = require('../fabric/network');
const { Provider } = require('../database/models');
const { initializePaymentWallet } = require('../utils/walletUtils');
const User = require('../database/models/User');
const { updateProviderLedger } = require('../fabric/fabricService'); 

//**
//* ✅ Get provider profile (without getWalletBalanceById)
const getProviderProfile = async (req, res) => {
 try {
   const mongoId = req.user.id; // From JWT (Mongo _id)
   const providerRecord = await Provider.findById(mongoId);

   if (!providerRecord) {
     return res.status(404).json({ error: 'Provider not found in database' });
   }

   const providerId = providerRecord.userId; // Fabric-compatible ID
   const { gateway, contract } = await getContractInstance('admin');

   try {
     console.log(`📘 Getting profile for provider: ${providerId}`);

     const providerData = await contract.evaluateTransaction('GetProvider', providerId);
     const provider = JSON.parse(providerData.toString());

     // 🧩 Initialize virtual wallet (no balance fetch)
     await initializePaymentWallet(providerId);

     // ✅ Send profile only (no wallet balance now)
     res.json({
       id: provider.ID || provider.id,
       name: provider.Name || provider.name,
       email: provider.Email || provider.email,
       phone: provider.Phone || provider.phone,
       transportMode: provider.TransportMode || provider.transportMode,
       rating: provider.Rating || provider.rating,
       totalRatings: provider.TotalRatings || provider.totalRatings,
       registeredDate: provider.RegisteredDate || provider.registeredDate,
       isActive: provider.IsActive ?? provider.isActive,
       transportList: provider.TransportList || provider.transportList
     });
   } catch (error) {
     console.error(`❌ Error getting provider profile:`, error);
     res.status(500).json({ error: `Failed to get provider profile: ${error.message}` });
   } finally {
     gateway.disconnect();
   }
 } catch (error) {
   console.error(`❌ Error in getProviderProfile:`, error);
   res.status(500).json({ error: 'Server error' });
 }
};
// ✅ Register provider with plain password
const registerProvider = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      transportMode,
      businessName,
      serviceType
    } = req.body;

    if (!name || !email || !phone || !password || !transportMode || !businessName || !serviceType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const validModes = ['air', 'land', 'water'];
    if (!validModes.includes(transportMode)) {
      return res.status(400).json({ error: 'Invalid transport mode' });
    }

    const providerId = `provider_${uuidv4().slice(0, 6)}`;
    console.log('🟡 Password received:', password);

    await registerUser(providerId);
    const { gateway, contract } = await getContractInstance(providerId);

    try {
      await contract.submitTransaction(
        'RegisterProvider',
        providerId,
        name,
        email,
        phone,
        transportMode
      );

      const savedProvider = await Provider.create({
        userId: providerId,
        name,
        email,
        phone,
        transportMode,
        password,
        businessName,
        serviceType,
        role: 'provider'
      });

      await initializePaymentWallet({ user: { id: providerId } }, { status: () => ({ json: () => {} }) });

      console.log('✅ MongoDB provider saved:', savedProvider.userId);

      const token = jwt.sign(
        { id: providerId, role: 'provider', name, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
      );

      res.status(201).json({
        message: 'Provider registered successfully',
        token,
        user: {
          id: providerId,
          name,
          email,
          phone,
          transportMode,
          role: 'provider'
        }
      });
    } catch (error) {
      console.error(`Error registering provider on blockchain:`, error);
      res.status(500).json({ error: `Failed to register provider: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in registerProvider:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * ✅ Update Provider Details
 */
const updateProviderDetails = async (req, res) => {
  try {
    const { name, phone, transportMode, companyName } = req.body;
    const mongoId = req.user.id; // JWT gives us Mongo _id

    // 🔍 Step 1: Find provider document by Mongo _id
    const providerDoc = await Provider.findById(mongoId);
    if (!providerDoc) {
      return res.status(404).json({ success: false, error: 'Provider not found in database' });
    }

    const providerId = providerDoc.userId; // Fabric-friendly ID (e.g. provider_ab12cd)

    // 🔄 Step 2: Update MongoDB using userId
    const updatedProvider = await Provider.findOneAndUpdate(
      { userId: providerId },
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(transportMode && { transportMode }),
          ...(companyName && { companyName })
        }
      },
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({ success: false, error: 'Provider update failed in MongoDB' });
    }

    // 🔄 Step 3: Update Fabric ledger using userId
    await updateProviderLedger(providerId, { name, phone, transportMode });

    return res.status(200).json({ success: true, data: updatedProvider });
  } catch (error) {
    console.error('❌ Error updating provider:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
// ✅ Create a new ticket
const createTicket = async (req, res) => {
  try {
    const providerId = req.user.id;
    const {
      origin,
      destination,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
      transportMode
    } = req.body;

    if (!origin || !destination || !departureTime || !arrivalTime || !price || !totalSeats || !transportMode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const ticketId = `ticket_${uuidv4().slice(0, 6)}`;
    const { gateway, contract } = await getContractInstance(providerId);

    try {
      await contract.submitTransaction(
        'CreateTicket',
        ticketId,
        origin,
        destination,
        departureTime,
        arrivalTime,
        price.toString(),
        totalSeats.toString(),
        providerId,
        transportMode
      );

      res.status(201).json({
        message: 'Ticket created successfully',
        ticketId
      });
    } catch (error) {
      console.error(`Error creating ticket:`, error);
      res.status(500).json({ error: `Failed to create ticket: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in createTicket:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Get all provider tickets
const getProviderTickets = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { gateway, contract } = await getContractInstance('admin');

    try {
      const ticketsData = await contract.evaluateTransaction('QueryTicketsByProvider', providerId);
      const tickets = JSON.parse(ticketsData.toString());

      res.json(tickets);
    } catch (error) {
      console.error(`Error getting provider tickets:`, error);
      res.status(500).json({ error: `Failed to get tickets: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in getProviderTickets:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Update dynamic price of a ticket
const updateTicketPrice = async (req, res) => {
  try {
    const mongoId = req.user.id; // Mongo _id from JWT

    // 🔍 Step 1: Get provider record from MongoDB
    const providerDoc = await Provider.findById(mongoId);
    if (!providerDoc) {
      return res.status(404).json({ error: 'Provider not found in database' });
    }

    const providerId = providerDoc.userId; // Fabric Blockchain ID

    const { ticketId } = req.params; // 🔥 No lowercasing — use exactly what frontend sends

    const { gateway, contract } = await getContractInstance(providerId);

    try {
      const ticketData = await contract.evaluateTransaction('GetTicket', ticketId);
      const ticket = JSON.parse(ticketData.toString());

      if (ticket.serviceProvider !== providerId) {
        return res.status(403).json({ error: 'You are not authorized to update this ticket' });
      }

      await contract.submitTransaction('UpdateDynamicPrice', ticketId);

      const updatedTicketData = await contract.evaluateTransaction('GetTicket', ticketId);
      const updatedTicket = JSON.parse(updatedTicketData.toString());

      res.json({
        message: 'Ticket price updated successfully',
        oldPrice: ticket.dynamicPrice,
        newPrice: updatedTicket.dynamicPrice,
        ticket: updatedTicket
      });
    } catch (error) {
      console.error(`❌ Error updating ticket price:`, error);
      res.status(500).json({ error: `Failed to update ticket price: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in updateTicketPrice:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Deactivate provider account
const deactivateAccount = async (req, res) => {
  try {
    const providerId = req.user.id;
    const { gateway, contract } = await getContractInstance(providerId);

    try {
      await contract.submitTransaction('DeregisterProvider', providerId);
      await Provider.findOneAndUpdate({ userId: providerId }, { isActive: false });

      res.json({ message: 'Account deactivated successfully' });
    } catch (error) {
      console.error(`Error deactivating provider account:`, error);
      res.status(500).json({ error: `Failed to deactivate account: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in deactivateAccount:`, error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Update provider rating
const updateProviderRating = async (req, res) => {
  try {
    const { providerId, rating } = req.body;

    if (!providerId || rating === undefined) {
      return res.status(400).json({ error: 'providerId and rating are required' });
    }

    const { gateway, contract } = await getContractInstance('admin');

    try {
      await contract.submitTransaction('UpdateProviderRating', providerId, rating.toString());
      console.log(`✅ Provider ${providerId} rating updated to ${rating}`);

      res.json({
        message: 'Provider rating updated successfully',
        providerId,
        rating
      });
    } catch (error) {
      console.error('❌ Error submitting UpdateProviderRating:', error.message);
      res.status(500).json({ error: `Blockchain error: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error('❌ updateProviderRating handler error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Deregister a provider (Blockchain + MongoDB)
const deregisterProvider = async (req, res) => {
  const providerId = req.params.id;

  try {
    const { gateway, contract } = await getContractInstance('admin');

    await contract.submitTransaction('DeregisterProvider', providerId);
    await gateway.disconnect();

    const mongoUpdate = await User.findOneAndUpdate(
      { userId: providerId },
      { isActive: false },
      { new: true }
    );

    if (!mongoUpdate) {
      return res.status(404).json({ error: `Provider ${providerId} not found in MongoDB` });
    }

    res.json({
      success: true,
      message: `Provider ${providerId} deregistered successfully`,
      provider: mongoUpdate
    });
  } catch (error) {
    console.error(`❌ Error in deregisterProvider:`, error);
    res.status(500).json({ error: `Failed to deregister provider: ${error.message}` });
  }
};

// ✅ Export everything
module.exports = {
  getProviderProfile,
  registerProvider,
  updateProviderDetails,
  createTicket,
  getProviderTickets,
  updateTicketPrice,
  deactivateAccount,
  updateProviderRating,
  deregisterProvider
};
