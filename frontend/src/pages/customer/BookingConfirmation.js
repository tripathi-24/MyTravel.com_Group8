import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const BookingConfirmation = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Booking Confirmation
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is a placeholder for the Booking Confirmation page.
        </Typography>
      </Paper>
    </Container>
  );
};

export default BookingConfirmation; 