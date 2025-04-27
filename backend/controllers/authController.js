const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getContractInstance, registerUser } = require('../fabric/network');
const { Customer, Provider } = require('../database/models');

// Register a new customer
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, visibility, password } = req.body;

    if (!name || !email || !phone || !visibility || !password) {
      return res.status(400).json({ error: 'All fields are required including password' });
    }

    const customerId = `customer_${uuidv4().slice(0, 6)}`;
    await registerUser(customerId);

    const { gateway, contract } = await getContractInstance(customerId);

    try {
      await contract.submitTransaction('RegisterCustomer', customerId, name, email, phone, visibility);

      const customerData = await contract.evaluateTransaction('GetCustomer', customerId);
      const customer = JSON.parse(customerData.toString());

      if (!customer || customer.id !== customerId) {
        return res.status(500).json({ error: 'Customer registration verification failed' });
      }

      // 🟡 Debug password being saved
      console.log('🟡 Password to store in MongoDB:', password);

      // 🔁 Save to MongoDB
      try {
        const savedCustomer = await Customer.create({
          userId: customerId,
          name,
          email,
          phone,
          visibility,
          password, // Storing plain password
          role: 'customer'
        });

        console.log('✅ MongoDB customer saved:', savedCustomer.userId);
      } catch (mongoErr) {
        console.error('❌ Error saving customer to MongoDB:', mongoErr);
        return res.status(500).json({ error: 'MongoDB insertion failed', details: mongoErr.message });
      }

      const token = jwt.sign(
        { id: customerId, role: 'customer', name, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
      );

      res.status(201).json({
        message: 'Customer registered successfully',
        token,
        user: {
          id: customerId,
          name,
          email,
          phone,
          visibility,
          role: 'customer'
        }
      });
    } catch (error) {
      console.error(`❌ Error registering customer on blockchain: ${error}`);
      res.status(500).json({ error: `Failed to register customer: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Error in registerCustomer: ${error}`);
    res.status(500).json({ error: 'Server error' });
  }
};


// Register a new service provider
exports.registerProvider = async (req, res) => {
  try {
    const { name, email, phone, transportMode, password, businessName, serviceType } = req.body;

    if (!name || !email || !phone || !transportMode || !password || !businessName || !serviceType) {
      return res.status(400).json({ error: 'All fields are required including password, businessName and serviceType' });
    }

    const validModes = ['air', 'land', 'water'];
    if (!validModes.includes(transportMode)) {
      return res.status(400).json({ error: 'Invalid transport mode' });
    }

    const providerId = `provider_${uuidv4().slice(0, 6)}`;
    await registerUser(providerId);

    const { gateway, contract } = await getContractInstance(providerId);

    try {
      await contract.submitTransaction('RegisterProvider', providerId, name, email, phone, transportMode);

      const savedProvider = await Provider.create({
        userId: providerId,
        name,
        email,
        phone,
        transportMode,
        businessName,
        serviceType,
        password, // Store as plain text
        role: 'provider'
      });

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
      console.error(`Error registering provider on blockchain: ${error}`);
      res.status(500).json({ error: `Failed to register provider: ${error.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error in registerProvider: ${error}`);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login for customers and providers
exports.login = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ success: false, error: 'ID and password are required' });
    }

    const { gateway, contract } = await getContractInstance('admin');

    try {
      let userData = null;
      let role = '';
      let mongoUser = null;

      if (id.startsWith('customer_')) {
        try {
          const result = await contract.evaluateTransaction('GetCustomer', id);
          userData = JSON.parse(result.toString());
          role = 'customer';
          mongoUser = await Customer.findOne({ userId: id }).select('+password');
        } catch (_) {
          userData = null;
        }
      }

      if (!userData && id.startsWith('provider_')) {
        try {
          const result = await contract.evaluateTransaction('GetProvider', id);
          userData = JSON.parse(result.toString());
          role = 'provider';
          mongoUser = await Provider.findOne({ userId: id }).select('+password');
        } catch (_) {
          userData = null;
        }
      }

      if (!userData || !mongoUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (!userData.isActive) {
        return res.status(401).json({ success: false, error: 'Account is inactive' });
      }

      console.log('🟡 Password received:', password);
      console.log('🟡 Mongo stored password:', mongoUser.password);

      if (password !== mongoUser.password) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          id: userData.id,
          role,
          name: userData.name,
          email: userData.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          ...userData,
          role
        }
      });
    } catch (err) {
      console.error(`❌ Error during blockchain login: ${err}`);
      return res.status(500).json({ success: false, error: `Blockchain error: ${err.message}` });
    } finally {
      gateway.disconnect();
    }
  } catch (err) {
    console.error(`❌ Unexpected login error: ${err}`);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
