import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaPaperPlane, FaWhatsapp, FaHistory, FaCopy, FaTrash, FaBroadcastTower } from 'react-icons/fa';

const WhatsApp = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [broadcastNumbers, setBroadcastNumbers] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchHistory();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/whatsapp/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/whatsapp/history');
      setMessageHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (broadcastMode) {
      const numbers = broadcastNumbers.split(',').map(n => n.trim());
      if (numbers.length === 0) {
        alert('Please enter at least one phone number');
        return;
      }
      if (!message) {
        alert('Please enter a message');
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.post('/whatsapp/broadcast', {
          numbers: numbers,
          message: message
        });
        
        alert(`Broadcast sent to ${response.data.results.filter(r => r.success).length} numbers`);
        setBroadcastNumbers('');
        setMessage('');
        fetchHistory();
      } catch (error) {
        console.error('Broadcast failed:', error);
        alert('Broadcast failed: ' + (error.response?.data?.error || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    } else {
      if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
      }
      if (!message) {
        alert('Please enter a message');
        return;
      }

      setLoading(true);
      try {
        const response = await api.post('/whatsapp/send', {
          to: phoneNumber,
          message: message,
          template: selectedTemplate?.name
        });
        
        alert(`Message sent! (${response.data.mode === 'live' ? 'Live WhatsApp' : 'Test Mode'})`);
        setMessage('');
        setPhoneNumber('');
        setSelectedTemplate(null);
        fetchHistory();
      } catch (error) {
        console.error('Failed to send message:', error);
        alert('Failed to send message: ' + (error.response?.data?.error || 'Please try again'));
      } finally {
        setLoading(false);
      }
    }
  };

  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    let templateMessage = template.message;
    
    // Replace placeholders with sample data
    templateMessage = templateMessage
      .replace('{{amount}}', '99.99')
      .replace('{{date}}', new Date().toLocaleDateString())
      .replace('{{name}}', user?.name || 'Customer')
      .replace('{{plan}}', 'Pro Plan')
      .replace('{{invoice_number}}', 'INV-001')
      .replace('{{due_date}}', new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString())
      .replace('{{transaction_id}}', 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase())
      .replace('{{location}}', 'New Device, Chrome Browser')
      .replace('{{time}}', new Date().toLocaleString())
      .replace('{{payment_link}}', 'https://wabiz.com/pay');
    
    setMessage(templateMessage);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">WhatsApp Integration</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => setBroadcastMode(!broadcastMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  broadcastMode ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                <FaBroadcastTower />
                <span>{broadcastMode ? 'Single Message' : 'Broadcast Mode'}</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <FaHistory />
                <span>{showHistory ? 'Send Message' : 'View History'}</span>
              </button>
            </div>
          </div>

          {!showHistory ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Send Message Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FaWhatsapp className="text-green-500 text-2xl" />
                    <h2 className="text-xl font-semibold">
                      {broadcastMode ? 'Broadcast Message' : 'Send WhatsApp Message'}
                    </h2>
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    {!broadcastMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (with country code)
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1234567890"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={!broadcastMode}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: +1 for US, +44 for UK, +91 for India
                        </p>
                      </div>
                    )}
                    
                    {broadcastMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Numbers (comma-separated)
                        </label>
                        <textarea
                          value={broadcastNumbers}
                          onChange={(e) => setBroadcastNumbers(e.target.value)}
                          placeholder="+1234567890, +1987654321, +441234567890"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={broadcastMode}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate multiple numbers with commas
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Type your message here..."
                        required
                      />
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {message.length} characters
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(message)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          <FaCopy className="inline mr-1" /> Copy
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        'Sending...'
                      ) : (
                        <>
                          <FaPaperPlane />
                          <span>{broadcastMode ? `Broadcast to ${broadcastNumbers.split(',').filter(n => n.trim()).length || 0} numbers` : 'Send Message'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Message Templates */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Message Templates</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-sm">{template.name}</p>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.message.substring(0, 80)}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 rounded-lg shadow-md p-6 mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-900">Quick Tips</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>✓ Include country code in phone number</li>
                    <li>✓ Keep messages concise and clear</li>
                    <li>✓ Use templates for common messages</li>
                    <li>✓ Personalize with customer names</li>
                    <li>✓ Include call-to-action when needed</li>
                    <li>✓ Test with your own number first</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Message History
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Message History</h2>
              {messageHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FaWhatsapp className="text-gray-300 text-5xl mx-auto mb-4" />
                  <p className="text-gray-500">No messages sent yet</p>
                  <p className="text-sm text-gray-400">Send your first WhatsApp message to see history here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messageHistory.map((msg, idx) => (
                    <div key={idx} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">
                            {msg.to ? `To: ${msg.to}` : msg.from ? `From: ${msg.from}` : 'Message'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {msg.template && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {msg.template}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {msg.status || 'sent'}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                      {msg.reply && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500 font-semibold">Auto-reply:</p>
                          <p className="text-sm text-gray-600">{msg.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WhatsApp;