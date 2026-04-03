import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { 
  FaUsers, FaDollarSign, FaFileInvoice, FaCreditCard, 
  FaCalendarAlt, FaChartLine, FaSync, FaEye, FaDownload 
} from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    activeSubscriptions: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all users
      const usersRes = await api.get('/admin/users');
      const users = usersRes.data || [];
      
      // Get all invoices (admin endpoint needed)
      let invoices = [];
      try {
        const invoicesRes = await api.get('/admin/invoices');
        invoices = invoicesRes.data || [];
      } catch (e) {
        console.log('Admin invoices endpoint not yet, using mock');
        invoices = [
          { id: 1, invoice_number: 'INV-001', amount: 99.99, status: 'paid', user_id: 1, created_at: new Date() },
          { id: 2, invoice_number: 'INV-002', amount: 49.99, status: 'pending', user_id: 2, created_at: new Date() },
          { id: 3, invoice_number: 'INV-003', amount: 199.99, status: 'overdue', user_id: 1, created_at: new Date() }
        ];
      }
      
      // Get revenue
      let totalRevenue = 0;
      try {
        const revenueRes = await api.get('/admin/revenue');
        totalRevenue = revenueRes.data?.total || 0;
      } catch (e) {
        totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
      }
      
      setStats({
        totalUsers: users.length,
        totalRevenue: totalRevenue,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        activeSubscriptions: 42
      });
      
      setRecentUsers(users.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { month: 'Jan', revenue: 5000, users: 45, invoices: 12 },
    { month: 'Feb', revenue: 6500, users: 52, invoices: 15 },
    { month: 'Mar', revenue: 7800, users: 61, invoices: 18 },
    { month: 'Apr', revenue: 8200, users: 68, invoices: 22 },
    { month: 'May', revenue: 9500, users: 75, invoices: 25 },
    { month: 'Jun', revenue: 11200, users: 84, invoices: 30 }
  ];

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button 
              onClick={fetchAdminData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FaSync /> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <FaUsers className="text-blue-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <FaDollarSign className="text-green-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FaFileInvoice className="text-purple-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Invoices</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</p>
                </div>
                <FaCreditCard className="text-yellow-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Subs</p>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <FaCalendarAlt className="text-orange-500 text-3xl" />
              </div>
            </div>
          </div>

          {/* Charts */}
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
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($)" />
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
                  <Bar dataKey="users" fill="#10B981" name="Users" />
                  <Bar dataKey="invoices" fill="#F59E0B" name="Invoices" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <button className="text-blue-600 text-sm hover:text-blue-800">View All →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">User #{inv.user_id}</td>
                      <td className="px-6 py-4 text-sm font-semibold">${inv.amount}</td>
                      <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                          <button className="text-green-600 hover:text-green-800"><FaDownload /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Users</h3>
              <button className="text-blue-600 text-sm hover:text-blue-800">View All →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{u.id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;