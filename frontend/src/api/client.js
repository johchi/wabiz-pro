import axios from 'axios';
import toast from 'react-hot-toast';

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      toast.error('Cannot connect to server. Please check your internet connection.');
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      toast.error('Session expired. Please login again.');
      setTimeout(() => window.location.href = '/login', 1500);
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(error.response?.data?.error || 'An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

export default api;