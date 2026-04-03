import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaServer, FaDatabase, FaGlobe } from 'react-icons/fa';

const SystemHealth = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState({
    backend: 'checking',
    database: 'checking',
    frontend: 'checking'
  });
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(prev => ({ ...prev, backend: 'healthy' }));
        setUptime(data.uptime || 0);
      } else {
        setHealth(prev => ({ ...prev, backend: 'unhealthy' }));
      }
    } catch {
      setHealth(prev => ({ ...prev, backend: 'down' }));
    }

    // Check frontend
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        setHealth(prev => ({ ...prev, frontend: 'healthy' }));
      } else {
        setHealth(prev => ({ ...prev, frontend: 'unhealthy' }));
      }
    } catch {
      setHealth(prev => ({ ...prev, frontend: 'down' }));
    }

    // Check database (via backend)
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setHealth(prev => ({ ...prev, database: 'healthy' }));
      } else {
        setHealth(prev => ({ ...prev, database: 'unhealthy' }));
      }
    } catch {
      setHealth(prev => ({ ...prev, database: 'down' }));
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy':
        return <FaCheckCircle className="text-green-500 text-2xl" />;
      case 'unhealthy':
        return <FaExclamationTriangle className="text-yellow-500 text-2xl" />;
      case 'down':
        return <FaTimesCircle className="text-red-500 text-2xl" />;
      default:
        return <div className="animate-pulse w-6 h-6 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'healthy': return 'Operational';
      case 'unhealthy': return 'Degraded';
      case 'down': return 'Down';
      default: return 'Checking...';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">System Health</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaServer className="text-blue-500 text-2xl" />
                  <h3 className="font-semibold">Backend API</h3>
                </div>
                {getStatusIcon(health.backend)}
              </div>
              <p className="text-2xl font-bold">{getStatusText(health.backend)}</p>
              <p className="text-sm text-gray-500 mt-2">Port: 5000</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaDatabase className="text-green-500 text-2xl" />
                  <h3 className="font-semibold">Database</h3>
                </div>
                {getStatusIcon(health.database)}
              </div>
              <p className="text-2xl font-bold">{getStatusText(health.database)}</p>
              <p className="text-sm text-gray-500 mt-2">PostgreSQL</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FaGlobe className="text-purple-500 text-2xl" />
                  <h3 className="font-semibold">Frontend</h3>
                </div>
                {getStatusIcon(health.frontend)}
              </div>
              <p className="text-2xl font-bold">{getStatusText(health.frontend)}</p>
              <p className="text-sm text-gray-500 mt-2">Port: 3000</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Node Version</span>
                <span className="font-mono">v18.17.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">React Version</span>
                <span className="font-mono">18.2.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">PostgreSQL Version</span>
                <span className="font-mono">15</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Backend Uptime</span>
                <span className="font-mono">{formatUptime(uptime)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Browser</span>
                <span className="font-mono">{navigator.userAgent.split(' ').pop()}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ System Information</h3>
            <p className="text-sm text-blue-800">
              This page monitors the health of your WaBiz Pro system. 
              All systems are operational when showing green checkmarks.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemHealth;