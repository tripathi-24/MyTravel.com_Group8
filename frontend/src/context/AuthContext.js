import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api, { authService, customerService, providerService } from '../services/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Check if user is authenticated on initial load
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Set default headers for all requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Try to get user profile based on role stored in token
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const role = decodedToken.role;

      let response;
      if (role === 'customer') {
        response = await customerService.getProfile();
      } else if (role === 'provider') {
        response = await providerService.getProfile();
      } else {
        throw new Error('Invalid user role');
      }

      if (response && response.data) {
        setUser({
          ...response.data,
          role
        });
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Auth status error:', err);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Login function
  const login = async ({ id, password }) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { id, password });
      const { token, user } = res.data;
  
      // ✅ Extract firstName from full name (e.g., "Alice Dash" → "Alice")
      const [firstName] = user.name?.split(' ') || ['User'];
      user.firstName = firstName;
  
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
  
      setUser(user);
      setToken(token);
      setError(null);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };
  

  const registerCustomer = async (userData) => {
    setLoading(true);
    setError('');
    try {
      const backendData = {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phone: userData.phoneNumber,
        password: userData.password,
        visibility: 'public'
      };

      const response = await authService.registerCustomer(backendData);
      const { token, user } = response.data;
      return { success: true, userId: user.id };
    } catch (err) {
      console.error('Customer registration error:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const registerProvider = async (userData) => {
    setLoading(true);
    setError('');
    try {
      const backendData = {
        name: userData.businessName,
        email: userData.email,
        phone: userData.phoneNumber,
        password: userData.password,
        transportMode: mapServiceTypeToTransportMode(userData.serviceType)
      };

      const response = await authService.registerProvider(backendData);
      const { token, user } = response.data;
      return { success: true, userId: user.id };
    } catch (err) {
      console.error('Provider registration error:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const mapServiceTypeToTransportMode = (serviceType) => {
    switch (serviceType) {
      case 'Hotel':
      case 'Transportation':
      case 'Tour Guide':
      case 'Restaurant':
      case 'Activity':
      default:
        return 'land';
    }
  };

  const register = async (userData) => {
    if (userData.role === 'customer') {
      return registerCustomer(userData);
    } else if (userData.role === 'provider') {
      return registerProvider(userData);
    } else {
      setError('Invalid user role');
      return { success: false, error: 'Invalid user role' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (user.role === 'customer') {
        const updateData = {
          name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : undefined,
          email: userData.email,
          phone: userData.phoneNumber,
          visibility: userData.visibility || 'public'
        };
        if (userData.password) {
          updateData.password = userData.password;
        }
        response = await customerService.updateProfile(updateData);
      } else if (user.role === 'provider') {
        const updateData = {
          name: userData.businessName,
          email: userData.email,
          phone: userData.phoneNumber,
          transportMode: userData.transportMode || 'land'
        };
        if (userData.password) {
          updateData.password = userData.password;
        }
        response = await providerService.updateProfile(updateData);
      }

      setUser(prev => ({
        ...prev,
        ...(response?.data || {})
      }));

      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
      return { success: false, error: err.response?.data?.error || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (user.role === 'customer') {
        response = await customerService.changePassword(oldPassword, newPassword);
      } else if (user.role === 'provider') {
        response = await providerService.changePassword(oldPassword, newPassword);
      } else {
        throw new Error('Invalid user role');
      }
      return { success: true };
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
      return { success: false, error: err.response?.data?.error || 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    token,
    loading,
    error,
    setUser,
    setToken,
    setLoading,
    setError,
    checkAuthStatus,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
