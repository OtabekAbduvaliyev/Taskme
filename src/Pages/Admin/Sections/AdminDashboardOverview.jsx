import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../AxiosInctance/AxiosInctance';

const AdminDashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axiosInstance.get('/admin/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load dashboard data.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats) return <div>No data available.</div>;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-radioCanada text-white mb-8 ">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-grayDash rounded-xl px-6 py-8 flex flex-col items-center">
          <span className="text-white font-bold text-3xl">{stats.overview.totalUsers}</span>
          <span className="text-white2 mt-2 text-sm">Total Users</span>
        </div>
        <div className="bg-grayDash rounded-xl px-6 py-8 flex flex-col items-center">
          <span className="text-white font-bold text-3xl">{stats.overview.totalCompanies}</span>
          <span className="text-white2 mt-2 text-sm">Total Companies</span>
        </div>
        <div className="bg-grayDash rounded-xl px-6 py-8 flex flex-col items-center">
          <span className="text-white font-bold text-3xl">{stats.overview.totalTasks}</span>
          <span className="text-white2 mt-2 text-sm">Total Tasks</span>
        </div>
        <div className="bg-grayDash rounded-xl px-6 py-8 flex flex-col items-center">
          <span className="text-white font-bold text-3xl">{stats.overview.activeSubscriptions}</span>
          <span className="text-white2 mt-2 text-sm">Active Subscriptions</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-grayDash rounded-xl px-6 py-6">
          <h3 className="text-lg font-radioCanada text-white mb-2">Quick Stats (Today)</h3>
          <div className="text-white2">
            <div>New Users: <span className="font-bold text-white">{stats.quickStats?.usersToday}</span></div>
            <div>New Companies: <span className="font-bold text-white">{stats.quickStats?.companiesToday}</span></div>
            <div>Revenue Today: <span className="font-bold text-white">${stats.quickStats?.revenueToday}</span></div>
            <div>Errors Today: <span className="font-bold text-white">{stats.quickStats?.errorsToday}</span></div>
          </div>
        </div>
        <div className="bg-grayDash rounded-xl px-6 py-6">
          <h3 className="text-lg font-radioCanada text-white mb-2">System Status</h3>
          <div className="text-white2">
            <div>Status: <span className="font-bold text-white">{stats.overview.systemStatus}</span></div>
            <div>Total Revenue: <span className="font-bold text-white">${stats.overview.totalRevenue}</span></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-grayDash rounded-xl px-6 py-6">
          <h3 className="text-lg font-radioCanada text-white mb-2">Recent Activity</h3>
          <ul className="text-white2 list-disc pl-5">
            {stats.recentActivity?.length === 0 ? (
              <li>No recent activity.</li>
            ) : (
              stats.recentActivity.map((item, idx) => (
                <li key={item.id || idx}>
                  {typeof item === 'string'
                    ? item
                    : (
                      <div>
                        <div>Type: {item.type}</div>
                        <div>Description: {item.description}</div>
                        <div>Timestamp: {item.timestamp}</div>
                      </div>
                    )
                  }
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="bg-grayDash rounded-xl px-6 py-6">
          <h3 className="text-lg font-radioCanada text-white mb-2">Alerts</h3>
          <ul className="text-red-400 list-disc pl-5">
            {stats.alerts?.length === 0 ? (
              <li>No alerts.</li>
            ) : (
              stats.alerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
