import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
console.log('API Base URL:', axios.defaults.baseURL);

// Add request interceptor to set tenant ID on all requests
axios.interceptors.request.use(
  (config) => {
    // Get token and tenant ID from localStorage
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'default';
    
    // Set headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Request with token:', token.substring(0, 15) + '...');
    } else {
      console.log('No auth token available for request');
    }
    
    // Always include tenant ID header - IMPORTANT: Use the exact case expected by the server
    config.headers['x-tenant-id'] = tenantId; // lowercase header name as used in tenantUtils.js
    
    // Log for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Request headers:', JSON.stringify(config.headers));
    console.log('Tenant ID being used:', tenantId);
    
    if (config.data) {
      console.log('Request payload:', JSON.stringify(config.data));
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} for ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - clearing token and redirecting to login');
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle tenant errors
    if (error.response && error.response.status === 400 && 
        error.response.data?.error?.includes('Tenant ID')) {
      console.error('Tenant error:', error.response.data.error);
    }
    
    // Handle service unavailable
    if (error.response && error.response.status === 503) {
      console.error('Service unavailable:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default axios; 