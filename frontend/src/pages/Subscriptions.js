import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planName, setPlanName] = useState('Pro Plan');
  const [duration, setDuration] = useState(12);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const [allSubs, active] = await Promise.all([
        api.get('/subscriptions/my-subscriptions'),
        api.get('/subscriptions/active')
      ]);
      setSubscriptions(allSubs.data);
      setActiveSubscription(active.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/create', { planName, durationMonths: duration });
      await fetchSubscriptions();
      setShowCreateForm(false);
      alert('Subscription created successfully!');
    } catch (error) {
      console.error('Failed to create subscription:', error);
      alert('Failed to create subscription');
    }
  };

  const cancelSubscription = async (id) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await api.post(`/subscriptions/cancel/${id}`);
        await fetchSubscriptions();
        alert('Subscription cancelled');
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
        alert('Failed to cancel subscription');
      }
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Subscriptions</h1>
            {!activeSubscription && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                + New Subscription
              </button>
            )}
          </div>

          {activeSubscription && (
            <div className="card mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="text-xl font-semibold mb-2">Active Subscription</h2>
              <p className="text-3xl font-bold mb-2">{activeSubscription.plan_name}</p>
              <p className="mb-2">
                Expires: {new Date(activeSubscription.end_date).toLocaleDateString()}
              </p>
              <p className="mb-4">
                {getDaysRemaining(activeSubscription.end_date)} days remaining
              </p>
              <button
                onClick={() => cancelSubscription(activeSubscription.id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Create New Subscription</h2>
              <form onSubmit={createSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Name
                  </label>
                  <select
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option>Basic Plan</option>
                    <option>Pro Plan</option>
                    <option>Enterprise Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (months)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={1}>1 month</option>
                    <option value={3}>3 months</option>
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary">
                    Create Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {subscriptions.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Subscription History</h2>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{sub.plan_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        sub.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && <p>Loading subscriptions...</p>}
          {!loading && subscriptions.length === 0 && !activeSubscription && (
            <div className="card text-center">
              <p className="text-gray-500">No subscriptions yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Start a Subscription
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Subscriptions;