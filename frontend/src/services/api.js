import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Export api instance
export default api;

// -----------------------------------
// 📚 Auth Services
// -----------------------------------
export const authService = {
  registerCustomer: (data) => api.post('/auth/register-customer', data),
  registerProvider: (data) => api.post('/provider/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
};

// -----------------------------------
// 📚 Customer Services
// -----------------------------------
export const customerService = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (oldPassword, newPassword) => api.put('/auth/change-password', { currentPassword: oldPassword, newPassword }),
  getBookings: () => api.get('/bookings'),
  createBooking: (providerId, serviceId, serviceDate) => api.post('/bookings', { providerId, serviceId, serviceDate }),
  getWalletInfo: () => api.get('/payments/wallet'),
  depositToWallet: (amount) => api.post('/payments/wallet/add-funds', { amount }),
  withdrawFromWallet: (amount) => api.post('/payments/wallet/withdraw', { amount }),
};

// -----------------------------------
// 📚 Provider Services
// -----------------------------------
export const providerService = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (oldPassword, newPassword) => api.put('/auth/change-password', { currentPassword: oldPassword, newPassword }),
  getServices: () => api.get('/services/provider'),
  createService: (serviceData) => api.post('/services', serviceData),
  updateService: (serviceId, serviceData) => api.put(`/services/${serviceId}`, serviceData),
  getBookings: () => api.get('/bookings'),
};

// -----------------------------------
// 📚 Common Services
// -----------------------------------
export const commonService = {
  searchServices: (params) => api.get('/services/search', { params }),
  getServiceDetails: (serviceId) => api.get(`/services/${serviceId}`),
  getBookingDetails: (bookingId) => api.get(`/bookings/${bookingId}`),
  updateBookingStatus: (bookingId, status) => api.put(`/bookings/${bookingId}/status`, { status }),
};

// -----------------------------------
// 📚 Ticket Services
// -----------------------------------
export const ticketService = {
  searchTickets: (params) => api.get('/tickets', { params }),
  getTicketById: (id) => api.get(`/tickets/${id}`),
  getAvailableSeats: (id) => api.get(`/tickets/${id}/seats`),
};

// -----------------------------------
// 📚 Booking Services
// -----------------------------------
export const bookingService = {
  bookTicket: (bookingData) => api.post('/bookings', bookingData),
  confirmPayment: (paymentData) => api.post('/bookings/payment', paymentData),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
};

// -----------------------------------
// 📚 Payment Services
// -----------------------------------
export const paymentService = {
  getWalletBalance: () => api.get('/payments/wallet'),
  initializeWallet: () => api.post('/payments/wallet/initialize'),
  addFunds: (amount) => api.post('/payments/wallet/add-funds', { amount }),
  processPayment: (bookingId, amount) => api.post('/payments/process', { bookingId, amount }),
  processRefund: (bookingId, amount) => api.post('/payments/refund', { bookingId, amount }),
};
