import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFolder, FiFile, FiAlertCircle, FiClock, FiPlus, FiUpload, FiSearch, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    openCases: 0,
    documents: 0,
    pendingReviews: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [casesByType, setCasesByType] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, typesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/audit/recent?limit=10'),
        api.get('/cases/by-crime-type'),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data.logs || []);
      setCasesByType(typesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: FiFolder, color: 'bg-blue-50 text-blue-700' },
    { label: 'Open Cases', value: stats.openCases, icon: FiAlertCircle, color: 'bg-green-50 text-green-700' },
    { label: 'Documents', value: stats.documents, icon: FiFile, color: 'bg-purple-50 text-purple-700' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: FiClock, color: 'bg-orange-50 text-orange-700' },
  ];

  const quickActions = [
    { label: 'New Case', icon: FiPlus, link: '/cases/new', color: 'bg-primary hover:bg-secondary' },
    { label: 'Upload Document', icon: FiUpload, link: '/documents/upload', color: 'bg-secondary hover:bg-primary' },
    { label: 'Search', icon: FiSearch, link: '/search', color: 'bg-gray-700 hover:bg-gray-800' },
  ];

  const maxCount = Math.max(...casesByType.map(c => c.count), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="fade-in">
        <h1 className="text-2xl font-bold text-dark mb-1">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-600">
          {user?.role?.toUpperCase()} | {user?.station || user?.department}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-dark mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center mb-4">
            <FiClock className="mr-2 text-primary" size={20} />
            <h2 className="text-lg font-semibold text-dark">Recent Activity</h2>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              recentActivity.map((log, idx) => (
                <div key={idx} className="flex items-start border-l-2 border-gray-200 pl-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm text-dark">
                      <span className="font-medium">{log.user?.name || 'Unknown'}</span>{' '}
                      <span className="text-gray-600">{log.action}</span>{' '}
                      <span className="font-medium">{log.resource}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center mb-4">
            <FiPlus className="mr-2 text-primary" size={20} />
            <h2 className="text-lg font-semibold text-dark">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className={`flex items-center ${action.color} text-white px-4 py-3 rounded-lg transition-colors`}
              >
                <action.icon className="mr-3" size={18} />
                <span className="font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center mb-4">
          <FiBarChart2 className="mr-2 text-primary" size={20} />
          <h2 className="text-lg font-semibold text-dark">Cases by Crime Type</h2>
        </div>
        <div className="space-y-3">
          {casesByType.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            casesByType.map((item) => (
              <div key={item._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{item._id || 'Unknown'}</span>
                  <span className="text-gray-600">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
