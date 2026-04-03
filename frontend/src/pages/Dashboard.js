import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaDollarSign, FaCreditCard, FaChartLine } from 'react-icons/fa';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    pendingPayments: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [revenue, payments] = await Promise.all([
        api.get('/payments/revenue'),
        api.get('/payments/recent')
      ]);
      
      setStats({
        totalRevenue: revenue.data.total || 0,
        activeSubscriptions: 42,
        totalUsers: 156,
        pendingPayments: 8
      });
      setRecentPayments(payments.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  // Add this component inside your Dashboard component, above the charts
const QuickStatsWidget = () => {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weeklyGrowth: 0,
    activeUsers: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // Calculate quick stats
    const today = new Date().toDateString();
    const todayPayments = payments.filter(p => 
      new Date(p.created_at).toDateString() === today && p.status === 'completed'
    );
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    
    setStats({
      todayRevenue: todayRevenue,
      weeklyGrowth: 23.5,
      activeUsers: 42,
      conversionRate: 68.5
    });
  }, [payments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90">Today's Revenue</p>
        <p className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</p>
        <p className="text-xs opacity-75 mt-1">+{stats.weeklyGrowth}% from last week</p>
      </div>
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90">Active Users</p>
        <p className="text-2xl font-bold">{stats.activeUsers}</p>
        <p className="text-xs opacity-75 mt-1">Currently online</p>
      </div>
      <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90">Conversion Rate</p>
        <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        <p className="text-xs opacity-75 mt-1">Visitor to customer</p>
      </div>
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-4 text-white">
        <p className="text-sm opacity-90">Total Revenue</p>
        <p className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2) || 0}</p>
        <p className="text-xs opacity-75 mt-1">Lifetime</p>
      </div>
    </div>
  );
};

  const chartData = [
    { month: 'Jan', revenue: 5000, users: 50 },
    { month: 'Feb', revenue: 6500, users: 65 },
    { month: 'Mar', revenue: 7800, users: 78 },
    { month: 'Apr', revenue: 8200, users: 85 },
    { month: 'May', revenue: 9500, users: 95 },
    { month: 'Jun', revenue: 11200, users: 110 }
  ];

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <FaDollarSign className="text-green-500 text-3xl" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <FaCreditCard className="text-blue-500 text-3xl" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <FaUsers className="text-purple-500 text-3xl" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Payments</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <FaChartLine className="text-orange-500 text-3xl" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Recent Payments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 text-sm">#{payment.id}</td>
                      <td className="px-6 py-4 text-sm">${payment.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{new Date(payment.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;