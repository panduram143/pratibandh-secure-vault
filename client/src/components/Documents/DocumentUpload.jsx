import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUploadCloud, FiFile, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function DocumentUpload() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    caseId: '',
    documentType: 'fir',
    tags: '',
    accessLevel: 'restricted',
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await api.get('/cases');
      setCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    setProgress(20);

    try {
      const data = new FormData();
      data.append('document', file);
      data.append('caseId', formData.caseId);
      data.append('docType', formData.documentType);
      data.append('accessRestriction', formData.accessLevel);
      data.append('tags', formData.tags);
      data.append('title', file.name);

      // simulate progress
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const res = await api.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(timer);
      setProgress(100);
      toast.success('Document uploaded and encrypted successfully');
      navigate(`/documents/${res.data._id || res.data.document?._id}/view`);
    } catch (err) {
      console.error('Document upload error:', err);
      toast.error(err.response?.data?.msg || err.response?.data?.message || 'Failed to upload document');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/documents')}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark">Upload Secure Document</h1>
          <p className="text-gray-600 text-sm">Upload files to the encrypted evidence vault</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">File Upload *</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-primary bg-blue-50/30' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <FiFile className="text-primary mb-2" size={36} />
                <p className="font-medium text-dark text-sm">{file.name}</p>
                <p className="text-xs text-gray-500 mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="flex items-center text-xs text-accent hover:underline"
                >
                  <FiX className="mr-1" /> Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FiUploadCloud className="text-gray-400 mb-3" size={40} />
                <p className="font-medium text-dark text-sm mb-1">
                  Drag and drop document file here, or{' '}
                  <label className="text-primary hover:underline cursor-pointer">
                    browse
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">Supports PDF, PNG, JPG, DOCX up to 25MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Associated Case *</label>
              {cases.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/cases/new')}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  + Create Case First
                </button>
              )}
            </div>
            <select
              value={formData.caseId}
              onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">
                {cases.length === 0 ? '-- No Cases Found (Create one first) --' : '-- Select Case --'}
              </option>
              {cases.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.caseNumber || c.caseId || c._id.substring(0, 8)} - {c.title}
                </option>
              ))}
            </select>
            {cases.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ You must create at least one case before uploading evidence files.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Classification *</label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="fir">FIR (First Information Report)</option>
              <option value="charge_sheet">Charge Sheet</option>
              <option value="forensic_report">Forensic Report</option>
              <option value="witness_statement">Witness Statement</option>
              <option value="evidence">Evidence</option>
              <option value="investigation_report">Investigation Report</option>
              <option value="court_filing">Court Filing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="public">Public Record</option>
              <option value="restricted">Restricted (Assigned Officers)</option>
              <option value="confidential">Confidential (Admin & Senior Officers)</option>
              <option value="top_secret">Top Secret</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. ballistic, 9mm, scene-photos"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            />
          </div>
        </div>

        {progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Encrypting & Storing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center bg-primary hover:bg-secondary text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FiCheck className="mr-2" />
            {loading ? 'Processing...' : 'Upload & Encrypt'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DocumentUpload;
