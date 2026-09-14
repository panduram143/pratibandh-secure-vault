import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiUpload, FiFile, FiClock, FiUsers, FiShare2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      const [caseRes, docsRes, timelineRes, sharingRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/documents?caseId=${id}`),
        api.get(`/audit/recent?limit=20`).catch(() => ({ data: { logs: [] } })),
        api.get(`/cases/${id}/shared`).catch(() => ({ data: { stations: [] } })),
      ]);

      setCaseData(caseRes.data);
      setDocuments(docsRes.data.documents || []);
      setTimeline(timelineRes.data.logs || []);
      setSharedWith(sharingRes.data.stations || []);
    } catch (err) {
      console.error('Failed to load case details:', err);
      toast.error('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      title: caseData.title || '',
      description: caseData.description || '',
      crimeType: caseData.crimeType || 'other',
      status: caseData.status || 'open',
      priority: caseData.priority || 'medium',
      station: caseData.station || '',
      courtName: caseData.courtName || '',
      judge: caseData.judge || '',
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put(`/cases/${id}`, editFormData);
      setCaseData(res.data);
      toast.success('Case updated successfully!');
      setIsEditModalOpen(false);
      // Refresh details to ensure we have the latest state
      fetchCaseDetail();
    } catch (err) {
      console.error('Failed to update case:', err);
      toast.error(err.response?.data?.msg || 'Failed to update case');
    } finally {
      setIsSaving(false);
    }
  };

  const isCaseOwner = Boolean(
    user && caseData && (
      user._id === (caseData.createdBy?._id || caseData.createdBy) ||
      user.role === 'super_admin'
    )
  );

  const handleDeleteCase = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/cases/${id}`);
      toast.success('Case deleted successfully');
      navigate('/cases');
    } catch (err) {
      console.error('Failed to delete case:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete case');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this document?')) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted successfully');
      fetchCaseDetail();
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Case not found</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Open</span>;
      case 'under_investigation':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Investigation</span>;
      case 'closed':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Closed</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Critical</span>;
      case 'high':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">High</span>;
      case 'medium':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Medium</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Low</span>;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiFile },
    { id: 'documents', label: 'Documents', icon: FiFile, count: documents.length },
    { id: 'timeline', label: 'Timeline', icon: FiClock },
    { id: 'sharing', label: 'Sharing', icon: FiUsers },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors mt-1"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold text-dark">{caseData.title}</h1>
              {getStatusBadge(caseData.status)}
              {getPriorityBadge(caseData.priority)}
            </div>
            <p className="text-gray-600 text-sm">
              Case #{caseData.caseNumber || caseData._id.substring(0, 8)} • {caseData.crimeType}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEditClick}
            className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
          >
            <FiEdit2 className="mr-2" size={16} />
            Edit
          </button>
          {isCaseOwner && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center border border-red-200 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm transition-colors font-medium"
              title="Only the creator of this case can delete it"
            >
              <FiTrash2 className="mr-2" size={16} />
              Delete Case
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="mr-2" size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-primary mb-3">Case Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-dark mt-1">{caseData.description || 'No description'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Station:</span>
                  <p className="text-dark mt-1">{caseData.station || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Court Name:</span>
                  <p className="text-dark mt-1">{caseData.courtName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Filed On:</span>
                  <p className="text-dark mt-1">{new Date(caseData.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {caseData.suspects && caseData.suspects.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-primary mb-3">Suspects</h3>
                <div className="space-y-2">
                  {caseData.suspects.map((suspect, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                      <p className="font-medium text-dark">{suspect.name}</p>
                      <p className="text-gray-600">
                        {suspect.age && `Age: ${suspect.age}`} {suspect.gender && `• Gender: ${suspect.gender}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {caseData.victims && caseData.victims.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-primary mb-3">Victims</h3>
                <div className="space-y-2">
                  {caseData.victims.map((victim, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                      <p className="font-medium text-dark">{victim.name}</p>
                      <p className="text-gray-600">
                        {victim.age && `Age: ${victim.age}`} {victim.gender && `• Gender: ${victim.gender}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-primary">Linked Documents</h3>
              <button
                onClick={() => navigate('/documents/upload')}
                className="flex items-center bg-primary hover:bg-secondary text-white px-3 py-2 rounded text-sm"
              >
                <FiUpload className="mr-2" size={14} />
                Upload
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents attached to this case</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => {
                  const isDocOwner = Boolean(
                    user && (
                      user._id === (doc.uploadedBy?._id || doc.uploadedBy) ||
                      user.role === 'super_admin'
                    )
                  );

                  return (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/documents/${doc._id}/view`)}
                      className="p-4 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors flex items-start justify-between group"
                    >
                      <div className="flex items-start flex-1 mr-2">
                        <FiFile className="text-primary mr-3 mt-1 flex-shrink-0" size={18} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark text-sm truncate">{doc.title || doc.name || doc.originalName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.docType || doc.documentType} • {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isDocOwner && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDocument(doc._id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Document (only uploader can delete)"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h3 className="text-md font-semibold text-primary mb-4">Activity Timeline</h3>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity recorded</p>
              ) : (
                timeline.map((log, idx) => (
                  <div key={idx} className="flex items-start border-l-2 border-primary pl-4 py-2">
                    <div className="flex-1">
                      <p className="text-sm text-dark">
                        <span className="font-medium">{log.user?.name || 'Unknown'}</span>{' '}
                        <span className="text-gray-600">{log.action}</span>
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
        )}

        {activeTab === 'sharing' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-primary">Shared With</h3>
              <button className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-100">
                <FiShare2 className="mr-2" size={14} />
                Share Access
              </button>
            </div>
            {sharedWith.length === 0 ? (
              <p className="text-gray-500 text-sm">This case has not been shared with other stations</p>
            ) : (
              <div className="space-y-2">
                {sharedWith.map((share, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                    <div>
                      <p className="font-medium text-dark text-sm">{share.station}</p>
                      <p className="text-xs text-gray-500">
                        Access: {share.accessLevel} • Shared on {new Date(share.sharedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-dark">Edit Case</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crime Type
                  </label>
                  <select
                    name="crimeType"
                    value={editFormData.crimeType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="under_investigation">Under Investigation</option>
                    <option value="charge_sheeted">Charge Sheeted</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Station
                  </label>
                  <input
                    type="text"
                    name="station"
                    value={editFormData.station}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Name
                  </label>
                  <input
                    type="text"
                    name="courtName"
                    value={editFormData.courtName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judge
                  </label>
                  <input
                    type="text"
                    name="judge"
                    value={editFormData.judge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-dark">Delete Case</h3>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete case <strong className="text-dark font-semibold">{caseData.title}</strong> (#{caseData.caseNumber || caseData.caseId || caseData._id})?
            </p>
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              ⚠️ Warning: This will permanently delete this case record and all attached documents. Only the creator of this case can perform this action.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCase}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseDetail;
