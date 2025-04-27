import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * ProtectedRoute component to secure routes requiring authentication.
 * Optionally restricts access based on user roles.
 * 
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Roles allowed to access the route
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    checkAuthStatus(); // Trigger auth check on mount
  }, [checkAuthStatus]);

  // Show spinner while auth is being validated
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login and preserve attempted URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not authorized for the role-restricted route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized, render the protected route
  return <Outlet />;
};

export default ProtectedRoute;
