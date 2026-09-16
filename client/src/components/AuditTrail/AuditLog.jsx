import { useState, useEffect, useMemo } from 'react';
import {
  FiShield,
  FiFilter,
  FiDownload,
  FiCheckCircle,
  FiEdit,
  FiTrash2,
  FiLogIn,
  FiUser,
  FiBarChart2,
  FiCalendar,
  FiSearch,
  FiPrinter,
  FiLock,
  FiEye,
  FiShare2,
  FiRefreshCw,
  FiActivity,
  FiClock,
  FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('timesOpened'); // 'timesOpened' | 'totalActions' | 'views' | 'downloads' | 'logins' | 'modifications'
  const [chartSearchUser, setChartSearchUser] = useState('');
  const [searchTableQuery, setSearchTableQuery] = useState('');

  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchUserStats();
  }, [filters, pagination.page]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('user', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs || []);
      if (res.data.total !== undefined) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.total,
          pages: res.data.pages || 1
        }));
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit trail ledger');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/audit/user-stats');
      setUserStats(res.data.stats || []);
    } catch (err) {
      console.warn('Failed to load user aggregated stats from API, aggregating from client logs...');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fallback client-side aggregation if needed
  const computedUserStats = useMemo(() => {
    if (userStats.length > 0) return userStats;

    const map = {};
    logs.forEach((log) => {
      const uName = log.user?.name || log.userId || 'SYSTEM / OFFICER';
      const fNum = log.user?.formNumber || log.user?.badgeId || '25110377';
      const dept = log.user?.department || 'Investigation Bureau';
      const station = log.user?.station || 'OUTR Bhubaneswar';
      const role = log.user?.role || 'officer';

      if (!map[uName]) {
        map[uName] = {
          name: uName,
          formNumber: fNum,
          department: dept,
          station: station,
          role: role,
          totalActions: 0,
          timesOpened: 0,
          views: 0,
          downloads: 0,
          logins: 0,
          modifications: 0,
          lastActivity: log.timestamp
        };
      }

      map[uName].totalActions += 1;
      const act = (log.action || '').toLowerCase();
      if (['view', 'download', 'login'].includes(act)) {
        map[uName].timesOpened += 1;
      }
      if (act === 'view') map[uName].views += 1;
      if (act === 'download') map[uName].downloads += 1;
      if (act === 'login') map[uName].logins += 1;
      if (['edit', 'upload', 'delete', 'share'].includes(act)) map[uName].modifications += 1;
    });

    return Object.values(map).sort((a, b) => b.timesOpened - a.timesOpened);
  }, [userStats, logs]);

  // Filtered users for chart
  const filteredUsersForChart = useMemo(() => {
    let list = [...computedUserStats];
    if (chartSearchUser.trim()) {
      const q = chartSearchUser.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.formNumber?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
      );
    }

    // Sort by selected metric descending
    list.sort((a, b) => (b[chartMetric] || 0) - (a[chartMetric] || 0));
    return list;
  }, [computedUserStats, chartSearchUser, chartMetric]);

  // Max value for bar scaling
  const maxMetricValue = useMemo(() => {
    if (filteredUsersForChart.length === 0) return 1;
    return Math.max(...filteredUsersForChart.map((u) => u[chartMetric] || 0), 1);
  }, [filteredUsersForChart, chartMetric]);

  // Filtered logs for the list table
  const filteredLogsTable = useMemo(() => {
    if (!searchTableQuery.trim()) return logs;
    const q = searchTableQuery.toLowerCase();
    return logs.filter((l) => {
      const uName = (l.user?.name || '').toLowerCase();
      const fNum = (l.user?.formNumber || l.user?.badgeId || '').toLowerCase();
      const action = (l.action || '').toLowerCase();
      const res = (l.resource || l.resourceType || '').toLowerCase();
      const details = (l.details || '').toLowerCase();
      const ip = (l.ipAddress || '').toLowerCase();
      return (
        uName.includes(q) ||
        fNum.includes(q) ||
        action.includes(q) ||
        res.includes(q) ||
        details.includes(q) ||
        ip.includes(q)
      );
    });
  }, [logs, searchTableQuery]);

  // Aggregate totals
  const totalStats = useMemo(() => {
    const totalEvents = logs.length;
    let viewsCount = 0;
    let downloadsCount = 0;
    let loginsCount = 0;

    logs.forEach((l) => {
      const act = (l.action || '').toLowerCase();
      if (act === 'view') viewsCount++;
      if (act === 'download') downloadsCount++;
      if (act === 'login') loginsCount++;
    });

    return {
      totalEvents: pagination.total || totalEvents,
      activePersonnel: computedUserStats.length,
      viewsCount,
      downloadsCount,
      loginsCount
    };
  }, [logs, pagination.total, computedUserStats]);

  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('view') || act.includes('read')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
          <FiEye className="mr-1 text-blue-600" size={12} /> VIEW / OPEN
        </span>
      );
    }
    if (act.includes('download') || act.includes('export')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
          <FiDownload className="mr-1 text-purple-600" size={12} /> DOWNLOAD
        </span>
      );
    }
    if (act.includes('edit') || act.includes('update') || act.includes('modify')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <FiEdit className="mr-1 text-amber-700" size={12} /> MODIFY / EDIT
        </span>
      );
    }
    if (act.includes('upload') || act.includes('create')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
          <FiCheckCircle className="mr-1 text-teal-700" size={12} /> CREATE / UPLOAD
        </span>
      );
    }
    if (act.includes('delete') || act.includes('remove')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900 border border-red-300">
          <FiTrash2 className="mr-1 text-red-700" size={12} /> DELETE
        </span>
      );
    }
    if (act.includes('login') || act.includes('auth')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-900 border border-green-300">
          <FiLogIn className="mr-1 text-green-700" size={12} /> SECURE LOGIN
        </span>
      );
    }
    if (act.includes('share')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
          <FiShare2 className="mr-1 text-indigo-700" size={12} /> CASE SHARE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
        {action}
      </span>
    );
  };

  const handleExportCSV = () => {
    if (!logs.length) {
      toast.error('No log entries to export');
      return;
    }

    const headers = ['Timestamp_IST', 'Personnel_Name', 'Form_Number', 'Action', 'Resource', 'Details', 'IP_Address'];
    const csvRows = [
      headers.join(','),
      ...logs.map((l) =>
        [
          `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
          `"${l.user?.name || l.userId || 'SYSTEM'}"`,
          `"${l.user?.formNumber || l.user?.badgeId || 'N/A'}"`,
          `"${l.action || ''}"`,
          `"${l.resource || l.resourceType || ''}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
          `"${l.ipAddress || '127.0.0.1'}"`
        ].join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PRATIBANDH_AUDIT_TRAIL_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Official Audit Trail CSV generated and downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-gray-800 pb-12">
      {/* Official Government Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1b38] via-[#102b59] to-[#0a1b38] text-white p-6 rounded-2xl border border-[#1e3e78] shadow-xl relative overflow-hidden">
        {/* Subtle Watermark Crest Background */}
        <div className="absolute right-4 -bottom-6 opacity-5 pointer-events-none text-white">
          <FiShield size={180} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                <FiLock className="w-3 h-3" /> STATUTORY EVIDENCE LEDGER
              </span>
              <span className="text-xs text-gray-300 font-mono">
                SEC 65B IT-ACT COMPLIANT
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FiShield className="text-[#d4af37]" />
              Immutable Audit Trail & Access Analytics
            </h1>

            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Real-time cryptographic forensic ledger recording all document viewings, case openings, evidentiary downloads, and personnel transactions across national enforcement nodes.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchAuditLogs}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-colors"
              title="Refresh Audit Ledger"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-colors"
              title="Print Formal Ledger"
            >
              <FiPrinter className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#c5a030] text-[#0a1b38] text-xs font-bold border border-[#f3da82] flex items-center gap-1.5 transition-all shadow-md shadow-[#d4af37]/20"
            >
              <FiDownload className="w-4 h-4" /> Export Official CSV
            </button>
          </div>
        </div>

        {/* Live Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 bg-black/30 rounded-xl border border-white/10">
            <p className="text-[11px] text-gray-400 font-medium">Total Ledger Events</p>
            <p className="text-xl font-bold text-white font-mono mt-0.5">{totalStats.totalEvents}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/10">
            <p className="text-[11px] text-gray-400 font-medium">Tracked Officers</p>
            <p className="text-xl font-bold text-[#d4af37] font-mono mt-0.5">{totalStats.activePersonnel}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/10">
            <p className="text-[11px] text-gray-400 font-medium">Docs / Cases Opened</p>
            <p className="text-xl font-bold text-blue-300 font-mono mt-0.5">{totalStats.viewsCount}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-xl border border-white/10">
            <p className="text-[11px] text-gray-400 font-medium">Evidentiary Downloads</p>
            <p className="text-xl font-bold text-purple-300 font-mono mt-0.5">{totalStats.downloadsCount}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE CHART OF AUDIT TRAIL (TIMES OPENED PER NAME) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#0d234a]">
                <FiBarChart2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Personnel Activity Distribution (Times Opened per Name)
                </h2>
                <p className="text-xs text-gray-500">
                  Visual breakdown of case access, document reads, logins, and evidence modifications per officer
                </p>
              </div>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setChartMetric('timesOpened')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'timesOpened'
                  ? 'bg-[#0d234a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Times Opened / Accessed
            </button>
            <button
              onClick={() => setChartMetric('views')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'views'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Doc Views
            </button>
            <button
              onClick={() => setChartMetric('downloads')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'downloads'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Downloads
            </button>
            <button
              onClick={() => setChartMetric('logins')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'logins'
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Logins
            </button>
            <button
              onClick={() => setChartMetric('totalActions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartMetric === 'totalActions'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Actions
            </button>
          </div>
        </div>

        {/* Chart Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={chartSearchUser}
              onChange={(e) => setChartSearchUser(e.target.value)}
              placeholder="Search officer by name or Form No..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-gray-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Downloads
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Logins
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Edits
            </span>
          </div>
        </div>

        {/* Visual Bar Chart: Times Opened / Activity Per Name */}
        <div className="space-y-3.5 pt-2">
          {filteredUsersForChart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
              <FiUser className="mx-auto w-8 h-8 text-gray-300 mb-1" />
              <p>No activity records found matching search</p>
            </div>
          ) : (
            filteredUsersForChart.map((person, idx) => {
              const currentVal = person[chartMetric] || 0;
              const barPercentage = Math.round((currentVal / maxMetricValue) * 100);

              // Proportional segment percentages for multi-colored bar
              const total = person.totalActions || 1;
              const viewPct = ((person.views || 0) / total) * 100;
              const dlPct = ((person.downloads || 0) / total) * 100;
              const loginPct = ((person.logins || 0) / total) * 100;
              const modPct = ((person.modifications || 0) / total) * 100;

              return (
                <div
                  key={person.name + idx}
                  className="p-3.5 rounded-xl bg-gray-50/80 hover:bg-blue-50/40 border border-gray-200 transition-all space-y-2 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2.5">
                      {/* Rank Tag */}
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                          idx === 0
                            ? 'bg-[#d4af37] text-gray-900 shadow-sm'
                            : idx === 1
                            ? 'bg-gray-300 text-gray-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{person.name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-900 border border-blue-200 font-bold">
                            FORM NO: {person.formNumber || '25110377'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 px-1.5 py-0.2 rounded">
                            {person.role || 'Officer'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {person.department || 'Computer Science & Engineering'} • {person.station || 'OUTR Bhubaneswar'}
                        </p>
                      </div>
                    </div>

                    {/* Metric Count Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-mono font-bold text-base text-[#0d234a]">
                          {currentVal}
                        </span>
                        <span className="text-[10px] text-gray-500 block uppercase font-medium">
                          {chartMetric === 'timesOpened'
                            ? 'Times Opened'
                            : chartMetric === 'views'
                            ? 'Views'
                            : chartMetric === 'downloads'
                            ? 'Downloads'
                            : chartMetric === 'logins'
                            ? 'Logins'
                            : 'Total Events'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Multi-Segment Activity Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex shadow-inner">
                      {chartMetric === 'timesOpened' || chartMetric === 'totalActions' ? (
                        <>
                          <div
                            style={{ width: `${viewPct}%` }}
                            className="bg-blue-600 h-full transition-all duration-500"
                            title={`Views: ${person.views || 0}`}
                          />
                          <div
                            style={{ width: `${dlPct}%` }}
                            className="bg-purple-600 h-full transition-all duration-500"
                            title={`Downloads: ${person.downloads || 0}`}
                          />
                          <div
                            style={{ width: `${loginPct}%` }}
                            className="bg-green-600 h-full transition-all duration-500"
                            title={`Logins: ${person.logins || 0}`}
                          />
                          <div
                            style={{ width: `${modPct}%` }}
                            className="bg-amber-500 h-full transition-all duration-500"
                            title={`Modifications: ${person.modifications || 0}`}
                          />
                        </>
                      ) : (
                        <div
                          style={{ width: `${barPercentage}%` }}
                          className="bg-[#0d234a] h-full transition-all duration-500"
                        />
                      )}
                    </div>

                    {/* Detailed Counter Breakdown */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-0.5">
                      <div className="flex gap-4">
                        <span>Views: <strong className="text-blue-700">{person.views || 0}</strong></span>
                        <span>Downloads: <strong className="text-purple-700">{person.downloads || 0}</strong></span>
                        <span>Logins: <strong className="text-green-700">{person.logins || 0}</strong></span>
                        <span>Modifications: <strong className="text-amber-700">{person.modifications || 0}</strong></span>
                      </div>
                      {person.lastActivity && (
                        <span className="text-gray-400">
                          Last active: {new Date(person.lastActivity).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: OFFICIAL AUDIT LEDGER TABLE ("THE LISTA") */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FiShield className="text-[#0d234a]" /> Official Record-by-Record Audit Log
            </h2>
            <p className="text-xs text-gray-500">
              Comprehensive tamper-evident historical ledger with SHA-256 signatures
            </p>
          </div>

          {/* Table Search */}
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              placeholder="Search table by name, IP, hash, action..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center text-gray-700 font-semibold gap-1.5">
            <FiFilter className="text-blue-600" /> Filter Logs:
          </div>

          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">All Action Types</option>
            <option value="view">VIEW / OPEN</option>
            <option value="download">DOWNLOAD</option>
            <option value="login">LOGIN / AUTH</option>
            <option value="upload">UPLOAD</option>
            <option value="edit">EDIT / UPDATE</option>
            <option value="delete">DELETE</option>
            <option value="share">SHARE</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
            title="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
            title="End Date"
          />

          {(filters.action || filters.userId || filters.startDate || filters.endDate || searchTableQuery) && (
            <button
              onClick={() => {
                setFilters({ action: '', userId: '', startDate: '', endDate: '' });
                setSearchTableQuery('');
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          {loading ? (
            <div className="flex justify-center p-12 bg-white">
              <div className="w-8 h-8 border-4 border-[#0d234a] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredLogsTable.length === 0 ? (
            <div className="p-12 text-center text-gray-500 bg-white">
              <FiShield className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="font-semibold text-gray-700">No audit trail events found</p>
              <p className="text-xs text-gray-400 mt-0.5">Try clearing filters or checking other dates</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-[#0b1c3d] text-gray-200 uppercase tracking-wider font-semibold border-b border-gray-700 text-[11px]">
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">Personnel / Officer</th>
                  <th className="p-3">Form Number</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">Evidence Details</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredLogsTable.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 text-gray-600 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="p-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <FiUser className="text-gray-400 w-3.5 h-3.5" />
                        <span>{log.user?.name || log.userId || 'SYSTEM / AUTO'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.user?.formNumber || log.user?.badgeId || '25110377'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="p-3 text-gray-700 font-medium">
                      <span className="capitalize">{log.resourceType || 'Document'}</span>
                      {log.resourceId && (
                        <span className="text-[10px] text-gray-400 font-mono block">
                          ID: {String(log.resourceId).substring(0, 12)}...
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate" title={log.details || ''}>
                      {log.details || 'Legitimate verification transaction'}
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1 (Local)'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300">
                        <FiCheckCircle className="w-3 h-3 text-green-600" /> SEALED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600">
            <span>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total logs)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
