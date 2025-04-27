import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Divider,
  useTheme,
} from '@mui/material';
import {
  FlightTakeoff,
  DirectionsBus,
  DirectionsBoat,
  Security,
  AccountBalance,
  Money,
} from '@mui/icons-material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HotelIcon from '@mui/icons-material/Hotel';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  
  // Get CTA based on authentication status
  const getCallToAction = () => {
    if (!isAuthenticated) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/register/customer"
            color="primary"
          >
            Register as Customer
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/register/provider"
            color="primary"
          >
            Register as Provider
          </Button>
          <Button
            variant="text"
            size="large"
            component={RouterLink}
            to="/login"
            color="primary"
          >
            Already have an account? Log in
          </Button>
        </Box>
      );
    }
    
    if (user.role === 'customer') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/customer/search"
            color="primary"
          >
            Search Tickets
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/customer/bookings"
            color="primary"
          >
            View My Bookings
          </Button>
        </Box>
      );
    }
    
    if (user.role === 'provider') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/provider/tickets/create"
            color="primary"
          >
            Create New Ticket
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/provider/tickets"
            color="primary"
          >
            Manage Tickets
          </Button>
        </Box>
      );
    }
    
    return null;
  };
  
  // Transport modes
  const transportModes = [
    {
      title: 'Air Travel',
      icon: <FlightTakeoff fontSize="large" color="primary" />,
      description: 'Book flights from airlines across the globe with secure blockchain-verified transactions.',
    },
    {
      title: 'Land Transport',
      icon: <DirectionsBus fontSize="large" color="primary" />,
      description: 'Find buses, trains, and other land transportation options for your journey.',
    },
    {
      title: 'Water Transport',
      icon: <DirectionsBoat fontSize="large" color="primary" />,
      description: 'Book ferries, cruises, and water transportation with transparent pricing.',
    },
  ];
  
  // Benefits
  const benefits = [
    {
      title: 'Secure Transactions',
      icon: <Security fontSize="large" color="secondary" />,
      description: 'All bookings are secured by blockchain technology, providing immutable records of transactions.',
    },
    {
      title: 'Transparent Pricing',
      icon: <Money fontSize="large" color="secondary" />,
      description: 'Dynamic pricing is transparent and fair, calculated based on demand and availability.',
    },
    {
      title: 'Decentralized System',
      icon: <AccountBalance fontSize="large" color="secondary" />,
      description: 'Our platform uses a decentralized approach, minimizing the risks of data breaches or fraud.',
    },
  ];
  
  const features = [
    {
      icon: <DirectionsBusIcon fontSize="large" />,
      title: 'Transportation',
      description: 'Book bus, train, and flight tickets directly through our platform'
    },
    {
      icon: <HotelIcon fontSize="large" />,
      title: 'Accommodations',
      description: 'Find hotels, hostels, and vacation rentals for all your travel needs'
    },
    {
      icon: <RestaurantIcon fontSize="large" />,
      title: 'Dining',
      description: 'Discover restaurants and reserve tables at your destination'
    }
  ];
  
  const destinations = [
    {
      image: 'https://source.unsplash.com/random/300x200/?new-york',
      title: 'New York',
      description: 'Explore the iconic city that never sleeps'
    },
    {
      image: 'https://source.unsplash.com/random/300x200/?paris',
      title: 'Paris',
      description: 'Experience the city of love and its romantic charm'
    },
    {
      image: 'https://source.unsplash.com/random/300x200/?tokyo',
      title: 'Tokyo',
      description: 'Immerse yourself in the blend of tradition and innovation'
    }
  ];
  
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://source.unsplash.com/random/1600x900/?travel)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          py: 10,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center" color="white">
            <Typography variant="h2" component="h1" gutterBottom>
              Travel Smart with MyTravel
            </Typography>
            <Typography variant="h5" component="h2" paragraph>
              Book tickets, find accommodations, and plan your journey on a secure blockchain platform
            </Typography>
            
            {!user ? (
              <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Grid item>
                  <Button 
                    variant="contained" 
                    size="large" 
                    startIcon={<PersonIcon />}
                    component={RouterLink} 
                    to="/register/customer"
                  >
                    Register as Traveler
                  </Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large" 
                    startIcon={<BusinessIcon />}
                    component={RouterLink} 
                    to="/register/provider"
                  >
                    Register as Provider
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<FlightTakeoffIcon />}
                component={RouterLink} 
                to="/dashboard"
                sx={{ mt: 4 }}
              >
                Go to Dashboard
              </Button>
            )}
          </Box>
        </Container>
      </Box>
      
      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom>
          Travel Services on the Blockchain
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Our platform offers secure and transparent travel services powered by blockchain technology
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper elevation={3} sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* Popular Destinations */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Popular Destinations
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
            Discover trending locations for your next adventure
          </Typography>
          
          <Grid container spacing={4}>
            {destinations.map((destination, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={destination.image}
                    alt={destination.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h3">
                      {destination.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {destination.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Explore
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Container maxWidth="md" sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Ready to start your journey?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Join MyTravel today and experience a new way to plan and book your travel
        </Typography>
        
        {!user ? (
          <Button 
            variant="contained" 
            size="large"
            component={RouterLink} 
            to="/login"
          >
            Login or Register
          </Button>
        ) : (
          <Button 
            variant="contained" 
            size="large"
            component={RouterLink} 
            to="/dashboard"
          >
            Go to Dashboard
          </Button>
        )}
      </Container>
    </Box>
  );
};

export default HomePage; 