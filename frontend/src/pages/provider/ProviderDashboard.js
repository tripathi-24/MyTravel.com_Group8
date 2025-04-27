import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const ProviderDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Provider Dashboard
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is a placeholder for the Provider Dashboard page.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ProviderDashboard; 