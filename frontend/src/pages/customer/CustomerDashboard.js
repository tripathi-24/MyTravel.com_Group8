import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Grid, Box, Card, 
  CardContent, CardMedia, CardActionArea, CircularProgress,
  Divider, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Dashboard card component
const DashboardCard = ({ title, icon, description, path, navigate }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea 
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        onClick={() => navigate(path)}
      >
        <CardMedia
          component="div"
          sx={{
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'primary.light',
            color: 'white'
          }}
        >
          {icon}
        </CardMedia>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="div" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await customerService.getBookings();
        if (response.data && response.data.bookings) {
          setBookings(response.data.bookings);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your booking information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, []);
  
  // Calculate booking statistics
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  // Compute welcome name
  const welcomeName = user?.firstName || user?.name?.split(' ')[0] || 'Customer';
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.name || 'Customer'}!
          </Typography>

            <Typography variant="body1">
              Manage your travel bookings and find new travel services all in one place.
            </Typography>
          </Paper>
        </Grid>
        
        {/* Booking Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Your Bookings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h3" color="primary">
                    {pendingBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h3" color="info.main">
                    {confirmedBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h3" color="success.main">
                    {completedBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h3" color="error.main">
                    {cancelledBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        
        {/* Navigation Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title="Search Services"
            icon={<Typography variant="h2">🔍</Typography>}
            description="Find and book new travel services based on your preferences."
            path="/customer/search"
            navigate={navigate}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title="My Bookings"
            icon={<Typography variant="h2">📅</Typography>}
            description="View and manage your current and past bookings."
            path="/customer/bookings"
            navigate={navigate}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard
            title="My Profile"
            icon={<Typography variant="h2">👤</Typography>}
            description="Update your personal information and preferences."
            path="/profile"
            navigate={navigate}
          />
        </Grid>
        
        {/* Wallet coming soon */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2, textAlign: 'center', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <Typography variant="h6" color="text.secondary">
              Wallet Feature Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Soon you'll be able to manage your travel funds with our secure blockchain wallet.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerDashboard;
