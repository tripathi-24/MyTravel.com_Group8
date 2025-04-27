import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListIcon from '@mui/icons-material/List';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Dashboard page that shows navigation options based on user role
 */
const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            User not authenticated
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Customer dashboard
  if (user.role === 'customer') {
    const navigationItems = [
      {
        title: 'Search Tickets',
        description: 'Find and book travel tickets',
        icon: <SearchIcon fontSize="large" color="primary" />,
        path: '/customer/search'
      },
      {
        title: 'My Bookings',
        description: 'View and manage your bookings',
        icon: <BookIcon fontSize="large" color="primary" />,
        path: '/customer/bookings'
      },
      {
        title: 'Wallet',
        description: 'Manage your travel wallet',
        icon: <AccountBalanceWalletIcon fontSize="large" color="primary" />,
        path: '/customer/wallet'
      },
      {
        title: 'Profile',
        description: 'View and update your profile',
        icon: <PersonIcon fontSize="large" color="primary" />,
        path: '/profile'
      }
    ];
    
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user.name || 'Customer'}!
          </Typography>
          <Typography variant="body1">
            This is your customer dashboard where you can manage all your travel needs.
          </Typography>
        </Paper>
        
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          {navigationItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    component={RouterLink}
                    to={item.path}
                  >
                    Go to {item.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have no recent activity.
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  // Provider dashboard
  if (user.role === 'provider') {
    const navigationItems = [
      {
        title: 'Create Ticket',
        description: 'Add new travel tickets',
        icon: <AddCircleIcon fontSize="large" color="primary" />,
        path: '/provider/tickets/create'
      },
      {
        title: 'Manage Tickets',
        description: 'Edit and manage your tickets',
        icon: <ListIcon fontSize="large" color="primary" />,
        path: '/provider/tickets'
      },
      {
        title: 'Profile',
        description: 'View and update your business profile',
        icon: <PersonIcon fontSize="large" color="primary" />,
        path: '/profile'
      }
    ];
    
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.name || 'Provider'}!
          </Typography>
          <Typography variant="body1">
            This is your service provider dashboard where you can manage your travel services.
          </Typography>
        </Paper>
        
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          {navigationItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    component={RouterLink}
                    to={item.path}
                  >
                    Go to {item.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h4" color="primary">0</Typography>
                <Typography variant="body2">Active Tickets</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h4" color="primary">0</Typography>
                <Typography variant="body2">Bookings</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="h4" color="primary">$0</Typography>
                <Typography variant="body2">Revenue</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }
  
  // Default dashboard (shouldn't reach here)
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to your dashboard.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/profile"
          sx={{ mt: 2 }}
        >
          View Profile
        </Button>
      </Paper>
    </Container>
  );
};

export default DashboardPage; 