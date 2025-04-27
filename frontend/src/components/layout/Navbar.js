import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListIcon from '@mui/icons-material/List';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleUserMenuClose();
    setDrawerOpen(false);
  };
  
  // Menu items based on user role
  const getNavItems = () => {
    if (!user) {
      return [
        { text: 'Home', path: '/' },
        { text: 'Login', path: '/login' },
        { text: 'Register as Customer', path: '/register/customer' },
        { text: 'Register as Provider', path: '/register/provider' }
      ];
    }
    
    const commonItems = [
      { text: 'Home', path: '/' },
      { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
      { text: 'Profile', path: '/profile', icon: <PersonIcon /> }
    ];
    
    if (user.role === 'customer') {
      return [
        ...commonItems,
        { text: 'Search Tickets', path: '/customer/search', icon: <SearchIcon /> },
        { text: 'My Bookings', path: '/customer/bookings', icon: <BookIcon /> }
      ];
    } else if (user.role === 'provider') {
      return [
        ...commonItems,
        { text: 'Create Ticket', path: '/provider/tickets/create', icon: <AddCircleIcon /> },
        { text: 'Manage Tickets', path: '/provider/tickets', icon: <ListIcon /> }
      ];
    }
    
    return commonItems;
  };
  
  const navItems = getNavItems();
  
  const drawer = (
    <Box onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigate(item.path)}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        {user && (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Box>
  );
  
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo & Branding */}
          <FlightTakeoffIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            MyTravel
          </Typography>
  
          {/* Mobile Menu Icon */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
  
          {/* Mobile Logo */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            MyTravel
          </Typography>
  
          {/* Desktop Nav Links */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              {navItems.slice(0, 4).map((item) => (
                <Button
                  key={item.text}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
  
          {/* User Menu Section */}
          {user ? (
            <Box sx={{ flexGrow: 0 }}>
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ p: 0 }}
                aria-label="user account"
                aria-controls="user-menu"
                aria-haspopup="true"
              >
                <Avatar alt={user.name}>
                  {user.role === 'customer' 
                    ? user.name?.charAt(0) || 'C'
                    : user.name?.charAt(0) || 'P'}
                </Avatar>
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={userMenuAnchor}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
                <MenuItem onClick={() => handleNavigate('/profile')}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/dashboard')}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  Dashboard
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            !isMobile && (
              <Button 
                color="inherit" 
                startIcon={<AccountCircleIcon />}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )
          )}
        </Toolbar>
      </Container>
  
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;