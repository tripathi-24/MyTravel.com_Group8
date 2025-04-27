import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const ManageTickets = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Manage Tickets
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          This is a placeholder for the Manage Tickets page.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ManageTickets; 