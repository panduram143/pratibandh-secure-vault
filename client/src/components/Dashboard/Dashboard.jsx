import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFolder,
  FiFile,
  FiAlertCircle,
  FiClock,
  FiPlus,
  FiUpload,
  FiSearch,
  FiBarChart2,
  FiShield,
  FiActivity,
  FiLock,
  FiCheckCircle,
  FiCreditCard
} from 'react-icons/fi';
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

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'station_admin' ||
    user?.formNumber === '25110377' ||
    user?.badgeId === '25110377';

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
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0b1c3d] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-500 font-mono">Synchronizing National Evidence Vault...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Active Investigation Cases', value: stats.totalCases, icon: FiFolder, color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { label: 'Open Urgent Cases', value: stats.openCases, icon: FiAlertCircle, color: 'bg-red-50 text-red-800 border-red-200' },
    { label: 'Sealed Digital Evidences', value: stats.documents, icon: FiFile, color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { label: 'Under Review / Forensic', value: stats.pendingReviews, icon: FiClock, color: 'bg-amber-50 text-amber-800 border-amber-200' },
  ];

  const rawQuickActions = [
    { label: 'Create Investigation Case', icon: FiPlus, link: '/cases/new', color: 'bg-[#0b1c3d] hover:bg-[#16356e]' },
    { label: 'Upload Digital Evidence', icon: FiUpload, link: '/documents/upload', color: 'bg-emerald-700 hover:bg-emerald-600' },
    { label: 'ID Card Verification', icon: FiCreditCard, link: '/login', color: 'bg-blue-700 hover:bg-blue-600' },
    { label: 'Audit Trail & Per-Name Chart', icon: FiActivity, link: '/audit', color: 'bg-[#d4af37] text-gray-950 font-bold hover:bg-[#c5a030]', adminOnly: true },
  ];

  const quickActions = rawQuickActions.filter((a) => !a.adminOnly || isAdmin);

  const maxCount = Math.max(...casesByType.map(c => c.count), 1);

  return (
    <div className="space-y-6 font-sans text-gray-800">
      {/* Official Government Greeting Header */}
      <div className="bg-gradient-to-r from-[#0a1b38] via-[#102b59] to-[#0a1b38] text-white p-6 rounded-2xl border border-[#1e3e78] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                <FiShield className="w-3 h-3" /> OFFICIAL INVESTIGATION WORKSPACE
              </span>
              <span className="text-xs text-gray-300 font-mono">
                OUTR NODE #2026
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Welcome, {user?.name || 'Authorized Officer'}
            </h1>

            <p className="text-xs text-gray-300 mt-1 flex items-center gap-2 font-mono">
              <span>DESIGNATION: {user?.role?.replace('_', ' ').toUpperCase()}</span>
              <span>•</span>
              <span>REGD NO: {user?.formNumber || '25110377'}</span>
              <span>•</span>
              <span>STATION: {user?.station || 'OUTR Bhubaneswar'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-gray-200 flex items-center gap-2 font-mono">
              <FiLock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>CCTNS ENCRYPTED NODE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-5 shadow-sm border ${stat.color.split(' ')[2]} relative overflow-hidden transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                GOV-SEC
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1 font-mono">{stat.value}</div>
            <div className="text-xs font-medium text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Ledger (Shown to all members on dashboard) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#0b1c3d]">
                <FiClock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900">Recent Audit Activity</h2>
                <p className="text-xs text-gray-500">Live timestamped access events & digital chain of custody</p>
              </div>
            </div>
            {isAdmin ? (
              <Link
                to="/audit"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
              >
                View Full Audit Chart →
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                <FiCheckCircle className="w-3 h-3 text-green-600" /> LIVE SEALED LEDGER
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">No recent audit events recorded</p>
            ) : (
              recentActivity.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-blue-50/30 transition-all text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900">
                      <strong className="text-blue-900 font-semibold">{log.user?.name || 'OFFICER'}</strong>{' '}
                      <span className="text-gray-500">performed</span>{' '}
                      <span className="font-bold uppercase text-gray-800">{log.action}</span>{' '}
                      <span className="text-gray-600 font-mono">({log.resource || log.resourceType || 'Evidence'})</span>
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-green-100 text-green-800 border border-green-200">
                    SEALED
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <span className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#96791d]">
              <FiShield className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900">Quick Operations</h2>
              <p className="text-xs text-gray-500">One-click enforcement tools</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className={`flex items-center justify-between ${action.color} text-white px-4 py-3 rounded-xl transition-all shadow-sm font-semibold text-xs group`}
              >
                <div className="flex items-center gap-2.5">
                  <action.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{action.label}</span>
                </div>
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Cases by Crime Category */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <span className="p-1.5 rounded-lg bg-blue-50 text-[#0b1c3d]">
            <FiBarChart2 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">Cases by Legal Category</h2>
            <p className="text-xs text-gray-500">Distribution across statutory crime classifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {casesByType.length === 0 ? (
            <p className="text-gray-400 text-xs col-span-2">No categorized cases currently in repository</p>
          ) : (
            casesByType.map((item) => (
              <div key={item._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-800 font-bold uppercase">{item._id || 'Standard Forensic Case'}</span>
                  <span className="text-gray-600 font-mono font-bold">{item.count} Cases</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0b1c3d] h-2 rounded-full transition-all duration-500"
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
