import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../AxiosInctance/AxiosInctance';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'user', label: 'User Analytics' },
  { key: 'company', label: 'Company Analytics' },
  { key: 'revenue', label: 'Revenue Analytics' },
];

const CARD_ICON = {
  users: (
    <svg className="w-8 h-8 text-pink2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
    </svg>
  ),
  companies: (
    <svg className="w-8 h-8 text-yellow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),
  revenue: (
    <svg className="w-8 h-8 text-selectGreen1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 8v8m0 0l-3-3m3 3l3-3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewAnalytics, setOverviewAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [companyAnalytics, setCompanyAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (activeTab === 'overview') {
      setLoading(true);
      setError('');
      axiosInstance.get('/admin/analytics/overview', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          setOverviewAnalytics(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load overview analytics.');
          setLoading(false);
        });
    }
    if (activeTab === 'user') {
      setLoading(true);
      setError('');
      axiosInstance.get('/admin/analytics/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          setUserAnalytics(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load user analytics.');
          setLoading(false);
        });
    }
    if (activeTab === 'company') {
      setLoading(true);
      setError('');
      axiosInstance.get('/admin/analytics/companies', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          setCompanyAnalytics(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load company analytics.');
          setLoading(false);
        });
    }
    if (activeTab === 'revenue') {
      setLoading(true);
      setError('');
      axiosInstance.get('/admin/analytics/revenue', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          setRevenueAnalytics(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load revenue analytics.');
          setLoading(false);
        });
    }
  }, [activeTab]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-radioCanada text-white mb-8">Analytics</h2>
      <div className="flex gap-4 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-6 py-2 rounded-xl font-radioCanada text-base transition-colors ${
              activeTab === tab.key
                ? 'bg-pink2 text-white font-bold'
                : 'bg-grayDash text-white2 hover:bg-gray3'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'overview' && (
          <div>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && overviewAnalytics && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {/* Users Card */}
                  <div className="bg-grayDash rounded-2xl px-8 py-8 flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">{CARD_ICON.users}</div>
                    <h4 className="text-lg font-radioCanada text-white mb-2">Users</h4>
                    <div className="flex flex-col gap-2 text-white2 w-full">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-white">{overviewAnalytics.users.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.users.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inactive</span>
                        <span className="font-bold text-selectRed1">{overviewAnalytics.users.inactive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Admins</span>
                        <span className="font-bold text-yellow">{overviewAnalytics.users.admin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Month</span>
                        <span className="font-bold text-white">{overviewAnalytics.users.newThisMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Week</span>
                        <span className="font-bold text-white">{overviewAnalytics.users.newThisWeek}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Growth Rate</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.users.growthRate}%</span>
                      </div>
                    </div>
                  </div>
                  {/* Companies Card */}
                  <div className="bg-grayDash rounded-2xl px-8 py-8 flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">{CARD_ICON.companies}</div>
                    <h4 className="text-lg font-radioCanada text-white mb-2">Companies</h4>
                    <div className="flex flex-col gap-2 text-white2 w-full">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-white">{overviewAnalytics.companies.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.companies.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Blocked</span>
                        <span className="font-bold text-selectRed1">{overviewAnalytics.companies.blocked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Month</span>
                        <span className="font-bold text-white">{overviewAnalytics.companies.newThisMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New This Week</span>
                        <span className="font-bold text-white">{overviewAnalytics.companies.newThisWeek}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Growth Rate</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.companies.growthRate}%</span>
                      </div>
                    </div>
                  </div>
                  {/* Revenue Card */}
                  <div className="bg-grayDash rounded-2xl px-8 py-8 flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">{CARD_ICON.revenue}</div>
                    <h4 className="text-lg font-radioCanada text-white mb-2">Revenue</h4>
                    <div className="flex flex-col gap-2 text-white2 w-full">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-white">${overviewAnalytics.revenue.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly</span>
                        <span className="font-bold text-selectGreen1">${overviewAnalytics.revenue.monthly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual</span>
                        <span className="font-bold text-white">${overviewAnalytics.revenue.annual}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Transaction</span>
                        <span className="font-bold text-yellow">${overviewAnalytics.revenue.averageTransaction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.revenue.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Growth Rate</span>
                        <span className="font-bold text-selectGreen1">{overviewAnalytics.revenue.growthRate}%</span>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-white2">
                      Last updated: {new Date(overviewAnalytics.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'user' && (
          <div className="max-w-md mx-auto bg-grayDash rounded-2xl px-8 py-8 mt-4">
            <h3 className="text-lg font-radioCanada text-white mb-4 flex items-center gap-2">
              {CARD_ICON.users} User Metrics
            </h3>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && userAnalytics && (
              <div className="text-white2 space-y-2">
                <div className="flex justify-between"><span>Total Users</span><span className="font-bold text-white">{userAnalytics.total}</span></div>
                <div className="flex justify-between"><span>Active Users</span><span className="font-bold text-selectGreen1">{userAnalytics.active}</span></div>
                <div className="flex justify-between"><span>Inactive Users</span><span className="font-bold text-selectRed1">{userAnalytics.inactive}</span></div>
                <div className="flex justify-between"><span>Admins</span><span className="font-bold text-yellow">{userAnalytics.admin}</span></div>
                <div className="flex justify-between"><span>New This Month</span><span className="font-bold text-white">{userAnalytics.newThisMonth}</span></div>
                <div className="flex justify-between"><span>New This Week</span><span className="font-bold text-white">{userAnalytics.newThisWeek}</span></div>
                <div className="flex justify-between"><span>Growth Rate</span><span className="font-bold text-selectGreen1">{userAnalytics.growthRate}%</span></div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'company' && (
          <div className="max-w-md mx-auto bg-grayDash rounded-2xl px-8 py-8 mt-4">
            <h3 className="text-lg font-radioCanada text-white mb-4 flex items-center gap-2">
              {CARD_ICON.companies} Company Metrics
            </h3>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && companyAnalytics && (
              <div className="text-white2 space-y-2">
                <div className="flex justify-between"><span>Total Companies</span><span className="font-bold text-white">{companyAnalytics.total}</span></div>
                <div className="flex justify-between"><span>Active Companies</span><span className="font-bold text-selectGreen1">{companyAnalytics.active}</span></div>
                <div className="flex justify-between"><span>Blocked Companies</span><span className="font-bold text-selectRed1">{companyAnalytics.blocked}</span></div>
                <div className="flex justify-between"><span>New This Month</span><span className="font-bold text-white">{companyAnalytics.newThisMonth}</span></div>
                <div className="flex justify-between"><span>New This Week</span><span className="font-bold text-white">{companyAnalytics.newThisWeek}</span></div>
                <div className="flex justify-between"><span>Growth Rate</span><span className="font-bold text-selectGreen1">{companyAnalytics.growthRate}%</span></div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'revenue' && (
          <div className="max-w-md mx-auto bg-grayDash rounded-2xl px-8 py-8 mt-4">
            <h3 className="text-lg font-radioCanada text-white mb-4 flex items-center gap-2">
              {CARD_ICON.revenue} Revenue Metrics
            </h3>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && revenueAnalytics && (
              <div className="text-white2 space-y-2">
                <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold text-white">${revenueAnalytics.total}</span></div>
                <div className="flex justify-between"><span>Monthly Revenue</span><span className="font-bold text-selectGreen1">${revenueAnalytics.monthly}</span></div>
                <div className="flex justify-between"><span>Annual Revenue</span><span className="font-bold text-white">${revenueAnalytics.annual}</span></div>
                <div className="flex justify-between"><span>Average Transaction</span><span className="font-bold text-yellow">${revenueAnalytics.averageTransaction}</span></div>
                <div className="flex justify-between"><span>Success Rate</span><span className="font-bold text-selectGreen1">{revenueAnalytics.successRate}%</span></div>
                <div className="flex justify-between"><span>Growth Rate</span><span className="font-bold text-selectGreen1">{revenueAnalytics.growthRate}%</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
