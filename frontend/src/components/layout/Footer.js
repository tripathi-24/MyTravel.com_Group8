import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  useTheme
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();
  
  const companyLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Careers', path: '/careers' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' }
  ];
  
  const customerLinks = [
    { name: 'Search Tickets', path: '/customer/search' },
    { name: 'My Bookings', path: '/customer/bookings' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Help Center', path: '/help' }
  ];
  
  const providerLinks = [
    { name: 'Register as Provider', path: '/register/provider' },
    { name: 'Provider Dashboard', path: '/provider/dashboard' },
    { name: 'Create Ticket', path: '/provider/tickets/create' },
    { name: 'Manage Tickets', path: '/provider/tickets' }
  ];
  
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.common.white
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Branding */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FlightTakeoffIcon sx={{ mr: 1 }} />
              <Typography
                variant="h6"
                component={RouterLink}
                to="/"
                sx={{
                  fontWeight: 700,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                MyTravel
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Book tickets, find accommodations, and plan your journey on a secure blockchain platform.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="#" color="inherit" aria-label="Facebook">
                <FacebookIcon />
              </Link>
              <Link href="#" color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </Link>
              <Link href="#" color="inherit" aria-label="Instagram">
                <InstagramIcon />
              </Link>
              <Link href="#" color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </Link>
            </Box>
          </Grid>
          
          {/* Company Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Company
            </Typography>
            {companyLinks.map((link) => (
              <Link
                key={link.name}
                component={RouterLink}
                to={link.path}
                color="inherit"
                sx={{ display: 'block', mb: 1 }}
              >
                {link.name}
              </Link>
            ))}
          </Grid>
          
          {/* Customer Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Travelers
            </Typography>
            {customerLinks.map((link) => (
              <Link
                key={link.name}
                component={RouterLink}
                to={link.path}
                color="inherit"
                sx={{ display: 'block', mb: 1 }}
              >
                {link.name}
              </Link>
            ))}
          </Grid>
          
          {/* Provider Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              Service Providers
            </Typography>
            {providerLinks.map((link) => (
              <Link
                key={link.name}
                component={RouterLink}
                to={link.path}
                color="inherit"
                sx={{ display: 'block', mb: 1 }}
              >
                {link.name}
              </Link>
            ))}
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        <Typography variant="body2" align="center">
          © {year} MyTravel. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 