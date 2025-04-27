const { Customer, Provider } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const { generateBlockchainIdentifier } = require('./blockchainService');

// Helper to generate unique user IDs
const generateUserId = (role) => {
  return `${role}_${uuidv4().slice(0, 8)}`;
};

/**
 * Register a new customer
 * @param {Object} userData - Customer data
 * @returns {Object} Customer document and JWT token
 */
const registerCustomer = async (userData) => {
  try {
    // Generate a unique customer ID
    const userId = generateUserId('customer');
    
    // Create a new customer
    const customer = await Customer.create({
      userId,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      firstName: userData.name.split(' ')[0] || '', // Split name for first and last
      lastName: userData.name.split(' ').slice(1).join(' ') || '',
      visibility: userData.visibility || 'public'
    });

    // Generate blockchain identifier (in a real implementation, this would interact with the chaincode)
    const blockchainId = await generateBlockchainIdentifier(userId, 'customer');
    
    // Update customer with blockchain identifier
    customer.blockchainIdentifier = blockchainId;
    await customer.save();
    
    // Get JWT token
    const token = customer.getSignedJwtToken();
    
    return {
      success: true,
      token,
      user: {
        id: customer.userId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        visibility: customer.visibility,
        role: 'customer'
      }
    };
  } catch (error) {
    throw new Error(`Failed to register customer: ${error.message}`);
  }
};

/**
 * Register a new service provider
 * @param {Object} userData - Provider data
 * @returns {Object} Provider document and JWT token
 */
const registerProvider = async (userData) => {
  try {
    // Generate a unique provider ID
    const userId = generateUserId('provider');
    
    // Create a new provider
    const provider = await Provider.create({
      userId,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      businessName: userData.name,
      serviceType: userData.serviceType || 'Other',
      transportMode: userData.transportMode || 'land'
    });

    // Generate blockchain identifier (in a real implementation, this would interact with the chaincode)
    const blockchainId = await generateBlockchainIdentifier(userId, 'provider');
    
    // Update provider with blockchain identifier
    provider.blockchainIdentifier = blockchainId;
    await provider.save();
    
    // Get JWT token
    const token = provider.getSignedJwtToken();
    
    return {
      success: true,
      token,
      user: {
        id: provider.userId,
        name: provider.businessName,
        email: provider.email,
        phone: provider.phone,
        serviceType: provider.serviceType,
        transportMode: provider.transportMode,
        role: 'provider'
      }
    };
  } catch (error) {
    throw new Error(`Failed to register provider: ${error.message}`);
  }
};

/**
 * Login a user
 * @param {string} userId - User ID
 * @param {string} password - User password
 * @returns {Object} User document and JWT token
 */
const login = async (userId, password) => {
  try {
    // Check for user by userId
    const user = await Customer.findOne({ userId }).select('+password') || 
                 await Provider.findOne({ userId }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Create and return token
    const token = user.getSignedJwtToken();
    
    // Format user data based on role
    let userData;
    
    if (user.role === 'customer') {
      userData = {
        id: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        visibility: user.visibility,
        role: 'customer'
      };
    } else if (user.role === 'provider') {
      userData = {
        id: user.userId,
        name: user.businessName,
        email: user.email,
        phone: user.phone,
        serviceType: user.serviceType,
        transportMode: user.transportMode,
        role: 'provider'
      };
    }
    
    return {
      success: true,
      token,
      user: userData
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Object} User document
 */
const getUserProfile = async (userId) => {
  try {
    // Find user
    const user = await Customer.findOne({ userId }) || 
                 await Provider.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      success: true,
      user
    };
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user document
 */
const updateUserProfile = async (userId, updateData) => {
  try {
    let user = await Customer.findOne({ userId }) || 
               await Provider.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update fields based on role
    if (user.role === 'customer') {
      if (updateData.name) {
        const nameParts = updateData.name.split(' ');
        user.firstName = nameParts[0] || user.firstName;
        user.lastName = nameParts.slice(1).join(' ') || user.lastName;
      }
      
      if (updateData.email) user.email = updateData.email;
      if (updateData.phone) user.phone = updateData.phone;
      if (updateData.visibility) user.visibility = updateData.visibility;
      
      // Update password if provided
      if (updateData.password) {
        user.password = updateData.password;
      }
    } else if (user.role === 'provider') {
      if (updateData.name) user.businessName = updateData.name;
      if (updateData.email) user.email = updateData.email;
      if (updateData.phone) user.phone = updateData.phone;
      if (updateData.serviceType) user.serviceType = updateData.serviceType;
      if (updateData.transportMode) user.transportMode = updateData.transportMode;
      
      // Update password if provided
      if (updateData.password) {
        user.password = updateData.password;
      }
    }
    
    // Save updated user
    await user.save();
    
    return {
      success: true,
      user
    };
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Success message
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user with password field
    const user = await Customer.findOne({ userId }).select('+password') || 
                 await Provider.findOne({ userId }).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    throw new Error(`Failed to change password: ${error.message}`);
  }
};

module.exports = {
  registerCustomer,
  registerProvider,
  login,
  getUserProfile,
  updateUserProfile,
  changePassword
}; 