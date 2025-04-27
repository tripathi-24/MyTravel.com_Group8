const { Provider } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const { registerService } = require('./blockchainService');

/**
 * Create a new service
 * @param {string} providerId - Provider ID
 * @param {Object} serviceData - Service data
 * @returns {Object} Service document
 */
const createService = async (providerId, serviceData) => {
  try {
    // Find the provider
    const provider = await Provider.findOne({ userId: providerId });
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // Generate service ID
    const serviceId = `service_${uuidv4().slice(0, 8)}`;
    
    // Register service on blockchain
    const transactionHash = await registerService(providerId, {
      serviceId,
      name: serviceData.name,
      price: serviceData.price,
      category: serviceData.category || provider.serviceType
    });
    
    // Create service object
    const newService = {
      serviceId,
      name: serviceData.name,
      description: serviceData.description,
      price: serviceData.price,
      availability: serviceData.availability || {
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Default 1 year availability
      },
      transactionHash,
      capacity: serviceData.capacity,
      isActive: true,
      images: serviceData.images || [],
      category: serviceData.category || provider.serviceType
    };
    
    // Add service to provider's services array
    provider.services.push(newService);
    await provider.save();
    
    return {
      success: true,
      service: newService
    };
  } catch (error) {
    throw new Error(`Failed to create service: ${error.message}`);
  }
};

/**
 * Update a service
 * @param {string} providerId - Provider ID
 * @param {string} serviceId - Service ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated service
 */
const updateService = async (providerId, serviceId, updateData) => {
  try {
    // Find the provider
    const provider = await Provider.findOne({ userId: providerId });
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    // Find the service index
    const serviceIndex = provider.services.findIndex(s => s.serviceId === serviceId);
    if (serviceIndex === -1) {
      throw new Error('Service not found');
    }
    
    // Update fields
    if (updateData.name) provider.services[serviceIndex].name = updateData.name;
    if (updateData.description) provider.services[serviceIndex].description = updateData.description;
    if (updateData.price) provider.services[serviceIndex].price = updateData.price;
    if (updateData.availability) provider.services[serviceIndex].availability = updateData.availability;
    if (updateData.capacity) provider.services[serviceIndex].capacity = updateData.capacity;
    if (updateData.isActive !== undefined) provider.services[serviceIndex].isActive = updateData.isActive;
    if (updateData.images) provider.services[serviceIndex].images = updateData.images;
    if (updateData.category) provider.services[serviceIndex].category = updateData.category;
    
    // Register update on blockchain for price changes
    if (updateData.price) {
      // Only create a blockchain transaction for price changes
      const transactionHash = await registerService(providerId, {
        serviceId,
        name: provider.services[serviceIndex].name,
        price: updateData.price,
        category: provider.services[serviceIndex].category
      });
      
      provider.services[serviceIndex].transactionHash = transactionHash;
    }
    
    await provider.save();
    
    return {
      success: true,
      service: provider.services[serviceIndex]
    };
  } catch (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }
};

/**
 * Get services for a provider
 * @param {string} providerId - Provider ID
 * @returns {Array} Services array
 */
const getProviderServices = async (providerId) => {
  try {
    // Find the provider
    const provider = await Provider.findOne({ userId: providerId });
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    return {
      success: true,
      services: provider.services
    };
  } catch (error) {
    throw new Error(`Failed to get services: ${error.message}`);
  }
};

/**
 * Search for services
 * @param {Object} searchParams - Search parameters
 * @returns {Array} Matching services
 */
const searchServices = async (searchParams) => {
  try {
    const query = {};
    
    // Build query for providers with active services only
    query['services.isActive'] = true;
    
    // Add other search parameters
    if (searchParams.serviceType) {
      query['serviceType'] = searchParams.serviceType;
    }
    
    if (searchParams.transportMode) {
      query['transportMode'] = searchParams.transportMode;
    }
    
    // If searching by service name or description, use regex
    if (searchParams.keyword) {
      query['$or'] = [
        { 'services.name': { $regex: searchParams.keyword, $options: 'i' } },
        { 'services.description': { $regex: searchParams.keyword, $options: 'i' } },
        { 'businessName': { $regex: searchParams.keyword, $options: 'i' } }
      ];
    }
    
    // If searching by price range
    if (searchParams.minPrice || searchParams.maxPrice) {
      query['services.price'] = {};
      if (searchParams.minPrice) {
        query['services.price'].$gte = searchParams.minPrice;
      }
      if (searchParams.maxPrice) {
        query['services.price'].$lte = searchParams.maxPrice;
      }
    }
    
    // Find providers matching the query
    const providers = await Provider.find(query);
    
    // Extract and format services
    const services = [];
    providers.forEach(provider => {
      provider.services.forEach(service => {
        if (service.isActive) {
          services.push({
            serviceId: service.serviceId,
            name: service.name,
            description: service.description,
            price: service.price,
            availability: service.availability,
            category: service.category,
            provider: {
              providerId: provider.userId,
              businessName: provider.businessName,
              serviceType: provider.serviceType,
              ratings: provider.ratings
            }
          });
        }
      });
    });
    
    return {
      success: true,
      services
    };
  } catch (error) {
    throw new Error(`Failed to search services: ${error.message}`);
  }
};

/**
 * Get service details
 * @param {string} serviceId - Service ID
 * @returns {Object} Service details
 */
const getServiceDetails = async (serviceId) => {
  try {
    // Find provider with this service
    const provider = await Provider.findOne({ 'services.serviceId': serviceId });
    if (!provider) {
      throw new Error('Service not found');
    }
    
    // Get the service
    const service = provider.services.find(s => s.serviceId === serviceId);
    
    return {
      success: true,
      service: {
        ...service.toObject(),
        provider: {
          providerId: provider.userId,
          businessName: provider.businessName,
          serviceType: provider.serviceType,
          ratings: provider.ratings,
          phone: provider.phone
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to get service details: ${error.message}`);
  }
};

module.exports = {
  createService,
  updateService,
  getProviderServices,
  searchServices,
  getServiceDetails
}; 