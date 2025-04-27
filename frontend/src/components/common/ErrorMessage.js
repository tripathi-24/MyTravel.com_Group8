import React from 'react';
import { Alert, Box } from '@mui/material';

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  );
};

export default ErrorMessage; 