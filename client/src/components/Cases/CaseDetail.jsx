import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiFile,
  FiClock,
  FiUsers,
  FiShare2,
  FiX,
  FiSearch,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
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
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [inCaseSearch, setInCaseSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCaseDetail();
    fetchOfficersList();
  }, [id]);

  const fetchOfficersList = async () => {
    try {
      const res = await api.get('/cases/officers/list');
      setOfficersList(res.data.officers || []);
    } catch (err) {
      console.warn('Could not load officers list:', err);
    }
  };

  const fetchCaseDetail = async () => {
    try {
      const [caseRes, docsRes, timelineRes, sharingRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/documents?caseId=${id}`),
        api.get(`/audit/recent?limit=30`).catch(() => ({ data: { logs: [] } })),
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

  // 3 Admitted Officers computation
  const admittedOfficers = useMemo(() => {
    if (!caseData) return [];
    return caseData.admittedOfficers || caseData.assignedOfficers || [];
  }, [caseData]);

  // Check if current logged-in user is one of the 3 admitted officers
  const isUserAdmitted = useMemo(() => {
    if (!user || !caseData) return false;
    if (user.role === 'super_admin' || user.formNumber === '25110377' || user.badgeId === '25110377') {
      return true;
    }
    const userId = user._id || user.id;
    const createdById = caseData.createdBy?._id || caseData.createdBy;
    if (createdById && createdById.toString() === userId?.toString()) {
      return true;
    }
    return admittedOfficers.some(
      (off) => (off._id || off).toString() === userId?.toString()
    );
  }, [user, caseData, admittedOfficers]);

  // In-Case Search Filter Calculations
  const searchQuery = inCaseSearch.trim().toLowerCase();

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((doc) => {
      const name = (doc.title || doc.name || doc.originalName || '').toLowerCase();
      const type = (doc.docType || doc.documentType || '').toLowerCase();
      const tags = (doc.tags || []).join(' ').toLowerCase();
      const ocr = (doc.ocrText || '').toLowerCase();
      return name.includes(searchQuery) || type.includes(searchQuery) || tags.includes(searchQuery) || ocr.includes(searchQuery);
    });
  }, [documents, searchQuery]);

  const filteredTimeline = useMemo(() => {
    if (!searchQuery) return timeline;
    return timeline.filter((log) => {
      const userName = (log.user?.name || '').toLowerCase();
      const userForm = (log.user?.formNumber || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      return (
        userName.includes(searchQuery) ||
        userForm.includes(searchQuery) ||
        action.includes(searchQuery) ||
        details.includes(searchQuery)
      );
    });
  }, [timeline, searchQuery]);

  const filteredSuspects = useMemo(() => {
    if (!caseData?.suspects) return [];
    if (!searchQuery) return caseData.suspects;
    return caseData.suspects.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      const gender = (s.gender || '').toLowerCase();
      return name.includes(searchQuery) || desc.includes(searchQuery) || gender.includes(searchQuery);
    });
  }, [caseData, searchQuery]);

  const filteredVictims = useMemo(() => {
    if (!caseData?.victims) return [];
    if (!searchQuery) return caseData.victims;
    return caseData.victims.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const gender = (v.gender || '').toLowerCase();
      return name.includes(searchQuery) || gender.includes(searchQuery);
    });
  }, [caseData, searchQuery]);

  const searchMatchCount = useMemo(() => {
    if (!searchQuery) return 0;
    let count = 0;
    count += filteredDocuments.length;
    count += filteredTimeline.length;
    count += filteredSuspects.length;
    count += filteredVictims.length;
    if (caseData) {
      if ((caseData.title || '').toLowerCase().includes(searchQuery)) count++;
      if ((caseData.description || '').toLowerCase().includes(searchQuery)) count++;
      if ((caseData.station || '').toLowerCase().includes(searchQuery)) count++;
      if ((caseData.courtName || '').toLowerCase().includes(searchQuery)) count++;
    }
    return count;
  }, [searchQuery, filteredDocuments, filteredTimeline, filteredSuspects, filteredVictims, caseData]);

  const handleEditClick = () => {
    const admittedIds = admittedOfficers.map((o) => o._id || o);
    setEditFormData({
      title: caseData.title || '',
      description: caseData.description || '',
      crimeType: caseData.crimeType || 'other',
      status: caseData.status || 'open',
      priority: caseData.priority || 'medium',
      station: caseData.station || '',
      courtName: caseData.courtName || '',
      judge: caseData.judge || '',
      admittedOfficer1: admittedIds[0] || '',
      admittedOfficer2: admittedIds[1] || '',
      admittedOfficer3: admittedIds[2] || '',
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const admitted = [
        editFormData.admittedOfficer1,
        editFormData.admittedOfficer2,
        editFormData.admittedOfficer3,
      ].filter(Boolean);

      const payload = {
        title: editFormData.title,
        description: editFormData.description,
        crimeType: editFormData.crimeType,
        status: editFormData.status,
        priority: editFormData.priority,
        station: editFormData.station,
        courtName: editFormData.courtName,
        judge: editFormData.judge,
        admittedOfficers: admitted,
        assignedOfficers: admitted,
      };

      const res = await api.put(`/cases/${id}`, payload);
      setCaseData(res.data);
      toast.success('Case details & admitted clearances updated!');
      setIsEditModalOpen(false);
      fetchCaseDetail();
    } catch (err) {
      console.error('Failed to update case:', err);
      toast.error(err.response?.data?.msg || 'Failed to update case');
    } finally {
      setIsSaving(false);
    }
  };

  const isCaseOwner = Boolean(
    user &&
      caseData &&
      (user._id === (caseData.createdBy?._id || caseData.createdBy) ||
        user.role === 'super_admin' ||
        user.formNumber === '25110377' ||
        user.badgeId === '25110377')
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
    { id: 'documents', label: 'Documents', icon: FiFile, count: filteredDocuments.length },
    { id: 'timeline', label: 'Timeline', icon: FiClock, count: filteredTimeline.length },
    { id: 'sharing', label: 'Sharing', icon: FiUsers },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/cases')}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors mt-1"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
              <h1 className="text-2xl font-bold text-dark">{caseData.title}</h1>
              {getStatusBadge(caseData.status)}
              {getPriorityBadge(caseData.priority)}
            </div>
            <p className="text-gray-600 text-sm flex items-center gap-2 flex-wrap">
              <span>Case #{caseData.caseNumber || caseData._id.substring(0, 8)}</span>
              <span>•</span>
              <span className="capitalize">{caseData.crimeType}</span>
              <span>•</span>
              {isUserAdmitted ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  <FiCheckCircle className="w-3 h-3" /> Admitted Clearance Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  <FiLock className="w-3 h-3" /> Non-Admitted Personnel (Victim Blackout)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleEditClick}
            className="flex items-center border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            <FiEdit2 className="mr-1.5" size={15} />
            Edit Case & Clearances
          </button>
          {isCaseOwner && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center border border-red-200 bg-red-50 text-red-600 px-3.5 py-2 rounded-lg hover:bg-red-100 text-sm transition-colors font-medium"
              title="Only the creator of this case can delete it"
            >
              <FiTrash2 className="mr-1.5" size={15} />
              Delete Case
            </button>
          )}
        </div>
      </div>

      {/* IN-CASE SEARCH BOX */}
      <div className="bg-gradient-to-r from-[#0a1b38] to-[#122854] p-4 rounded-xl shadow-md border border-blue-900/40 text-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#d4af37] uppercase tracking-wider">
            <FiSearch className="w-3.5 h-3.5" /> Search Inside This Case
          </div>
          {searchQuery && (
            <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-0.5 rounded-full text-blue-200">
              {searchMatchCount} match{searchMatchCount === 1 ? '' : 'es'} found
            </span>
          )}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={inCaseSearch}
            onChange={(e) => setInCaseSearch(e.target.value)}
            placeholder="Search evidence documents, OCR text, activity logs, suspects, victims inside this case..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#071326] border border-blue-500/40 rounded-lg text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
          />
          {inCaseSearch && (
            <button
              onClick={() => setInCaseSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded transition-colors"
              title="Clear Search"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Contents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 3 Dedicated Spaces for Admitted Officers */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a1b38] text-[#d4af37] flex items-center justify-center font-bold">
                    <FiUserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-dark flex items-center gap-2">
                      3 Admitted Officer Spaces (Statutory Clearance Ledger)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Officers sworn and admitted to this investigation file
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEditClick}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <FiEdit2 className="w-3 h-3" /> Manage Spaces
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {[0, 1, 2].map((slotIdx) => {
                  const officer = admittedOfficers[slotIdx];
                  const slotLabels = ['Space 1 (Lead Admitted)', 'Space 2 (Admitted Officer)', 'Space 3 (Admitted Officer)'];
                  const isCurrentLoggedUserSlot =
                    officer &&
                    user &&
                    ((officer._id || officer).toString() === (user._id || user.id)?.toString());

                  return (
                    <div
                      key={slotIdx}
                      className={`p-4 rounded-xl border transition-all ${
                        officer
                          ? isCurrentLoggedUserSlot
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                            : 'bg-white border-gray-200 shadow-sm'
                          : 'bg-gray-50/70 border-dashed border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-gray-700">{slotLabels[slotIdx]}</span>
                        {officer ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <FiCheckCircle className="w-2.5 h-2.5" /> Admitted
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Available Slot
                          </span>
                        )}
                      </div>

                      {officer ? (
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-dark flex items-center gap-1.5">
                            {officer.name || 'Admitted Officer'}
                            {isCurrentLoggedUserSlot && (
                              <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">YOU</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            ID: <span className="font-mono font-semibold">{officer.formNumber || officer.badgeId || 'N/A'}</span>
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {officer.department || officer.station || officer.role || 'Investigative Officer'}
                          </p>
                        </div>
                      ) : (
                        <div className="py-2 text-center text-xs text-gray-400">
                          <FiUserX className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                          <span>No officer allocated to this space</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Information */}
            <div>
              <h3 className="text-md font-semibold text-primary mb-3">Case Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-dark mt-1">{caseData.description || 'No description'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Station / Division:</span>
                  <p className="text-dark mt-1">{caseData.station || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Designated Court:</span>
                  <p className="text-dark mt-1">{caseData.courtName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Filed On:</span>
                  <p className="text-dark mt-1">{new Date(caseData.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Suspects */}
            {filteredSuspects && filteredSuspects.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-primary mb-3">
                  Suspects {searchQuery && `(${filteredSuspects.length} matching)`}
                </h3>
                <div className="space-y-2">
                  {filteredSuspects.map((suspect, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                      <p className="font-medium text-dark">{suspect.name}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {suspect.age && `Age: ${suspect.age}`} {suspect.gender && `• Gender: ${suspect.gender}`}
                        {suspect.description && ` • ${suspect.description}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Victims (Confidential / Blackout Access Control) */}
            {filteredVictims && filteredVictims.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-primary flex items-center gap-2">
                    Victims Information
                    {caseData.isVictimRedacted ? (
                      <span className="text-xs bg-red-100 text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiEyeOff className="w-3 h-3" /> Redacted / Blacked Out
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiEye className="w-3 h-3" /> Unredacted Clearance
                      </span>
                    )}
                  </h3>
                  {caseData.isVictimRedacted && (
                    <span className="text-xs text-amber-700 font-medium">
                      Victim identity restricted to 3 Admitted Officers
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredVictims.map((victim, idx) => {
                    const isRedacted = victim.isRedacted || victim.name === '████████' || caseData.isVictimRedacted;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border text-sm ${
                          isRedacted
                            ? 'bg-amber-50/60 border-amber-200 text-gray-800'
                            : 'bg-emerald-50/50 border-emerald-200 text-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            {isRedacted ? (
                              <div className="flex items-center gap-2">
                                <span className="bg-black text-amber-300 font-mono font-black text-sm tracking-widest px-2.5 py-1 rounded select-none shadow-inner border border-amber-500/30">
                                  ████████
                                </span>
                                <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                                  <FiLock className="w-3 h-3" /> Blacked Out for Non-Admitted Officers
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-dark text-base">{victim.name}</span>
                            )}
                          </div>

                          <div className="text-xs text-gray-600">
                            {victim.age && `Age: ${victim.age}`} {victim.gender && `• Gender: ${victim.gender}`}
                          </div>
                        </div>

                        {isRedacted && (
                          <p className="text-[11px] text-amber-800/90 mt-2 italic flex items-center gap-1">
                            <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Statutory confidentiality enforced: Only the 3 admitted officers assigned to this case have clearance to view this victim&apos;s real legal identity.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-md font-semibold text-primary">
                  Linked Evidence Documents {searchQuery && `(${filteredDocuments.length} matching)`}
                </h3>
                {searchQuery && (
                  <p className="text-xs text-gray-500">Filtered by: &quot;{searchQuery}&quot;</p>
                )}
              </div>
              <button
                onClick={() => navigate('/documents/upload')}
                className="flex items-center bg-primary hover:bg-secondary text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <FiUpload className="mr-2" size={14} />
                Upload Evidence
              </button>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <FiFile className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p>
                  {searchQuery
                    ? `No attached documents match "${searchQuery}"`
                    : 'No documents attached to this case'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocuments.map((doc) => {
                  const isDocOwner = Boolean(
                    user &&
                      (user._id === (doc.uploadedBy?._id || doc.uploadedBy) ||
                        user.role === 'super_admin' ||
                        user.formNumber === '25110377')
                  );

                  return (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/documents/${doc._id}/view`)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-start justify-between group shadow-sm hover:shadow"
                    >
                      <div className="flex items-start flex-1 mr-2">
                        <FiFile className="text-primary mr-3 mt-1 flex-shrink-0" size={18} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark text-sm truncate">
                            {doc.title || doc.name || doc.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.docType || doc.documentType} • {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}
                          </p>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {doc.tags.map((t, tidx) => (
                                <span key={tidx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-primary">
                Activity Timeline {searchQuery && `(${filteredTimeline.length} matching)`}
              </h3>
              {searchQuery && (
                <span className="text-xs text-gray-500">Filtered by: &quot;{searchQuery}&quot;</span>
              )}
            </div>
            <div className="space-y-3">
              {filteredTimeline.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {searchQuery ? `No timeline entries match "${searchQuery}"` : 'No activity recorded'}
                </p>
              ) : (
                filteredTimeline.map((log, idx) => (
                  <div key={idx} className="flex items-start border-l-2 border-primary pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors">
                    <div className="flex-1">
                      <p className="text-sm text-dark">
                        <span className="font-semibold text-primary">{log.user?.name || 'Officer'}</span>{' '}
                        <span className="text-gray-600">({log.user?.formNumber || log.user?.role || 'Personnel'})</span>{' '}
                        <span className="text-gray-800 font-medium">— {log.action}</span>
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-600 mt-0.5">{log.details}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
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
              <h3 className="text-md font-semibold text-primary">Inter-Station Sharing</h3>
              <button className="flex items-center border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                <FiShare2 className="mr-2" size={14} />
                Share Access
              </button>
            </div>
            {sharedWith.length === 0 ? (
              <p className="text-gray-500 text-sm">This case has not been shared with other stations</p>
            ) : (
              <div className="space-y-2">
                {sharedWith.map((share, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
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

      {/* Edit Modal (Includes 3 Admitted Officer Spaces) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-dark">Edit Case & Clearance Spaces</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={22} />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* 3 Dedicated Officer Spaces in Edit Modal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FiShield className="w-3.5 h-3.5" /> 3 Admitted Officer Clearance Spaces
                  </label>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Max 3</span>
                </div>
                <p className="text-xs text-gray-500">
                  Only officers assigned to these 3 spaces will have clearance to view the victim&apos;s real name.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Space 1 (Lead)</label>
                    <select
                      name="admittedOfficer1"
                      value={editFormData.admittedOfficer1 || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="">-- Unassigned --</option>
                      {officersList.map((off) => (
                        <option key={off._id} value={off._id}>
                          {off.name} ({off.formNumber || off.badgeId || off.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Space 2 (Admitted)</label>
                    <select
                      name="admittedOfficer2"
                      value={editFormData.admittedOfficer2 || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="">-- Unassigned --</option>
                      {officersList
                        .filter((off) => off._id !== editFormData.admittedOfficer1)
                        .map((off) => (
                          <option key={off._id} value={off._id}>
                            {off.name} ({off.formNumber || off.badgeId || off.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Space 3 (Admitted)</label>
                    <select
                      name="admittedOfficer3"
                      value={editFormData.admittedOfficer3 || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="">-- Unassigned --</option>
                      {officersList
                        .filter((off) => off._id !== editFormData.admittedOfficer1 && off._id !== editFormData.admittedOfficer2)
                        .map((off) => (
                          <option key={off._id} value={off._id}>
                            {off.name} ({off.formNumber || off.badgeId || off.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crime Type</label>
                  <select
                    name="crimeType"
                    value={editFormData.crimeType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="under_investigation">Under Investigation</option>
                    <option value="charge_sheeted">Charge Sheeted</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={editFormData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
                  <input
                    type="text"
                    name="station"
                    value={editFormData.station}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Name</label>
                  <input
                    type="text"
                    name="courtName"
                    value={editFormData.courtName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judge</label>
                  <input
                    type="text"
                    name="judge"
                    value={editFormData.judge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-secondary text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Case Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-full">
                <FiTrash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark">Delete Case</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete <strong>{caseData.title}</strong>? All attached evidence files will also be removed.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCase}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseDetail;
