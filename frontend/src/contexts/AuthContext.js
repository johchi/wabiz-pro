import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchUser();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success(`Welcome to WaBiz Pro, ${user.name}!`);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    refreshUser: fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};