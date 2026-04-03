import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaFilePdf, FaFileExcel, FaDownload, FaCalendarAlt, 
  FaChartBar, FaMoneyBillWave, FaUsers 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('payments');
  const [dateRange, setDateRange] = useState('month');
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { id: 'payments', name: 'Payment Report', icon: FaMoneyBillWave, color: 'bg-green-500' },
    { id: 'subscriptions', name: 'Subscription Report', icon: FaChartBar, color: 'bg-blue-500' },
    { id: 'users', name: 'User Report', icon: FaUsers, color: 'bg-purple-500' }
  ];

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Mock data for reports
      const mockData = {
        payments: [
          { Date: '2024-03-01', Amount: 99.99, Method: 'Credit Card', Status: 'Completed' },
          { Date: '2024-03-05', Amount: 49.99, Method: 'PayPal', Status: 'Completed' },
          { Date: '2024-03-10', Amount: 199.99, Method: 'Bank Transfer', Status: 'Pending' }
        ],
        subscriptions: [
          { User: 'John Doe', Plan: 'Pro', StartDate: '2024-01-01', EndDate: '2024-12-31', Status: 'Active' },
          { User: 'Jane Smith', Plan: 'Basic', StartDate: '2024-02-01', EndDate: '2024-08-31', Status: 'Active' }
        ],
        users: [
          { Name: 'John Doe', Email: 'john@example.com', Joined: '2024-01-01', Status: 'Active' },
          { Name: 'Jane Smith', Email: 'jane@example.com', Joined: '2024-02-01', Status: 'Active' }
        ]
      };

      const data = mockData[reportType];
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportType.toUpperCase());
      
      // Generate Excel file
      XLSX.writeFile(wb, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports & Exports</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Options */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
                
                <div className="space-y-6">
                  {/* Report Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Report Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {reportTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setReportType(type.id)}
                          className={`p-4 border rounded-lg text-center transition ${
                            reportType === type.id
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <type.icon className={`text-2xl mx-auto mb-2 ${type.color.replace('bg-', 'text-')}`} />
                          <p className="font-medium">{type.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                      <option value="quarter">Last 3 months</option>
                      <option value="year">Last 12 months</option>
                      <option value="all">All time</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={generateReport}
                    disabled={generating}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FaDownload />
                        <span>Generate {reportTypes.find(t => t.id === reportType)?.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Report Options</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Excel format (.xlsx)</li>
                  <li>✓ Filter by date range</li>
                  <li>✓ Export payment history</li>
                  <li>✓ Subscription analytics</li>
                  <li>✓ User activity logs</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reports Generated</span>
                    <span className="font-semibold">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Export</span>
                    <span className="font-semibold">Today</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most Exported</span>
                    <span className="font-semibold">Payment Report</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;