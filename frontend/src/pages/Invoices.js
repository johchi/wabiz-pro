import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaFileInvoice, FaDownload, FaEye, FaCheckCircle, 
  FaClock, FaTimesCircle, FaSearch, FaSync, FaMoneyBillWave
} from 'react-icons/fa';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/invoices');
      console.log('Fetched invoices:', response.data);
      setInvoices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><FaCheckCircle className="inline mr-1" /> Paid</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800"><FaClock className="inline mr-1" /> Pending</span>;
      case 'overdue':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><FaTimesCircle className="inline mr-1" /> Overdue</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = (invoice) => {
    const html = `
      <html>
        <head><title>Invoice ${invoice.invoice_number}</title></head>
        <body>
          <h1>WaBiz Pro - Invoice</h1>
          <p>Invoice #: ${invoice.invoice_number}</p>
          <p>Date: ${formatDate(invoice.created_at)}</p>
          <p>Amount: $${invoice.amount}</p>
          <p>Status: ${invoice.status}</p>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Invoices</h1>
            <button onClick={fetchInvoices} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <FaSync /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow text-center">
              <p className="text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <p className="text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <p className="text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <p className="text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <p className="text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">${stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded shadow mb-6 flex gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-3 py-2 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Loading invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FaFileInvoice className="text-gray-300 text-5xl mx-auto mb-4" />
                <p className="text-gray-500">No invoices found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(inv.created_at)}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(inv.due_date)}</td>
                      <td className="px-6 py-4 text-sm font-semibold">${parseFloat(inv.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-3">
                          <button onClick={() => handleDownload(inv)} className="text-blue-600 hover:text-blue-800">
                            <FaDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Invoices;