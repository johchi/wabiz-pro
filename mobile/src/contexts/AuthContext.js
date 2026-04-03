import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem('@Wabiz:token');
      const userData = await AsyncStorage.getItem('@Wabiz:user');
      
      if (token && userData) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      const { user, token } = response.data;
      
      await AsyncStorage.setItem('@Wabiz:token', token);
      await AsyncStorage.setItem('@Wabiz:user', JSON.stringify(user));
      
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(user);
      
      return true;
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      const { user, token } = response.data;
      
      await AsyncStorage.setItem('@Wabiz:token', token);
      await AsyncStorage.setItem('@Wabiz:user', JSON.stringify(user));
      
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(user);
      
      return true;
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@Wabiz:token');
    await AsyncStorage.removeItem('@Wabiz:user');
    delete api.defaults.headers.Authorization;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};