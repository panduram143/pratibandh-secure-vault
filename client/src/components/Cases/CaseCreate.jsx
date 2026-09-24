import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiShield, FiUserCheck, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function CaseCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [officersList, setOfficersList] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    crimeType: 'theft',
    priority: 'medium',
    station: '',
    courtName: '',
    suspectName: '',
    suspectAge: '',
    suspectGender: 'male',
    victimName: '',
    victimAge: '',
    victimGender: 'male',
    admittedOfficer1: '',
    admittedOfficer2: '',
    admittedOfficer3: '',
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/cases/officers/list');
      setOfficersList(res.data.officers || []);
    } catch (err) {
      console.warn('Could not load officers list:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const admittedOfficers = [
        formData.admittedOfficer1,
        formData.admittedOfficer2,
        formData.admittedOfficer3
      ].filter(Boolean);

      const payload = {
        title: formData.title,
        description: formData.description,
        crimeType: formData.crimeType,
        priority: formData.priority,
        station: formData.station,
        courtName: formData.courtName,
        admittedOfficers,
        assignedOfficers: admittedOfficers,
        suspects: formData.suspectName ? [{
          name: formData.suspectName,
          age: formData.suspectAge ? Number(formData.suspectAge) : undefined,
          gender: formData.suspectGender,
        }] : [],
        victims: formData.victimName ? [{
          name: formData.victimName,
          age: formData.victimAge ? Number(formData.victimAge) : undefined,
          gender: formData.victimGender,
        }] : [],
      };

      const res = await api.post('/cases', payload);
      toast.success('Case created successfully with admitted officer clearances');
      navigate(`/cases/${res.data._id || res.data.case?._id}`);
    } catch (err) {
      console.error('Error creating case:', err);
      toast.error(err.response?.data?.msg || err.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/cases')}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark">Create New Case</h1>
          <p className="text-gray-600 text-sm">Register a new formal investigation case file with dedicated officer clearance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
        <div>
          <h2 className="text-md font-semibold text-primary border-b border-gray-200 pb-2 mb-4">
            Case Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Case Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Unauthorized access to server logs at HQ"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief summary of the incident..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crime Type *
              </label>
              <select
                name="crimeType"
                value={formData.crimeType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
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
                Priority Level *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Police Station / Division
              </label>
              <input
                type="text"
                name="station"
                value={formData.station}
                onChange={handleChange}
                placeholder="e.g. Central Station, Sector 4"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designated Court Name
              </label>
              <input
                type="text"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                placeholder="e.g. District Session Court"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3 Dedicated Spaces for Admitted Officers */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#0a1b38] text-[#d4af37] flex items-center justify-center font-bold">
                <FiUserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark flex items-center gap-2">
                  Admitted Officers Clearance (3 Dedicated Spaces)
                </h2>
                <p className="text-xs text-gray-500">
                  Allocate up to 3 authorized officers who have sworn clearance for this case
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
              Max 3 Officers
            </span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <FiLock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Victim Confidentiality Protocol:</span> Only the 3 admitted officers assigned to these spaces (plus case creator & super admins) have clearance to view the victim&apos;s real name. For all other officers not admitted to this case, the victim&apos;s name will be cryptographically blacked out (<span className="font-mono bg-amber-200 px-1 py-0.5 rounded font-bold">████████</span>).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Space 1 */}
            <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Space 1 • Lead Officer
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <select
                name="admittedOfficer1"
                value={formData.admittedOfficer1}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Select Officer 1 --</option>
                {officersList.map((off) => (
                  <option key={off._id} value={off._id}>
                    {off.name} ({off.formNumber || off.badgeId || off.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Space 2 */}
            <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Space 2 • Admitted Officer
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <select
                name="admittedOfficer2"
                value={formData.admittedOfficer2}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Select Officer 2 --</option>
                {officersList
                  .filter((off) => off._id !== formData.admittedOfficer1)
                  .map((off) => (
                    <option key={off._id} value={off._id}>
                      {off.name} ({off.formNumber || off.badgeId || off.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Space 3 */}
            <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Space 3 • Admitted Officer
                </span>
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              </div>
              <select
                name="admittedOfficer3"
                value={formData.admittedOfficer3}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">-- Select Officer 3 --</option>
                {officersList
                  .filter((off) => off._id !== formData.admittedOfficer1 && off._id !== formData.admittedOfficer2)
                  .map((off) => (
                    <option key={off._id} value={off._id}>
                      {off.name} ({off.formNumber || off.badgeId || off.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-md font-semibold text-primary border-b border-gray-200 pb-2 mb-4">
            Primary Suspect Information (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="suspectName"
                value={formData.suspectName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="suspectAge"
                value={formData.suspectAge}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="suspectGender"
                value={formData.suspectGender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
            <h2 className="text-md font-semibold text-primary">
              Primary Victim Information (Confidential)
            </h2>
            <span className="text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <FiShield className="w-3 h-3" /> Confidential PII
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Victim Name</label>
              <input
                type="text"
                name="victimName"
                value={formData.victimName}
                onChange={handleChange}
                placeholder="Protected victim legal name"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="victimAge"
                value={formData.victimAge}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                name="victimGender"
                value={formData.victimGender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center bg-primary hover:bg-secondary text-white px-5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FiSave className="mr-2" />
            {loading ? 'Submitting...' : 'Register Case'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseCreate;
