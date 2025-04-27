const jwt = require('jsonwebtoken');
//const bcrypt = require('bcrypt');
const { registerUser, getContractInstance } = require('../fabric/network');

// Helper to generate 6-character alphanumeric ID
const generateShortId = (prefix) => {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${randomId}`;
};
//Register Customer
exports.registerCustomer = async (data) => {
  const { name, email, phone, password, visibility } = data;
  const userId = generateShortId('customer');

  await registerUser(userId);
  const { gateway, contract } = await getContractInstance(userId);

  await contract.submitTransaction(
    'RegisterCustomer',
    userId,
    name,
    email,
    phone,
    visibility
  );
  gateway.disconnect();

  // ✅ Save to MongoDB after blockchain success
  const Customer = require('../database/models/Customer'); // adjust path if needed
  const customer = new Customer({
    userId,
    name,
    email,
    phone,
    password,
    visibility,
    isActive: true,
    bookings: [],
    role: 'customer'
  });

  await customer.save();

  return { success: true, message: 'Customer registered successfully', userId };
};
//Register Provider
exports.registerProvider = async (data) => {
  const { name, email, phone, password, transportMode } = data;
  const userId = generateShortId('provider');

  await registerUser(userId);
  const { gateway, contract } = await getContractInstance(userId);

  await contract.submitTransaction(
    'RegisterProvider',
    userId,
    name,
    email,
    phone,
    transportMode
  );
  gateway.disconnect();

  // ✅ Save to MongoDB after blockchain success
  const Provider = require('../database/models/Provider'); // adjust path if needed
  const provider = new Provider({
    userId,
    name,
    email,
    phone,
    password,
    transportMode,
    rating: 0,
    isActive: true,
    tickets: [],
    role: 'provider'
  });

  await provider.save();

  return { success: true, message: 'Provider registered successfully', userId };
};


// Login for customers and providers
exports.login = async (id, password) => {
  const { gateway, contract } = await getContractInstance('admin');
  let userData, role;

  if (id.startsWith('customer_')) {
    userData = JSON.parse(await contract.evaluateTransaction('GetCustomer', id));
    role = 'customer';
  } else if (id.startsWith('provider_')) {
    userData = JSON.parse(await contract.evaluateTransaction('GetProvider', id));
    role = 'provider';
  }

  gateway.disconnect();

  if (!userData || !userData.isActive) throw new Error('Account is inactive or not found on blockchain');

  const token = jwt.sign(
    { id, role, name: userData.name, email: userData.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    message: 'Login successful',
    token,
    user: { ...userData, role }
  };
};

// Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const {
      source,
      destination,
      date,
      transportMode,
      minPrice,
      maxPrice,
      minRating
    } = req.query;

    const filter = {};

    // ✅ Apply MongoDB filters
    if (source) filter.origin = source;
    if (destination) filter.destination = destination;
    if (date) filter.departureTime = { $regex: `^${date}` };
    if (transportMode) filter.transportMode = transportMode;
    if (minPrice !== undefined && maxPrice !== undefined) {
      filter.dynamicPrice = {
        $gte: parseFloat(minPrice),
        $lte: parseFloat(maxPrice)
      };
    }

    const Ticket = require('../database/models/ticket');

    // ✅ Fetch tickets from MongoDB
    let tickets = await Ticket.find(filter).lean();

    // ✅ If minRating is provided, filter using provider data from blockchain
    if (minRating) {
      const { gateway, contract } = await getContractInstance('admin');

      try {
        const ratingThreshold = parseFloat(minRating);
        const ratedTickets = [];

        for (const ticket of tickets) {
          try {
            const providerResponse = await contract.evaluateTransaction('GetProvider', ticket.serviceProvider);
            const provider = JSON.parse(providerResponse.toString());

            console.log(`🔍 Provider ${provider.id} has rating: ${provider.rating}`);

            if (provider.rating >= ratingThreshold) {
              ticket.provider = {
                id: provider.id,
                name: provider.name,
                rating: provider.rating,
                transportMode: provider.transportMode
              };
              ratedTickets.push(ticket);
            }
          } catch (providerError) {
            console.error(`❌ Could not fetch provider ${ticket.serviceProvider}:`, providerError.message);
          }
        }

        tickets = ratedTickets;
        await gateway.disconnect();
      } catch (ratingFilterError) {
        console.error('❌ Error filtering by provider rating:', ratingFilterError);
        await gateway.disconnect();
        return res.status(500).json({ error: 'Failed to filter by provider rating' });
      }
    }

    // ✅ Send final ticket list (possibly filtered)
    res.json(tickets);
  } catch (error) {
    console.error('❌ Error in getAllTickets (MongoDB):', error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Get ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const { gateway, contract } = await getContractInstance('admin');

    try {
      const ticketData = await contract.evaluateTransaction('GetTicket', id);
      const ticket = JSON.parse(ticketData.toString());

      const providerData = await contract.evaluateTransaction('GetProvider', ticket.serviceProvider);
      const provider = JSON.parse(providerData.toString());

      const response = {
        ...ticket,
        provider: {
          id: provider.id,
          name: provider.name,
          rating: provider.rating,
          transportMode: provider.transportMode
        }
      };

      res.json(response);
    } catch (error) {
      console.error(`Error getting ticket: ${error}`);
      res.status(500).json({ error: `Failed to get ticket: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in getTicketById: ${error}`);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get available seats for a ticket
exports.getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { gateway, contract } = await getContractInstance('admin');

    try {
      const seatsData = await contract.evaluateTransaction('QueryAvailableSeats', id);
      const seats = JSON.parse(seatsData.toString());

      res.json(seats);
    } catch (error) {
      console.error(`Error getting available seats: ${error}`);
      res.status(500).json({ error: `Failed to get available seats: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in getAvailableSeats: ${error}`);
    res.status(500).json({ error: 'Server error' });
  }
};
const { Ticket } = require('../database/models'); // ✅ Import once at the top

//Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      totalSeats,
      status,
      serviceProvider,
      transportMode = 'air'
    } = req.body;

    const id = generateShortId('TICKET');

    if (!origin || !destination || !departureTime || !arrivalTime ||
        !price || !availableSeats || !totalSeats || !serviceProvider || !status || !transportMode) {
      return res.status(400).json({ error: 'All ticket fields are required.' });
    }

    console.log("📤 Submitting ticket with args:", [
      id, origin, destination, departureTime, arrivalTime,
      price.toString(), totalSeats.toString(), serviceProvider, transportMode
    ]);

    const { gateway, contract } = await getContractInstance('admin');

    try {
      await contract.submitTransaction(
        'CreateTicket',
        id,
        origin,
        destination,
        departureTime,
        arrivalTime,
        price.toString(),
        totalSeats.toString(),
        serviceProvider,
        transportMode
      );

      // ✅ Save to MongoDB
      const newTicket = new Ticket({
        id,
        origin,
        destination,
        departureTime,
        arrivalTime,
        price,
        availableSeats,
        totalSeats,
        status,
        serviceProvider,
        transportMode
      });

      await newTicket.save();
      console.log(`✅ Ticket also saved to MongoDB with ID: ${id}`);

      res.status(201).json({ message: '✅ Ticket created successfully.', ticketId: id });
    } catch (error) {
      console.error(`❌ Error during blockchain submitTransaction: ${error}`);
      res.status(500).json({ error: `Blockchain Error: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in createTicket handler: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get tickets by provider ID

exports.getTicketsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    const { Ticket } = require('../database/models'); // ✅ Ensure this exists

    const tickets = await Ticket.find({ serviceProvider: providerId });

    res.json(tickets);
  } catch (error) {
    console.error(`❌ MongoDB fallback error:`, error);
    res.status(500).json({ error: 'Failed to get tickets by provider (MongoDB)' });
  }
};


