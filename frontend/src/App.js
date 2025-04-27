import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Auth pages
import LoginPage from './pages/LoginPage';
import CustomerRegisterPage from './pages/CustomerRegisterPage';
import ProviderRegisterPage from './pages/ProviderRegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';

// Protected route component
import ProtectedRoute from './components/ProtectedRoute';

// Customer pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import SearchTickets from './pages/customer/SearchTickets';
import TicketDetails from './pages/customer/TicketDetails';
import BookingConfirmation from './pages/customer/BookingConfirmation';
import MyBookings from './pages/customer/MyBookings';
import Wallet from './pages/customer/Wallet';

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import CreateTicket from './pages/provider/CreateTicket';
import ManageTickets from './pages/provider/ManageTickets';

// Common pages
import HomePage from './pages/HomePage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/customer" element={<CustomerRegisterPage />} />
            <Route path="/register/provider" element={<ProviderRegisterPage />} />

            {/* Shared protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Protected Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/search" element={<SearchTickets />} />
              <Route path="/customer/tickets/:id" element={<TicketDetails />} />
              <Route path="/customer/bookings/confirmation" element={<BookingConfirmation />} />
              <Route path="/customer/bookings" element={<MyBookings />} />
              <Route path="/customer/wallet" element={<Wallet />} />
            </Route>

            {/* Protected Provider Routes */}
            <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/tickets/create" element={<CreateTicket />} />
              <Route path="/provider/tickets" element={<ManageTickets />} />
            </Route>

            {/* Fallback 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </AuthProvider>
  );
}

export default App;
