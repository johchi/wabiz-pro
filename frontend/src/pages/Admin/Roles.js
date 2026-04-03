import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaShieldAlt, FaUserCheck, FaUserTimes, FaSync } from 'react-icons/fa';

const AdminRoles = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
      alert(`Role updated to ${newRole}`);
    } catch (error) {
      alert('Failed to update role: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length
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
              <p className="mt-4 text-gray-600">Loading roles...</p>
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
            <h1 className="text-3xl font-bold text-gray-800">Roles & Permissions</h1>
            <button 
              onClick={fetchUsers}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FaShieldAlt className="text-blue-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Administrators</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                </div>
                <FaUserCheck className="text-purple-500 text-3xl" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Regular Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.users}</p>
                </div>
                <FaUserTimes className="text-green-500 text-3xl" />
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">Role Permissions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm">View Dashboard</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Make Payments</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Manage Subscriptions</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">View Invoices</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Send WhatsApp Messages</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-6 py-4 text-sm font-medium">Manage Users</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-red-600">✗</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-6 py-4 text-sm font-medium">Change User Roles</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-red-600">✗</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-6 py-4 text-sm font-medium">Delete Users</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-red-600">✗</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-6 py-4 text-sm font-medium">View System Health</td>
                    <td className="px-6 py-4 text-center text-green-600">✓</td>
                    <td className="px-6 py-4 text-center text-red-600">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Users List for Role Management */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">Manage User Roles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={u.id === user?.id}
                        >
                          <option value="user">Regular User</option>
                          <option value="admin">Administrator</option>
                        </select>
                        {u.id === user?.id && (
                          <span className="text-xs text-gray-400 ml-2">(You)</span>
                        )}
                      </td>
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

export default AdminRoles;