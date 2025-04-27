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
  useTheme,
  Grid,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginPage = () => {
  const theme = useTheme();
  const { setUser, setToken, loading, error, setError, setLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }

    if (error) {
      setError(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.id) {
      errors.id = 'User ID is required';
    } else if (!formData.id.startsWith('customer_') && !formData.id.startsWith('provider_')) {
      errors.id = 'Please enter a valid user ID';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formData.id, password: formData.password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Store auth state
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Role-based redirect
      if (data.user.role === 'provider') {
        navigate('/provider/dashboard');
      } else if (data.user.role === 'customer') {
        navigate('/customer/dashboard');
      } else {
        navigate('/dashboard'); // fallback
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
        color="primary"
      >
        Back to Home
      </Button>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Login to MyTravel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your credentials to access your account
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="User ID"
            name="id"
            type="text"
            autoComplete="username"
            value={formData.id}
            onChange={handleChange}
            error={!!formErrors.id}
            helperText={formErrors.id}
            autoFocus
            placeholder="customer_xxxx or provider_xxxx"
          />

          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={<LoginIcon />}
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" align="center" sx={{ mb: 1 }}>
              Don't have an account yet?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="/register/customer"
                  fullWidth
                  variant="outlined"
                  sx={{ py: 1 }}
                >
                  Register as Customer
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  component={Link}
                  to="/register/provider"
                  fullWidth
                  variant="outlined"
                  sx={{ py: 1 }}
                >
                  Register as Provider
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default LoginPage;
