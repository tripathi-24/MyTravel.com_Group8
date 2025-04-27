const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const connectDB = require('../database/connect');
const { Customer, Provider } = require('../database/models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Number of test records to create
const NUM_CUSTOMERS = 80;
const NUM_PROVIDERS = 30;
const NUM_SERVICES_PER_PROVIDER = 5;
const NUM_BOOKINGS_PER_CUSTOMER = 3;

// Service types
const SERVICE_TYPES = ['Hotel', 'Transportation', 'Tour Guide', 'Restaurant', 'Activity', 'Other'];

// Helper functions to generate fake data
const generateFakeCustomer = async (index) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const userId = `customer_${index}_${uuidv4().slice(0, 6)}`;
  
  // Generate blockchain ID
  const blockchainId = crypto.createHash('sha256')
    .update(`${userId}-customer-${Date.now()}`)
    .digest('hex');
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  return {
    userId,
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }),
    password: hashedPassword,
    phone: faker.phone.number(),
    visibility: faker.helpers.arrayElement(['public', 'private', 'friends']),
    blockchainIdentifier: blockchainId,
    preferences: {
      travelModes: faker.helpers.arrayElements(['flight', 'train', 'bus', 'car', 'ship'], faker.number.int({ min: 1, max: 3 })),
      destinations: faker.helpers.arrayElements(['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Australia'], faker.number.int({ min: 1, max: 3 })),
      accommodationTypes: faker.helpers.arrayElements(['hotel', 'hostel', 'apartment', 'resort', 'villa'], faker.number.int({ min: 1, max: 3 })),
      budgetRange: {
        min: faker.number.int({ min: 100, max: 500 }),
        max: faker.number.int({ min: 1000, max: 5000 })
      }
    },
    bookings: []
  };
};

const generateFakeProvider = async (index) => {
  const businessName = faker.company.name();
  const userId = `provider_${index}_${uuidv4().slice(0, 6)}`;
  const serviceType = faker.helpers.arrayElement(SERVICE_TYPES);
  
  // Generate blockchain ID
  const blockchainId = crypto.createHash('sha256')
    .update(`${userId}-provider-${Date.now()}`)
    .digest('hex');
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  return {
    userId,
    businessName,
    email: faker.internet.email({ firstName: businessName, lastName: 'travel' }),
    password: hashedPassword,
    phone: faker.phone.number(),
    serviceType,
    transportMode: 'land',
    blockchainIdentifier: blockchainId,
    businessAddress: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode()
    },
    businessDescription: faker.company.catchPhrase(),
    verificationStatus: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
    services: [],
    ratings: {
      average: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
      count: faker.number.int({ min: 10, max: 200 })
    },
    bookings: []
  };
};

const generateFakeService = (provider, index) => {
  const serviceId = `service_${provider.userId.split('_')[1]}_${index}`;
  
  // Generate transaction hash
  const transactionHash = crypto.createHash('sha256')
    .update(`service-${provider.userId}-${serviceId}-${Date.now()}`)
    .digest('hex');
  
  return {
    serviceId,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 50, max: 1000 }),
    availability: {
      startDate: faker.date.future(),
      endDate: faker.date.future({ years: 1 }),
      recurrence: faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'none'])
    },
    transactionHash,
    capacity: faker.number.int({ min: 1, max: 20 }),
    isActive: true,
    images: Array(faker.number.int({ min: 1, max: 4 })).fill().map(() => faker.image.url()),
    category: provider.serviceType
  };
};

const createBookings = async (customers, providers) => {
  console.log('Creating bookings...');
  
  // Create bookings for each customer
  for (const customer of customers) {
    // Select random providers
    const selectedProviders = faker.helpers.arrayElements(providers, NUM_BOOKINGS_PER_CUSTOMER);
    
    for (const provider of selectedProviders) {
      // Select a random service from the provider
      if (provider.services.length === 0) continue;
      
      const service = faker.helpers.arrayElement(provider.services);
      const bookingId = `booking_${uuidv4().slice(0, 8)}`;
      
      // Generate transaction hash
      const transactionHash = crypto.createHash('sha256')
        .update(`booking-${customer.userId}-${provider.userId}-${service.serviceId}-${Date.now()}`)
        .digest('hex');
      
      // Create booking status
      const status = faker.helpers.arrayElement(['pending', 'confirmed', 'completed', 'cancelled']);
      const bookingDate = faker.date.past();
      const serviceDate = faker.date.future();
      
      // Add booking to customer
      const customerBooking = {
        bookingId,
        providerUserId: provider.userId,
        serviceType: service.category,
        status,
        transactionHash,
        bookingDate,
        serviceDate,
        amount: service.price
      };
      
      // Add rating and feedback for completed bookings
      if (status === 'completed') {
        customerBooking.rating = faker.number.int({ min: 1, max: 5 });
        customerBooking.feedback = faker.lorem.sentence();
      }
      
      customer.bookings.push(customerBooking);
      
      // Add booking to provider
      const providerBooking = {
        bookingId,
        customerUserId: customer.userId,
        serviceId: service.serviceId,
        status,
        transactionHash,
        bookingDate,
        serviceDate,
        amount: service.price
      };
      
      provider.bookings.push(providerBooking);
    }
    
    // Save customer with bookings
    await customer.save();
  }
  
  // Save all providers with bookings
  for (const provider of providers) {
    await provider.save();
  }
  
  console.log('Bookings created successfully');
};

// Seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Delete existing data
    console.log('Clearing existing data...');
    await Customer.deleteMany({});
    await Provider.deleteMany({});
    
    // Create customers
    console.log(`Creating ${NUM_CUSTOMERS} customers...`);
    const customers = [];
    
    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      const customerData = await generateFakeCustomer(i + 1);
      const customer = await Customer.create(customerData);
      customers.push(customer);
    }
    
    console.log('Customers created successfully');
    
    // Create providers with services
    console.log(`Creating ${NUM_PROVIDERS} providers...`);
    const providers = [];
    
    for (let i = 0; i < NUM_PROVIDERS; i++) {
      const providerData = await generateFakeProvider(i + 1);
      
      // Add services to provider
      for (let j = 0; j < NUM_SERVICES_PER_PROVIDER; j++) {
        const service = generateFakeService(providerData, j + 1);
        providerData.services.push(service);
      }
      
      const provider = await Provider.create(providerData);
      providers.push(provider);
    }
    
    console.log('Providers created successfully');
    
    // Create bookings between customers and providers
    await createBookings(customers, providers);
    
    console.log('Database seeded successfully!');
    
    // Create test accounts for easy login
    console.log('Creating test accounts...');
    
    // Create a test customer
    const salt = await bcrypt.genSalt(10);
    const testCustomerPassword = await bcrypt.hash('password123', salt);
    
    await Customer.create({
      userId: 'customer_test',
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test.customer@example.com',
      password: testCustomerPassword,
      phone: '1234567890',
      visibility: 'public',
      blockchainIdentifier: crypto.createHash('sha256').update('customer_test-customer').digest('hex'),
      bookings: []
    });
    
    // Create a test provider
    const testProviderPassword = await bcrypt.hash('password123', salt);
    
    await Provider.create({
      userId: 'provider_test',
      businessName: 'Test Travel Agency',
      email: 'test.provider@example.com',
      password: testProviderPassword,
      phone: '9876543210',
      serviceType: 'Hotel',
      transportMode: 'land',
      blockchainIdentifier: crypto.createHash('sha256').update('provider_test-provider').digest('hex'),
      verificationStatus: 'verified',
      services: [
        {
          serviceId: 'service_test_1',
          name: 'Luxury Hotel Stay',
          description: 'A luxurious stay at our 5-star hotel',
          price: 500,
          availability: {
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            recurrence: 'daily'
          },
          transactionHash: crypto.createHash('sha256').update('service-provider_test-service_test_1').digest('hex'),
          capacity: 2,
          isActive: true,
          images: [faker.image.url()],
          category: 'Hotel'
        }
      ],
      bookings: [],
      ratings: {
        average: 4.8,
        count: 120
      }
    });
    
    console.log('Test accounts created successfully:');
    console.log('- Customer: customer_test / password123');
    console.log('- Provider: provider_test / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 