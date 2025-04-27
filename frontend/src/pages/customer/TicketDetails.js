import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Grid, Box, Button, 
  Divider, CircularProgress, Card, CardContent,
  Chip, TextField, Alert, Dialog, DialogActions, 
  DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useParams, useNavigate } from 'react-router-dom';
import { commonService, customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);
        const response = await commonService.getServiceDetails(id);
        setService(response.data.service);
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError('Failed to load service details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id]);

  const handleBookingClick = () => {
    if (!selectedDate) {
      setError('Please select a date for your booking');
      return;
    }
    setBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    try {
      setBookingInProgress(true);
      setBookingError(null);
      
      const response = await customerService.createBooking(
        service.provider.providerId,
        service.serviceId,
        selectedDate.toISOString()
      );
      
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/customer/bookings');
      }, 2000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingError('Failed to create booking. Please try again later.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Flexible';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !service) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/customer/search')}
        >
          Back to Search
        </Button>
      </Container>
    );
  }

  if (!service) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        variant="outlined"
        sx={{ mb: 2 }}
        onClick={() => navigate('/customer/search')}
      >
        Back to Search
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {service.name}
            </Typography>
            
            <Chip 
              label={service.category}
              color="primary" 
              variant="outlined" 
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body1" paragraph>
              {service.description || 'No description available.'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Price</Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  ${service.price}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Availability</Typography>
                <Typography variant="body1">
                  {service.availability ? (
                    <>
                      From: {formatDate(service.availability.startDate)}<br/>
                      To: {formatDate(service.availability.endDate)}
                    </>
                  ) : 'Contact provider for availability'}
                </Typography>
              </Grid>
              
              {service.capacity && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Capacity</Typography>
                  <Typography variant="body1">
                    {service.capacity} {service.capacity === 1 ? 'person' : 'people'}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Book this Service
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newDate) => {
                  setSelectedDate(newDate);
                  setError(null);
                }}
                renderInput={(params) => 
                  <TextField {...params} fullWidth sx={{ mb: 3 }} />
                }
                minDate={service.availability?.startDate ? new Date(service.availability.startDate) : new Date()}
                maxDate={service.availability?.endDate ? new Date(service.availability.endDate) : undefined}
              />
            </LocalizationProvider>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleBookingClick}
              disabled={!selectedDate}
            >
              Book Now
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provider Information
              </Typography>
              
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {service.provider.businessName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {service.provider.serviceType}
              </Typography>
              
              {service.provider.ratings && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2">
                    Rating: {service.provider.ratings.average} ({service.provider.ratings.count} reviews)
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 1.5 }} />
              
              <Typography variant="body2">
                Contact: {service.provider.phone}
              </Typography>
            </CardContent>
          </Card>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Booking Policy
            </Typography>
            
            <Typography variant="body2" paragraph>
              • Bookings can be cancelled up to 48 hours before the service date for a full refund.
            </Typography>
            
            <Typography variant="body2" paragraph>
              • Please arrive 15 minutes before the scheduled time.
            </Typography>
            
            <Typography variant="body2">
              • For any questions regarding this service, please contact the provider directly.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Booking Confirmation Dialog */}
      <Dialog
        open={bookingDialog}
        onClose={() => !bookingInProgress && setBookingDialog(false)}
      >
        <DialogTitle>Confirm Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to book {service.name} for {selectedDate && formatDate(selectedDate)}. 
            The total cost will be ${service.price}.
          </DialogContentText>
          
          {bookingError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {bookingError}
            </Alert>
          )}
          
          {bookingSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Booking successful! Redirecting to your bookings...
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBookingDialog(false)} 
            disabled={bookingInProgress || bookingSuccess}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            variant="contained" 
            disabled={bookingInProgress || bookingSuccess}
          >
            {bookingInProgress ? <CircularProgress size={24} /> : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TicketDetails; 