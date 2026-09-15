import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { extractFaceDescriptorFromImage, loadFaceModels } from '../../utils/faceApi';
import { processIDCardOCR } from '../../utils/ocr';
import {
  FiUserCheck,
  FiPlus,
  FiSearch,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiLock,
  FiShield,
  FiUser,
  FiRefreshCw,
  FiTrash2,
  FiEye,
  FiCamera,
  FiZap,
  FiEdit2,
  FiCheck,
  FiInfo
} from 'react-icons/fi';

const SAMPLE_CARDS = [
  {
    id: 'soyam_prakash',
    name: 'Soyam Prakash Panda',
    regdNo: '25110377',
    role: 'super_admin',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'A+',
    image: '/sample_ids/soyam_prakash.jpeg'
  },
  {
    id: 'chitra',
    name: 'Chitra Adyasha Panda',
    regdNo: '25110335',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'A+',
    image: '/sample_ids/chitra.jpeg'
  },
  {
    id: 'kuldeep',
    name: 'S Kuldeep',
    regdNo: '25110367',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'O+',
    image: '/sample_ids/kuldeep.jpeg'
  },
  {
    id: 'soyam_sambit',
    name: 'Soyam Sambit Sahoo',
    regdNo: '25110378',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'AB+',
    image: '/sample_ids/soyam_sambit.jpeg'
  }
];

export default function ManagePersonnel() {
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalItem, setViewModalItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzingCard, setAnalyzingCard] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'camera'
  const [syncingSamples, setSyncingSamples] = useState(false);

  // Camera State for Modal
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // New Personnel Form State
  const [formData, setFormData] = useState({
    formNumber: '',
    name: '',
    email: '',
    role: 'officer',
    station: 'OUTR Bhubaneswar',
    department: 'Computer Science and Engineering',
    phone: ''
  });
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceConfidence, setFaceConfidence] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch Personnel List
  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      };

      const res = await api.get('/registered-ids', { params });
      setPersonnelList(res.data.items || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load personnel records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [page, roleFilter, statusFilter]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], `idcard-snap-${Date.now()}.jpeg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve({ file, dataUrl });
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCaptureCardFromCamera = async () => {
    const result = await captureCameraFrame();
    if (!result) {
      toast.error('Failed to capture image');
      return;
    }
    stopCamera();
    setInputMode('upload');
    await processImageForRegistration(result.file, result.dataUrl);
  };

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPersonnel();
  };

  // Process and Analyze ID Card (AI Face + OCR)
  const processImageForRegistration = async (file, previewUrl) => {
    setIdCardFile(file);
    setIdCardPreview(previewUrl);
    setFaceDescriptor(null);
    setFaceConfidence(null);
    setOcrConfidence(null);
    setAnalyzingCard(true);

    try {
      setAnalysisStatus('Loading AI Face Biometric & OCR Models...');
      await loadFaceModels();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = previewUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 1. Run Face Extraction on the ID Card Photo
      setAnalysisStatus('Extracting facial biometric descriptor from card photo...');
      const faceResult = await extractFaceDescriptorFromImage(img);

      if (faceResult && faceResult.descriptor) {
        setFaceDescriptor(faceResult.descriptor);
        const conf = Math.round(faceResult.confidence * 100);
        setFaceConfidence(conf);
        toast.success(`Face biometric detected (${conf}% quality)`);
      } else {
        toast.error('Warning: No clear portrait face found on this ID card. Please ensure the card has a visible photo.');
      }

      // 2. Run OCR to auto-extract Form Number and Name
      setAnalysisStatus('Scanning card text for Form / Registration Number and Name...');
      const ocrResult = await processIDCardOCR(img, (p) => setAnalysisStatus(p));

      setOcrConfidence(Math.round(ocrResult.confidence));
      const extractedNo = ocrResult.formNumber || '';
      const extractedName = ocrResult.possibleName || '';

      setFormData((prev) => ({
        ...prev,
        formNumber: extractedNo || prev.formNumber,
        name: extractedName || prev.name,
        email: extractedNo ? `${(extractedName.split(' ')[0] || 'officer').toLowerCase()}.${extractedNo.toLowerCase()}@outr.ac.in` : prev.email
      }));

      if (extractedNo) {
        toast.success(`Auto-detected Regd/Form No: ${extractedNo}`);
      }
    } catch (err) {
      console.error('AI Card Analysis Error:', err);
      toast.error('AI analysis encountered an error. You can still fill the fields manually.');
    } finally {
      setAnalyzingCard(false);
      setAnalysisStatus('');
    }
  };

  // Handle ID Card Upload & Automated AI Extraction
  const handleIDCardSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    await processImageForRegistration(file, previewUrl);
  };

  // Submit New Personnel Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.formNumber.trim()) {
      toast.error('Form / Registration Number is required');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Personnel Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!idCardFile) {
      toast.error('Please upload or capture an ID Card image');
      return;
    }
    if (!faceDescriptor) {
      toast.error('Cannot register without a valid face biometric vector extracted from ID card');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('idCard', idCardFile);
      data.append('formNumber', formData.formNumber.trim().toUpperCase());
      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim().toLowerCase());
      data.append('role', formData.role);
      data.append('station', formData.station.trim());
      data.append('department', formData.department.trim());
      data.append('phone', formData.phone.trim());
      data.append('faceDescriptor', JSON.stringify(faceDescriptor));

      await api.post('/registered-ids', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Personnel ${formData.name} successfully registered with ID card!`);
      closeModal();
      fetchPersonnel();
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Failed to register personnel';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Sync / Re-seed the 4 sample ID cards
  const handleSyncSampleCards = async () => {
    setSyncingSamples(true);
    const toastId = toast.loading('Extracting face biometrics and syncing 4 sample ID cards...');

    try {
      await loadFaceModels();
      const seedPayload = [];

      for (const sample of SAMPLE_CARDS) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = sample.image;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const faceDesc = await extractFaceDescriptorFromImage(img);
          if (faceDesc && faceDesc.descriptor) {
            seedPayload.push({
              formNumber: sample.regdNo,
              name: sample.name,
              email: `${sample.id}.${sample.regdNo}@outr.ac.in`,
              role: sample.role,
              station: sample.station,
              department: sample.department,
              phone: '+91 9876543210',
              faceDescriptor: faceDesc.descriptor,
              idCardImage: sample.image
            });
          }
        } catch (e) {
          console.warn(`Error processing sample ${sample.name}:`, e);
        }
      }

      if (seedPayload.length > 0) {
        const res = await api.post('/registered-ids/seed-samples', { samples: seedPayload });
        toast.success(`Synced ${res.data.count || seedPayload.length} sample ID cards successfully!`, { id: toastId });
        fetchPersonnel();
      } else {
        toast.error('No sample cards could be processed', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to sync sample cards', { id: toastId });
    } finally {
      setSyncingSamples(false);
    }
  };

  // Toggle Personnel Active Status
  const handleToggleStatus = async (personnel) => {
    const nextStatus = !personnel.isActive;
    const actionName = nextStatus ? 'Reactivate' : 'Deactivate';

    if (!window.confirm(`Are you sure you want to ${actionName} ${personnel.name} (${personnel.formNumber})?`)) {
      return;
    }

    try {
      if (nextStatus) {
        await api.put(`/registered-ids/${personnel._id}`, { isActive: true });
        toast.success(`Reactivated ${personnel.name}`);
      } else {
        await api.delete(`/registered-ids/${personnel._id}`);
        toast.success(`Deactivated ${personnel.name}`);
      }
      fetchPersonnel();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const closeModal = () => {
    stopCamera();
    setIsModalOpen(false);
    setInputMode('upload');
    setFormData({
      formNumber: '',
      name: '',
      email: '',
      role: 'officer',
      station: 'OUTR Bhubaneswar',
      department: 'Computer Science and Engineering',
      phone: ''
    });
    setIdCardFile(null);
    setIdCardPreview(null);
    setFaceDescriptor(null);
    setFaceConfidence(null);
    setOcrConfidence(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'station_admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'officer':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'forensic_expert':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'court_official':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiUserCheck className="text-primary dark:text-blue-400" /> Authorized Personnel & ID Card Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Directly register and manage official personnel ID cards with AI face biometrics ({totalCount} enrolled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSampleCards}
            disabled={syncingSamples}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 transition-all"
            title="Re-seed 4 Pre-configured OUTR ID Cards"
          >
            <FiZap className="w-4 h-4 text-yellow-400" /> Sync 4 Sample IDs
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setInputMode('upload');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-secondary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            <FiPlus className="w-4 h-4" /> Enter New ID Card
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Regd/Form No, name, email..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="station_admin">Station Admin</option>
              <option value="officer">Officer</option>
              <option value="forensic_expert">Forensic Expert</option>
              <option value="court_official">Court Official</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Personnel Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Regd / Form No</th>
                <th className="px-6 py-3.5">Officer Name & Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Institution / Dept</th>
                <th className="px-6 py-3.5">Biometric Status</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-gray-500">Loading personnel records...</p>
                  </td>
                </tr>
              ) : personnelList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    No authorized personnel records found. Click "Enter New ID Card" or "Sync 4 Sample IDs".
                  </td>
                </tr>
              ) : (
                personnelList.map((person) => (
                  <tr key={person._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {person.formNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {person.name}
                        {person.formNumber === '25110377' && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{person.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getRoleBadgeColor(person.role)}`}>
                        {person.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                      <div>{person.station || 'OUTR Bhubaneswar'}</div>
                      <div className="text-gray-400">{person.department || 'Computer Science & Engg'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <FiCheckCircle className="w-3.5 h-3.5" /> 128-d Vector
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${person.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${person.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {person.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewModalItem(person)}
                        className="text-xs text-blue-500 hover:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="View Details"
                      >
                        <FiEye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(person)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${person.isActive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                      >
                        {person.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REGISTER / ENTER NEW ID CARD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiShield className="text-primary dark:text-blue-400" /> Enter Official ID Card
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload or capture an ID card. The AI neural engine extracts the 128-d face vector and OCR details automatically.
              </p>
            </div>

            {/* Input Mode Selector: Upload vs Camera */}
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setInputMode('upload');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${inputMode === 'upload' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <FiUploadCloud className="w-4 h-4" /> Upload Image File
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode('camera');
                  startCamera();
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${inputMode === 'camera' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <FiCamera className="w-4 h-4" /> Live Camera Scan
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Camera Scanner View */}
              {inputMode === 'camera' && (
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-x-8 inset-y-4 border-2 border-blue-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2 bg-blue-500/5">
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                        <span className="w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                      </div>
                      <p className="text-center text-[10px] font-semibold text-blue-300 uppercase bg-black/70 py-0.5 px-2 rounded self-center">
                        Hold ID Card inside frame
                      </p>
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                        <span className="w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureCardFromCamera}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                  >
                    <FiCamera className="w-4 h-4" /> Capture & Extract Biometrics
                  </button>
                </div>
              )}

              {/* ID Card Upload Dropzone */}
              {inputMode === 'upload' && (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-800/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleIDCardSelect}
                    />

                    {idCardPreview ? (
                      <div className="space-y-2">
                        <div className="relative aspect-[16/9] max-h-48 mx-auto rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                          <img src={idCardPreview} alt="ID Card Preview" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                          Click to select a different image
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <FiUploadCloud className="w-10 h-10 text-gray-400 mx-auto" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Drop ID Card Photo Here or Click to Browse
                        </p>
                        <p className="text-xs text-gray-500">Supports JPG, PNG, WebP up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Analysis Status Banner */}
              {analyzingCard && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{analysisStatus}</p>
                </div>
              )}

              {/* Biometrics Extraction Badge */}
              {faceConfidence !== null && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-green-500 w-4 h-4" />
                    <span className="text-xs font-semibold text-green-800 dark:text-green-300">
                      Face Biometrics Ready ({faceConfidence}% confidence)
                    </span>
                  </div>
                  {ocrConfidence !== null && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      OCR Confidence: {ocrConfidence}%
                    </span>
                  )}
                </div>
              )}

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Regd / Form Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.formNumber}
                    onChange={(e) => setFormData({ ...formData, formNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 25110377"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Soyam Prakash Panda"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    placeholder="e.g. soyam.25110377@outr.ac.in"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="super_admin">Super Admin (Full System Control)</option>
                    <option value="station_admin">Station Admin</option>
                    <option value="officer">Officer / Student Investigator</option>
                    <option value="forensic_expert">Forensic Expert</option>
                    <option value="court_official">Court Official</option>
                    <option value="viewer">Viewer (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Station / Institution
                  </label>
                  <input
                    type="text"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                    placeholder="e.g. OUTR Bhubaneswar"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Department / Branch
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Computer Science and Engineering"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || analyzingCard || !faceDescriptor}
                  className="px-5 py-2.5 bg-primary hover:bg-secondary disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                >
                  {submitting ? 'Registering...' : 'Save & Enroll ID Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PERSONNEL DETAILS MODAL */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setViewModalItem(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiUser className="text-blue-500" /> Personnel Details
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registered identity & facial biometric records
              </p>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700/60 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewModalItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Regd / Form No:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{viewModalItem.formNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Email:</span>
                <span className="text-gray-800 dark:text-gray-200">{viewModalItem.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Role:</span>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${getRoleBadgeColor(viewModalItem.role)}`}>
                  {viewModalItem.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Institution:</span>
                <span className="text-gray-800 dark:text-gray-200">{viewModalItem.station || 'OUTR Bhubaneswar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Department:</span>
                <span className="text-gray-800 dark:text-gray-200">{viewModalItem.department || 'Computer Science & Engineering'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Biometric Status:</span>
                <span className="text-green-500 font-semibold flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5" /> 128-d Vector Enrolled
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewModalItem(null)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
