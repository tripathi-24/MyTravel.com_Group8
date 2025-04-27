import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Card,
  CardContent,
  InputAdornment,
  Collapse
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LogoutIcon from '@mui/icons-material/Logout';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const ProfilePage = () => {
  const { user, loading, error, updateProfile, changePassword, logout, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  
  useEffect(() => {
    // Initialize form data with user information when component mounts or user changes
    if (user) {
      const initialData = { ...user };
      delete initialData.token; // Remove token from form data
      setFormData(initialData);
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    
    // Reset success message when user starts editing
    setUpdateSuccess(false);
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    // Clear field-specific error when user types
    if (passwordErrors[name]) {
      setPasswordErrors({ ...passwordErrors, [name]: '' });
    }
    
    // Reset success message when user starts editing
    setPasswordSuccess(false);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (user.role === 'customer') {
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
      }
      
      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
      }
      
      if (!formData.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
      }
    } else if (user.role === 'provider') {
      if (!formData.businessName) {
        errors.businessName = 'Business name is required';
      }
      
      if (!formData.contactPerson) {
        errors.contactPerson = 'Contact person is required';
      }
      
      if (!formData.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
      }
      
      if (!formData.serviceType) {
        errors.serviceType = 'Service type is required';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      const originalData = { ...user };
      delete originalData.token;
      setFormData(originalData);
    }
    
    setIsEditing(false);
    setFormErrors({});
    setUpdateSuccess(false);
  };
  
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field]
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setIsEditing(false);
      setUpdateSuccess(true);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setPasswordLoading(true);
    clearError();
    
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result.success) {
        setPasswordSuccess(true);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Password change error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const togglePasswordSection = () => {
    setShowPasswordSection(!showPasswordSection);
    
    // Reset password form when closing
    if (showPasswordSection) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setPasswordSuccess(false);
    }
  };
  
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
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
  
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', mr: 3 }}
            >
              {user.role === 'customer' 
                ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` 
                : user.businessName?.charAt(0) || ''}
            </Avatar>
            
            <Box>
              <Typography variant="h4" component="h1">
                {user.role === 'customer' 
                  ? `${user.firstName || ''} ${user.lastName || ''}` 
                  : user.businessName || ''}
              </Typography>
              <Chip 
                label={user.role === 'customer' ? 'Customer' : 'Service Provider'} 
                color={user.role === 'customer' ? 'primary' : 'secondary'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          
          <Box>
            {!isEditing ? (
              <IconButton 
                color="primary" 
                onClick={handleEdit}
                aria-label="edit profile"
              >
                <EditIcon />
              </IconButton>
            ) : (
              <>
                <IconButton 
                  color="error" 
                  onClick={handleCancel}
                  aria-label="cancel editing"
                  sx={{ mr: 1 }}
                >
                  <CancelIcon />
                </IconButton>
                <IconButton 
                  color="primary" 
                  type="submit"
                  form="profile-form"
                  aria-label="save profile"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : <SaveIcon />}
                </IconButton>
              </>
            )}
            
            <IconButton 
              color="default" 
              onClick={handleLogout}
              aria-label="logout"
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
        
        <form id="profile-form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={!isEditing}
              />
            </Grid>
            
            {user.role === 'customer' ? (
              // Customer-specific fields
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                    error={!!formErrors.phoneNumber}
                    helperText={formErrors.phoneNumber}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    disabled={!isEditing}
                    multiline
                    rows={2}
                  />
                </Grid>
              </>
            ) : (
              // Provider-specific fields
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                    error={!!formErrors.phoneNumber}
                    helperText={formErrors.phoneNumber}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Business Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleChange}
                    error={!!formErrors.businessName}
                    helperText={formErrors.businessName}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contact Person"
                    name="contactPerson"
                    value={formData.contactPerson || ''}
                    onChange={handleChange}
                    error={!!formErrors.contactPerson}
                    helperText={formErrors.contactPerson}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Address"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                    disabled={!isEditing}
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Service Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Service Type"
                    name="serviceType"
                    value={formData.serviceType || ''}
                    onChange={handleChange}
                    error={!!formErrors.serviceType}
                    helperText={formErrors.serviceType}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="License/Registration Number"
                    name="licenseNumber"
                    value={formData.licenseNumber || ''}
                    onChange={handleChange}
                    error={!!formErrors.licenseNumber}
                    helperText={formErrors.licenseNumber}
                    disabled={!isEditing}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Service Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    disabled={!isEditing}
                    multiline
                    rows={3}
                  />
                </Grid>
              </>
            )}
          </Grid>
          
          {isEditing && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={handleCancel}
                sx={{ mr: 2 }}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </form>
        
        {/* Password Change Section */}
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={showPasswordSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            endIcon={<KeyIcon />}
            onClick={togglePasswordSection}
            sx={{ mb: 2 }}
          >
            {showPasswordSection ? 'Hide Password Change' : 'Change Password'}
          </Button>
          
          <Collapse in={showPasswordSection}>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                
                {passwordSuccess && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Password changed successfully!
                  </Alert>
                )}
                
                <form id="password-form" onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="currentPassword"
                        type={passwordVisibility.currentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordErrors.currentPassword}
                        helperText={passwordErrors.currentPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle current password visibility"
                                onClick={() => togglePasswordVisibility('currentPassword')}
                                edge="end"
                              >
                                {passwordVisibility.currentPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="newPassword"
                        type={passwordVisibility.newPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordErrors.newPassword}
                        helperText={passwordErrors.newPassword || "Password must be at least 8 characters"}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle new password visibility"
                                onClick={() => togglePasswordVisibility('newPassword')}
                                edge="end"
                              >
                                {passwordVisibility.newPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        error={!!passwordErrors.confirmPassword}
                        helperText={passwordErrors.confirmPassword}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                edge="end"
                              >
                                {passwordVisibility.confirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={passwordLoading}
                      startIcon={passwordLoading ? <CircularProgress size={24} /> : <KeyIcon />}
                    >
                      Update Password
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;