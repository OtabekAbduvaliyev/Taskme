import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboardOverview from './Sections/AdminDashboardOverview';
import AdminAnalytics from './Sections/AdminAnalytics';
import AdminUsers from './Sections/AdminUsers';
import AdminCompanies from './Sections/AdminCompanies';
import AdminSubscriptions from './Sections/AdminSubscriptions';
import AdminSystem from './Sections/AdminSystem';
import { MdDashboard, MdBarChart, MdPeople, MdBusiness, MdSubscriptions, MdSettings } from 'react-icons/md';
import { FaRegListAlt } from 'react-icons/fa';
import AdminPlans from './Sections/AdminPlans';

// Sidebar navigation items with icons
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <MdDashboard size={20} /> },
  { key: 'analytics', label: 'Analytics', icon: <MdBarChart size={20} /> },
  { key: 'users', label: 'Users', icon: <MdPeople size={20} /> },
  { key: 'companies', label: 'Companies', icon: <MdBusiness size={20} /> },
  { key: 'subscriptions', label: 'Subscriptions', icon: <MdSubscriptions size={20} /> },
  { key: 'plans', label: 'Plans', icon: <FaRegListAlt size={20} /> },
  { key: 'system', label: 'System', icon: <MdSettings size={20} /> },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Render section based on activeSection
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboardOverview />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'users':
        return <AdminUsers />;
      case 'companies':
        return <AdminCompanies />;
      case 'subscriptions':
        return <AdminSubscriptions />;
      case 'plans':
        return <AdminPlans />;
      case 'system':
        return <AdminSystem />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-grayDash min-h-screen flex">
      <AdminSidebar>
        <ul className="list-none p-0 ">
          {NAV_ITEMS.map(item => (
            <li
              key={item.key}
              className={`flex items-center gap-3 py-2 px-4 rounded-lg cursor-pointer mb-2 transition-colors ${
                activeSection === item.key
                  ? 'bg-pink2 text-white font-bold'
                  : 'hover:bg-gray3 text-white2'
              }`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </AdminSidebar>
      <main className="flex-1 ml-[240px]">
        <AdminHeader>
          <div className="flex justify-between items-center px-6 py-4 bg-grayDash border-b border-b-gray4">
            <span className="text-white font-radioCanada text-xl">Admin Panel</span>
            <span className="text-white2">Profile | Notifications</span>
          </div>
        </AdminHeader>
        <div className="p-8 bg-gray3 rounded-lg m-8 mt-20">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
