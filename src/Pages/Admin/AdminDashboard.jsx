import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboardOverview from './Sections/AdminDashboardOverview';
import AdminAnalytics from './Sections/AdminAnalytics';
import AdminUsers from './Sections/AdminUsers';
import AdminCompanies from './Sections/AdminCompanies';
import AdminSubscriptions from './Sections/AdminSubscriptions';
import AdminSystem from './Sections/AdminSystem';
import { MdDashboard, MdBarChart, MdPeople, MdBusiness, MdSubscriptions, MdSettings, MdMenu } from 'react-icons/md';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Inject small CSS to prevent image overflow in dashboard sections
    const id = 'admin-dashboard-image-fix';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.innerHTML = `
        /* ensure images inside admin content are responsive and do not overflow */
        .admin-content img { max-width: 100%; height: auto; display: block; }
      `;
      document.head.appendChild(style);
      return () => {
        const el = document.getElementById(id);
        if (el) el.remove();
      };
    }
  }, []);

  // lock html & body scroll when sidebar is open (more robust on iOS)
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    if (isSidebarOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overflow = prevBodyOverflow || '';
    }

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow || '';
      document.body.style.overflow = prevBodyOverflow || '';
    };
  }, [isSidebarOpen]);

  // close sidebar on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <ul className="list-none p-0 ">
          {NAV_ITEMS.map(item => (
            <li
              key={item.key}
              className={`flex items-center gap-3 py-2 px-4 rounded-lg cursor-pointer mb-2 transition-colors ${
                activeSection === item.key
                  ? 'bg-pink2 text-white font-bold'
                  : 'hover:bg-gray3 text-white2'
              }`}
              onClick={() => {
                setActiveSection(item.key);
                // close sidebar on mobile after selection
                setIsSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </AdminSidebar>

      {/* main: sidebar & header are fixed; the content below header is the only scrollable area on md+ */}
      <main className="flex-1 md:ml-[240px] ml-0">
        {/* pass sidebar state so header can lower z / disable pointer events on mobile */}
        <AdminHeader isSidebarOpen={isSidebarOpen}>
          {/* simplified header child: no bg/border to avoid duplicate header lines */}
          <div className="flex justify-between items-center px-4 md:px-6 h-16">
            {/* hamburger for mobile */}
            <button
              className="md:hidden text-white2 p-2 rounded hover:bg-gray3"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MdMenu size={22} />
            </button>

            <span className="text-white font-radioCanada text-xl">Admin Panel</span>
            <span className="text-white2 hidden sm:inline">Profile | Notifications</span>
          </div>
        </AdminHeader>

        {/* content container placed below header (header h-16).
            On mobile allow normal document scrolling (no internal scroll), on md+ enable fixed-height scroll. */}
        <div className="admin-content mt-16 md:h-[calc(100vh-4rem)] h-auto px-4 md:px-8 py-6 bg-gray3 rounded-lg w-full md:overflow-auto overflow-visible">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
