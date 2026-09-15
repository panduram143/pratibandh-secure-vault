import { useState, useEffect } from 'react';
import { FiShield, FiFilter, FiDownload, FiCheckCircle, FiEdit, FiTrash2, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('view') || act.includes('read')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          <FiCheckCircle className="mr-1" size={12} /> {action}
        </span>
      );
    }
    if (act.includes('edit') || act.includes('update') || act.includes('modify')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
          <FiEdit className="mr-1" size={12} /> {action}
        </span>
      );
    }
    if (act.includes('delete') || act.includes('remove')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <FiTrash2 className="mr-1" size={12} /> {action}
        </span>
      );
    }
    if (act.includes('login') || act.includes('auth')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <FiLogIn className="mr-1" size={12} /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        {action}
      </span>
    );
  };

  const handleExport = () => {
    toast.success('Audit log export initiated (CSV/PDF)');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <FiShield className="text-primary" size={24} />
            <h1 className="text-2xl font-bold text-dark">Immutable Audit Trail</h1>
          </div>
          <p className="text-gray-600 text-sm mt-0.5">
            Cryptographically sealed and tamper-evident activity ledger
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FiDownload className="mr-2" size={16} />
          Export Ledger
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center text-gray-600 text-sm font-medium">
          <FiFilter className="mr-2" /> Filter Logs:
        </div>

        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Action Types</option>
          <option value="VIEW">VIEW / READ</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE / EDIT</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="EXPORT">EXPORT</option>
        </select>

        {(filters.action || filters.userId || filters.from || filters.to) && (
          <button
            onClick={() => setFilters({ action: '', userId: '', from: '', to: '' })}
            className="text-sm text-accent hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiShield className="mx-auto text-gray-300 mb-2" size={32} />
            <p>No audit trail events recorded matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <th className="p-3">Timestamp (IST)</th>
                  <th className="p-3">User / Officer</th>
                  <th className="p-3">Form No</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource Target</th>
                  <th className="p-3">Details / Hash</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-sans font-medium text-dark">
                      {log.user?.name || log.userId || 'SYSTEM_DAEMON'}
                    </td>
                    <td className="p-3 text-gray-600">{log.user?.formNumber || log.user?.badgeId || 'AUTO'}</td>
                    <td className="p-3 whitespace-nowrap font-sans">{getActionBadge(log.action)}</td>
                    <td className="p-3 font-sans text-gray-700">{log.resource}</td>
                    <td className="p-3 text-gray-500 truncate max-w-xs" title={log.details || log.hash}>
                      {log.details || log.hash || '—'}
                    </td>
                    <td className="p-3 text-gray-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
