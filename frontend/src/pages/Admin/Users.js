import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaTrash, FaSync, FaShieldAlt, FaUserCog } from 'react-icons/fa';

const AdminUsers = () => {
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
      console.log('Fetching users from /admin/users');
      console.log('Current user token exists:', !!localStorage.getItem('token'));
      
      const response = await api.get('/admin/users');
      console.log('Users response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
        console.warn('Response data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 403) {
        setError('Admin access required. You need admin privileges to view this page.');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure backend is running on port 5000');
      } else {
        setError(error.response?.data?.error || 'Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      await fetchUsers();
      alert('User role updated successfully');
    } catch (error) {
      console.error('Update role error:', error);
      alert('Failed to update role: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        await fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete user: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
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
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <div className="text-red-600 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <button 
                    onClick={fetchUsers}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 w-full"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
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
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
              <p className="text-gray-500 mt-1">Total users: {users.length}</p>
            </div>
            <button 
              onClick={fetchUsers}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FaSync /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <FaUserCog className="text-gray-300 text-5xl mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{u.id}</td>
                        <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                        <td className="px-6 py-4 text-sm">{u.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${u.id === user?.id ? 'bg-gray-100' : ''}`}
                            disabled={u.id === user?.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          {u.id === user?.id && (
                            <span className="text-xs text-gray-400 ml-2">(You)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteUser(u.id, u.name)}
                            disabled={u.id === user?.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={u.id === user?.id ? "Cannot delete yourself" : "Delete user"}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Debug info - remove in production */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-500">
            <details>
              <summary>Debug Info (Click to expand)</summary>
              <pre className="mt-2">
                {JSON.stringify({ 
                  userRole: user?.role,
                  isAdmin: user?.role === 'admin',
                  usersCount: users.length,
                  apiUrl: process.env.REACT_APP_API_URL
                }, null, 2)}
              </pre>
            </details>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUsers;