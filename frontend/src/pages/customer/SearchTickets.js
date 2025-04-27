import React, { useState } from 'react';
import { 
  Container, Typography, Paper, Grid, TextField, 
  MenuItem, Button, Box, Card, CardContent, 
  CardActions, Divider, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { commonService } from '../../services/api';

const SearchTickets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    serviceType: '',
    minPrice: '',
    maxPrice: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const serviceTypes = ['Hotel', 'Transportation', 'Tour Guide', 'Restaurant', 'Activity', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    
    try {
      // Convert price strings to numbers if present
      const params = { ...searchParams };
      if (params.minPrice) params.minPrice = parseFloat(params.minPrice);
      if (params.maxPrice) params.maxPrice = parseFloat(params.maxPrice);
      
      const response = await commonService.searchServices(params);
      setResults(response.data.services || []);
    } catch (error) {
      console.error('Error searching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (serviceId) => {
    navigate(`/customer/tickets/${serviceId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search Travel Services
      </Typography>
      
      <Paper component="form" onSubmit={handleSearch} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Keyword"
              name="keyword"
              value={searchParams.keyword}
              onChange={handleInputChange}
              placeholder="Search by name, description, or location"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Service Type"
              name="serviceType"
              value={searchParams.serviceType}
              onChange={handleInputChange}
              variant="outlined"
            >
              <MenuItem value="">Any Type</MenuItem>
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Min Price"
              name="minPrice"
              type="number"
              value={searchParams.minPrice}
              onChange={handleInputChange}
              variant="outlined"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Price"
              name="maxPrice"
              type="number"
              value={searchParams.maxPrice}
              onChange={handleInputChange}
              variant="outlined"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              fullWidth
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {searched && (
            <Typography variant="h6" gutterBottom>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Typography>
          )}
          
          <Grid container spacing={3}>
            {results.map((service) => (
              <Grid item xs={12} md={6} lg={4} key={service.serviceId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {service.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {service.description ? 
                        service.description.length > 100 
                          ? service.description.substring(0, 100) + '...' 
                          : service.description 
                        : 'No description available'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body1" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      ${service.price}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Provider: {service.provider.businessName}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Type: {service.category}
                    </Typography>
                    
                    {service.provider.ratings && (
                      <Typography variant="body2" color="text.secondary">
                        Rating: {service.provider.ratings.average} ({service.provider.ratings.count} reviews)
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleViewDetails(service.serviceId)}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {searched && results.length === 0 && (
            <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
              <Typography variant="body1">
                No services found matching your criteria. Try adjusting your search parameters.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default SearchTickets; 