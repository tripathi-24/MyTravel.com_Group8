import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Grid, Box, 
  CircularProgress, Tabs, Tab, Chip, Divider,
  Button, Card, CardContent, CardActions, Alert,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { customerService, commonService } from '../../services/api';

// Helper to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Status chip component
const StatusChip = ({ status }) => {
  let color = 'default';
  
  switch (status) {
    case 'pending':
      color = 'warning';
      break;
    case 'confirmed':
      color = 'info';
      break;
    case 'completed':
      color = 'success';
      break;
    case 'cancelled':
      color = 'error';
      break;
    default:
      color = 'default';
  }
  
  return (
    <Chip 
      label={status.charAt(0).toUpperCase() + status.slice(1)} 
      color={color} 
      size="small"
    />
  );
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellationInProgress, setCancellationInProgress] = useState(false);
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await customerService.getBookings();
        
        if (response.data && response.data.bookings) {
          // Sort bookings by date (most recent first)
          const sortedBookings = [...response.data.bookings].sort(
            (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
          );
          setBookings(sortedBookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelDialog(true);
  };
  
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setCancellationInProgress(true);
      
      await commonService.updateBookingStatus(selectedBooking.bookingId, 'cancelled');
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.bookingId === selectedBooking.bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      
      setCancelDialog(false);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again later.');
    } finally {
      setCancellationInProgress(false);
    }
  };
  
  // Filter bookings based on selected tab
  const filteredBookings = bookings.filter(booking => {
    switch(tabValue) {
      case 0: // All
        return true;
      case 1: // Upcoming
        return ['pending', 'confirmed'].includes(booking.status);
      case 2: // Completed
        return booking.status === 'completed';
      case 3: // Cancelled
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Bookings
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab label="All" />
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
        
        {filteredBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No bookings found in this category.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/customer/search')}
            >
              Find Services
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredBookings.map((booking) => (
              <Grid item xs={12} key={booking.bookingId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {booking.serviceType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Booking ID: {booking.bookingId}
                        </Typography>
                      </Box>
                      <StatusChip status={booking.status} />
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Booking Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(booking.bookingDate)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Service Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(booking.serviceDate)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Provider ID
                        </Typography>
                        <Typography variant="body1" noWrap>
                          {booking.providerUserId}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          ${booking.amount}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                  
                  <CardActions>
                    {/* Only show cancel button for pending or confirmed bookings */}
                    {['pending', 'confirmed'].includes(booking.status) && (
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleCancelClick(booking)}
                      >
                        Cancel Booking
                      </Button>
                    )}
                    
                    {/* Show rate button for completed bookings without a rating */}
                    {booking.status === 'completed' && !booking.rating && (
                      <Button 
                        size="small" 
                        color="primary"
                      >
                        Rate Service
                      </Button>
                    )}
                    
                    {/* View details button for all bookings */}
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => console.log('View details for', booking.bookingId)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Cancel Booking Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => !cancellationInProgress && setCancelDialog(false)}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialog(false)} 
            disabled={cancellationInProgress}
          >
            No, Keep Booking
          </Button>
          <Button 
            onClick={handleCancelBooking} 
            color="error" 
            disabled={cancellationInProgress}
          >
            {cancellationInProgress ? <CircularProgress size={24} /> : 'Yes, Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings; 