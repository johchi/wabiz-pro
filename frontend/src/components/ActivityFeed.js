import React, { useState, useEffect } from 'react';
import { FaBell, FaCreditCard, FaUserPlus, FaCalendarCheck } from 'react-icons/fa';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Mock activity data
    const mockActivities = [
      { id: 1, type: 'payment', message: 'Payment of $99.99 received', time: '2 minutes ago', icon: FaCreditCard, color: 'text-green-500' },
      { id: 2, type: 'subscription', message: 'New subscription created - Pro Plan', time: '1 hour ago', icon: FaCalendarCheck, color: 'text-blue-500' },
      { id: 3, type: 'user', message: 'New user registered: John Doe', time: '3 hours ago', icon: FaUserPlus, color: 'text-purple-500' },
      { id: 4, type: 'payment', message: 'Payment of $49.99 pending', time: '5 hours ago', icon: FaCreditCard, color: 'text-yellow-500' },
    ];
    setActivities(mockActivities);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FaBell className="text-gray-500" />
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <activity.icon className={`${activity.color} mt-1`} />
            <div className="flex-1">
              <p className="text-sm text-gray-700">{activity.message}</p>
              <p className="text-xs text-gray-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;