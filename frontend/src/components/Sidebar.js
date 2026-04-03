import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaCreditCard, 
  FaCalendarAlt, 
  FaCog, 
  FaWhatsapp, 
  FaChartLine,
  FaFileInvoice,
  FaUsers,
  FaUserShield
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  // Menu items for regular users
  const userMenuItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/payments', icon: FaCreditCard, label: 'Payments' },
    { path: '/subscriptions', icon: FaCalendarAlt, label: 'Subscriptions' },
    { path: '/invoices', icon: FaFileInvoice, label: 'Invoices' },
    { path: '/whatsapp', icon: FaWhatsapp, label: 'WhatsApp' },
    { path: '/analytics', icon: FaChartLine, label: 'Analytics' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ];
  // Admin only menu items
  const adminMenuItems = [
    { path: '/admin/users', icon: FaUsers, label: 'Manage Users' },
    { path: '/admin/roles', icon: FaUserShield, label: 'Roles & Permissions' }
  ];

  const menuItems = isAdmin() ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">WaBiz Pro</h1>
        <p className="text-xs text-gray-400 mt-1">
          {isAdmin() ? 'Administrator' : 'User'} Access
        </p>
      </div>
      
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition ${
                isActive ? 'bg-gray-800 text-white border-r-4 border-blue-500' : ''
              }`
            }
          >
            <item.icon className="mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          <p>Logged in as:</p>
          <p className="font-medium text-gray-400">{user?.name}</p>
          <p className="text-xs mt-1 capitalize">Role: {user?.role}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;