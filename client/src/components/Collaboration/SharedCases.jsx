import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShare2, FiCheck, FiX, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function SharedCases() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('withUs');
  const [sharedWithUs, setSharedWithUs] = useState([]);
  const [sharedByUs, setSharedByUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    caseId: '',
    targetStation: '',
    reason: '',
  });

  useEffect(() => {
    fetchSharedCases();
  }, []);

  const fetchSharedCases = async () => {
    try {
      const [withUsRes, byUsRes] = await Promise.all([
        api.get('/collaboration/shared-with-us'),
        api.get('/collaboration/shared-by-us'),
      ]);

      setSharedWithUs(withUsRes.data.cases || []);
      setSharedByUs(byUsRes.data.cases || []);
    } catch (err) {
      console.error('Failed to load shared cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (shareId, status) => {
    try {
      await api.patch(`/collaboration/requests/${shareId}`, { status });
      toast.success(`Request marked as ${status}`);
      fetchSharedCases();
    } catch (err) {
      toast.error('Failed to update request status');
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/collaboration/requests', requestForm);
      toast.success('Cross-station access request submitted');
      setShowRequestModal(false);
      setRequestForm({ caseId: '', targetStation: '', reason: '' });
      fetchSharedCases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Inter-Agency Collaboration</h1>
          <p className="text-gray-600 text-sm">
            Cross-station dossier sharing and multi-jurisdictional case management
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FiSend className="mr-2" size={14} />
          Request Case Access
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('withUs')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'withUs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Shared With Us ({sharedWithUs.length})
          </button>
          <button
            onClick={() => setActiveTab('byUs')}
            className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'byUs'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Shared By Us ({sharedByUs.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'withUs' ? (
          sharedWithUs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FiUsers className="mx-auto text-gray-300 mb-2" size={32} />
              <p>No active case files shared with your station</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Originating Station</th>
                  <th className="p-3">Access Level</th>
                  <th className="p-3">Date Shared</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sharedWithUs.map((item) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-primary">{item.case?.caseNumber || 'CASE-X'}</td>
                    <td className="p-3 text-dark">{item.case?.title || 'Classified Record'}</td>
                    <td className="p-3 text-gray-600">{item.fromStation}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-800 border border-purple-200">
                        {item.accessLevel}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 space-x-2">
                      {item.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAction(item._id, 'approved')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Accept"
                          >
                            <FiCheck size={16} />
                          </button>
                          <button
                            onClick={() => handleAction(item._id, 'rejected')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <FiX size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate(`/cases/${item.case?._id}`)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View Case
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : sharedByUs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiShare2 className="mx-auto text-gray-300 mb-2" size={32} />
            <p>You have not shared any case records externally</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="p-3">Case ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Destination Station</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date Initiated</th>
              </tr>
            </thead>
            <tbody>
              {sharedByUs.map((item) => (
                <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-semibold text-primary">{item.case?.caseNumber || 'CASE-X'}</td>
                  <td className="p-3 text-dark">{item.case?.title || 'Classified Record'}</td>
                  <td className="p-3 text-gray-600">{item.toStation}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-800 border border-blue-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Requesting Access */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-dark text-lg">Request Cross-Station Access</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Case ID *</label>
                <input
                  type="text"
                  required
                  value={requestForm.caseId}
                  onChange={(e) => setRequestForm({ ...requestForm, caseId: e.target.value })}
                  placeholder="e.g. CAS-2026-9812"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Police Station *</label>
                <input
                  type="text"
                  required
                  value={requestForm.targetStation}
                  onChange={(e) => setRequestForm({ ...requestForm, targetStation: e.target.value })}
                  placeholder="e.g. Crime Branch North Division"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason for Jurisdictional Request *</label>
                <textarea
                  rows={3}
                  required
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="State investigation grounds and FIR reference..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded text-sm font-medium"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedCases;
