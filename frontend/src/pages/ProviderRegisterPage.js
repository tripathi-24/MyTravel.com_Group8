import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const steps = ['Business Information', 'Service Details', 'Security'];

const serviceTypes = [
  'Hotel',
  'Transportation',
  'Tour Guide',
  'Restaurant',
  'Activity',
  'Other'
];

// Map frontend service type to backend transportMode (hardcoded to "land" as per backend)
const transportModeMap = {
  'Hotel': 'land',
  'Transportation': 'land',
  'Tour Guide': 'land',
  'Restaurant': 'land',
  'Activity': 'land',
  'Other': 'land',
};

const ProviderRegisterPage = () => {
  const { registerProvider, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userId, setUserId] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    serviceType: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (error) clearError();
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 0) {
      if (!formData.businessName) errors.businessName = 'Business name is required';
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email address';
      }
      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        errors.phone = 'Enter a valid 10-digit phone number';
      }
    } else if (step === 1) {
      if (!formData.serviceType) errors.serviceType = 'Service type is required';
    } else if (step === 2) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;

    const payload = {
      name: formData.businessName,
      email: formData.email,
      phone: formData.phone,
      transportMode: transportModeMap[formData.serviceType] || 'land',
      businessName: formData.businessName,
      serviceType: formData.serviceType,
      password: formData.password,
    };

    const result = await registerProvider(payload);

    if (result.success) {
      setUserId(result.userId);
      setRegistrationComplete(true);
    }
  };

  const copyToClipboard = () => navigator.clipboard.writeText(userId);

  const goToLogin = () => navigate('/login');

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (registrationComplete) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>Registration Successful!</Typography>
            <Typography variant="body1" color="text.secondary">
              Your account has been created. Please save your User ID.
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Your User ID</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>{userId}</Typography>
            </CardContent>
            <CardActions>
              <Button startIcon={<ContentCopyIcon />} onClick={copyToClipboard} size="small">Copy</Button>
            </CardActions>
          </Card>

          <Typography variant="body2" color="error" sx={{ mb: 3 }}>
            IMPORTANT: Save this ID for login.
          </Typography>

          <Button variant="contained" color="primary" fullWidth onClick={goToLogin}>
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Button component={Link} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to Home
      </Button>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Register as Service Provider</Typography>
          <Typography variant="body1" color="text.secondary">
            Join MyTravel to offer your services
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Business Name" name="businessName" value={formData.businessName} onChange={handleChange} error={!!formErrors.businessName} helperText={formErrors.businessName} autoFocus />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} error={!!formErrors.email} helperText={formErrors.email} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} error={!!formErrors.phone} helperText={formErrors.phone} />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.serviceType}>
                  <InputLabel id="service-type-label">Service Type</InputLabel>
                  <Select labelId="service-type-label" name="serviceType" value={formData.serviceType} onChange={handleChange} label="Service Type">
                    {serviceTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.serviceType && <FormHelperText>{formErrors.serviceType}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} error={!!formErrors.password} helperText={formErrors.password || "Minimum 8 characters"} InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} error={!!formErrors.confirmPassword} helperText={formErrors.confirmPassword} InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }} />
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {activeStep === steps.length - 1 ? (loading ? <CircularProgress size={24} /> : <BusinessIcon />) : 'Next'}
            </Button>
          </Box>
        </form>

        <Divider sx={{ my: 3 }}><Typography variant="body2" color="text.secondary">OR</Typography></Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">Already have an account?</Typography>
          <Button component={Link} to="/login" variant="outlined" sx={{ mt: 1 }}>
            Login Instead
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProviderRegisterPage;
