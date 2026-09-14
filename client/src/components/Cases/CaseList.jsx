import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiFilter, FiFolder, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function CaseList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    crimeType: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const fetchCases = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.crimeType) params.append('crimeType', filters.crimeType);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);

      const res = await api.get(`/cases?${params.toString()}`);
      setCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId, caseTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete case "${caseTitle}"? This will delete all associated documents.`)) {
      return;
    }
    try {
      await api.delete(`/cases/${caseId}`);
      toast.success('Case deleted successfully');
      fetchCases();
    } catch (err) {
      console.error('Failed to delete case:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete case');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Open</span>;
      case 'under_investigation':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Investigation</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Critical</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Low</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Case Management</h1>
          <p className="text-gray-600">Browse and manage investigation records</p>
        </div>
        <Link
          to="/cases/new"
          className="flex items-center bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
        >
          <FiPlus className="mr-2" size={16} />
          Create New Case
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center text-gray-600 text-sm font-medium">
          <FiFilter className="mr-2" /> Filters:
        </div>

        <select
          value={filters.crimeType}
          onChange={(e) => setFilters({ ...filters, crimeType: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Crime Types</option>
          <option value="murder">Murder</option>
          <option value="rape">Rape</option>
          <option value="theft">Theft</option>
          <option value="cybercrime">Cybercrime</option>
          <option value="fraud">Fraud</option>
          <option value="kidnapping">Kidnapping</option>
          <option value="assault">Assault</option>
          <option value="drug_trafficking">Drug Trafficking</option>
          <option value="corruption">Corruption</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(filters.crimeType || filters.status || filters.priority) && (
          <button
            onClick={() => setFilters({ crimeType: '', status: '', priority: '' })}
            className="text-sm text-accent hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center p-12">
            <FiFolder className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600 font-medium">No cases found</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or create a new case</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Crime Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const isOwner = Boolean(
                    user && (
                      user._id === (c.createdBy?._id || c.createdBy) ||
                      user.role === 'super_admin'
                    )
                  );

                  return (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/cases/${c._id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-medium text-primary">{c.caseNumber || c.caseId || c._id.substring(0, 8)}</td>
                      <td className="p-3 text-dark font-medium">{c.title}</td>
                      <td className="p-3 text-gray-600">{c.crimeType}</td>
                      <td className="p-3">{getStatusBadge(c.status)}</td>
                      <td className="p-3">{getPriorityBadge(c.priority)}</td>
                      <td className="p-3 text-gray-600">{c.station}</td>
                      <td className="p-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCase(c._id, c.title, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center"
                            title="Delete Case (only creator can delete)"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CaseList;
