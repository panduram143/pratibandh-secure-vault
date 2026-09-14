import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFilter, FiFile, FiGrid, FiList, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function DocumentList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    docType: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.docType) params.append('type', filters.docType);
      if (filters.dateFrom) params.append('from', filters.dateFrom);
      if (filters.dateTo) params.append('to', filters.dateTo);

      const res = await api.get(`/documents?${params.toString()}`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, docTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${docTitle || 'this document'}"?`)) {
      return;
    }
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete document');
    }
  };

  const getDocTypeBadge = (type) => {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-800 border border-blue-200">
        {type || 'General'}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Document Repository</h1>
          <p className="text-gray-600">Secure digital archive of evidence and case files</p>
        </div>
        <button
          onClick={() => navigate('/documents/upload')}
          className="flex items-center bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
        >
          <FiUpload className="mr-2" size={16} />
          Upload Document
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center text-gray-600 text-sm font-medium">
            <FiFilter className="mr-2" /> Filters:
          </div>

          <select
            value={filters.docType}
            onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="">All Document Types</option>
            <option value="fir">FIR (First Information Report)</option>
            <option value="charge_sheet">Charge Sheet</option>
            <option value="forensic_report">Forensic Report</option>
            <option value="witness_statement">Witness Statement</option>
            <option value="evidence">Evidence</option>
            <option value="investigation_report">Investigation Report</option>
            <option value="court_filing">Court Filing</option>
            <option value="other">Other</option>
          </select>

          {(filters.docType || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ docType: '', dateFrom: '', dateTo: '' })}
              className="text-sm text-accent hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center border border-gray-300 rounded p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-500'}`}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-500'}`}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center p-12">
          <FiFile className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 font-medium">No documents found</p>
          <p className="text-gray-400 text-sm">Upload a new document or change filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-primary transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-50 text-primary rounded">
                      <FiFile size={20} />
                    </div>
                    <div className="flex items-center space-x-2">
                      {getDocTypeBadge(doc.docType)}
                      {isDocOwner && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDocument(doc._id, doc.title, e)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Document (only uploader can delete)"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-dark text-base mb-1 line-clamp-1">{doc.title || doc.originalName}</h3>
                  <p className="text-xs text-gray-500 mb-2">Case ID: {doc.case?.caseNumber || doc.case?.caseId || 'Unlinked'}</p>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between text-xs text-gray-500">
                  <span>By: {doc.uploadedBy?.name || 'Officer'}</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="p-3">Document Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Case</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const isDocOwner = Boolean(
                  user && (
                    user._id === (doc.uploadedBy?._id || doc.uploadedBy) ||
                    user.role === 'super_admin'
                  )
                );

                return (
                  <tr
                    key={doc._id}
                    onClick={() => navigate(`/documents/${doc._id}/view`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-medium text-dark flex items-center">
                      <FiFile className="text-primary mr-2" size={16} />
                      {doc.title || doc.originalName}
                    </td>
                    <td className="p-3">{getDocTypeBadge(doc.docType)}</td>
                    <td className="p-3 text-gray-600">{doc.case?.caseNumber || doc.case?.caseId || 'Unlinked'}</td>
                    <td className="p-3 text-gray-600">{doc.uploadedBy?.name || 'Officer'}</td>
                    <td className="p-3 text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {isDocOwner ? (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDocument(doc._id, doc.title, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex items-center"
                          title="Delete Document"
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
  );
}

export default DocumentList;
