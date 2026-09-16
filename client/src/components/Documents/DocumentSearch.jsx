import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiFile,
  FiFolder,
  FiFilter,
  FiArrowRight,
  FiShield,
  FiClock,
  FiEye,
  FiLock,
  FiCopy,
  FiCheck,
  FiX,
  FiTag,
  FiAlertTriangle,
  FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function DocumentSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ cases: [], documents: [], totalCases: 0, totalDocuments: 0 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    crimeType: searchParams.get('crimeType') || 'all',
    docType: searchParams.get('docType') || 'all',
    status: searchParams.get('status') || 'all',
  });

  const handleSearch = useCallback(
    async (searchQuery, currentFilters = filters) => {
      if (!searchQuery.trim() && currentFilters.crimeType === 'all' && currentFilters.docType === 'all' && currentFilters.status === 'all') {
        setResults({ cases: [], documents: [], totalCases: 0, totalDocuments: 0 });
        setSearched(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (currentFilters.type && currentFilters.type !== 'all') params.append('type', currentFilters.type);
        if (currentFilters.crimeType && currentFilters.crimeType !== 'all') params.append('crimeType', currentFilters.crimeType);
        if (currentFilters.docType && currentFilters.docType !== 'all') params.append('docType', currentFilters.docType);
        if (currentFilters.status && currentFilters.status !== 'all') params.append('status', currentFilters.status);

        const res = await api.get(`/search?${params.toString()}`);
        setResults(res.data.results || { cases: [], documents: [], totalCases: 0, totalDocuments: 0 });
        setSearched(true);
      } catch (err) {
        console.error('Forensic search error:', err);
        toast.error('Search request failed. Please check network connection.');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (initialQuery || filters.crimeType !== 'all' || filters.docType !== 'all' || filters.status !== 'all') {
      handleSearch(initialQuery, filters);
    }
  }, [initialQuery, filters, handleSearch]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (query.trim()) newParams.q = query.trim();
    if (filters.type !== 'all') newParams.type = filters.type;
    if (filters.crimeType !== 'all') newParams.crimeType = filters.crimeType;
    if (filters.docType !== 'all') newParams.docType = filters.docType;
    if (filters.status !== 'all') newParams.status = filters.status;

    setSearchParams(newParams);
    handleSearch(query, filters);
  };

  const applyQuickPreset = (presetQuery, overrideFilters = {}) => {
    const updatedFilters = { ...filters, ...overrideFilters };
    setQuery(presetQuery);
    setFilters(updatedFilters);
    setSearchParams({ q: presetQuery });
    handleSearch(presetQuery, updatedFilters);
  };

  const handleCopyId = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const highlightMatch = (text, match) => {
    if (!match || !text || typeof text !== 'string') return text || '';
    const parts = text.split(new RegExp(`(${match.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <mark key={i} className="bg-[#fef08a] text-gray-950 px-1 py-0.2 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getDocTypeBadge = (docType) => {
    const dt = (docType || '').toLowerCase();
    let bg = 'bg-blue-100 text-blue-900 border-blue-300';
    if (dt.includes('fir')) bg = 'bg-red-100 text-red-900 border-red-300';
    if (dt.includes('forensic')) bg = 'bg-purple-100 text-purple-900 border-purple-300';
    if (dt.includes('charge')) bg = 'bg-amber-100 text-amber-900 border-amber-300';
    if (dt.includes('witness')) bg = 'bg-teal-100 text-teal-900 border-teal-300';
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${bg}`}>
        {docType?.replace('_', ' ') || 'EVIDENCE'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open') return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-100 text-green-800 border border-green-300">OPEN</span>;
    if (s === 'under_investigation') return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">INVESTIGATING</span>;
    if (s === 'charge_sheeted') return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300">CHARGE SHEETED</span>;
    if (s === 'closed') return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-300">CLOSED</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">{status}</span>;
  };

  const totalCases = results.cases?.length || 0;
  const totalDocs = results.documents?.length || 0;
  const totalMatches = totalCases + totalDocs;

  return (
    <div className="space-y-6 font-sans text-gray-800 max-w-7xl mx-auto pb-12">
      {/* Official Government Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1b38] via-[#102b59] to-[#0a1b38] text-white p-6 rounded-2xl border border-[#1e3e78] shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-5 pointer-events-none text-white">
          <FiSearch size={180} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                <FiLock className="w-3 h-3" /> NATIONAL FORENSIC VAULT
              </span>
              <span className="text-xs text-gray-300 font-mono">
                SEC 65B CROSS-STATION DISCOVERY
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FiSearch className="text-[#d4af37]" />
              Unified Forensic Search & Evidentiary Index
            </h1>

            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Deep indexing across encrypted FIR dossiers, OCR extracted text, suspect records, case IDs, judge filings, and digital evidence chains.
            </p>
          </div>

          {searched && (
            <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-3 rounded-xl shrink-0">
              <div className="text-center">
                <span className="text-xs text-gray-400 block font-mono">Cases</span>
                <span className="text-lg font-bold font-mono text-blue-300">{totalCases}</span>
              </div>
              <div className="h-7 w-px bg-white/15" />
              <div className="text-center">
                <span className="text-xs text-gray-400 block font-mono">Documents</span>
                <span className="text-lg font-bold font-mono text-purple-300">{totalDocs}</span>
              </div>
              <div className="h-7 w-px bg-white/15" />
              <div className="text-center">
                <span className="text-xs text-gray-400 block font-mono">Total</span>
                <span className="text-lg font-bold font-mono text-[#d4af37]">{totalMatches}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Search Input & Presets */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <form onSubmit={onSearchSubmit} className="relative">
          <div className="flex rounded-xl overflow-hidden border-2 border-[#16376d] focus-within:border-blue-500 shadow-md transition-all">
            <div className="flex items-center pl-4 bg-white text-gray-400">
              <FiSearch size={22} className="text-[#0a1b38]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, suspect name, Case ID (CASE-2026-...), Form No, FIR, or OCR snippet..."
              className="w-full px-4 py-3.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults({ cases: [], documents: [], totalCases: 0, totalDocuments: 0 });
                  setSearched(false);
                  setSearchParams({});
                }}
                className="px-3 text-gray-400 hover:text-gray-700 bg-white"
                title="Clear Search"
              >
                <FiX size={18} />
              </button>
            )}
            <button
              type="submit"
              className="bg-[#0a1b38] hover:bg-[#142f5e] text-white px-7 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-l border-[#1e4482]"
            >
              <FiSearch className="w-4 h-4 text-[#d4af37]" />
              <span>Search Vault</span>
            </button>
          </div>
        </form>

        {/* Quick Discovery Presets Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-gray-500 font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <FiTag className="text-[#d4af37]" /> Quick Filters:
          </span>
          <button
            type="button"
            onClick={() => applyQuickPreset('cybercrime', { crimeType: 'cybercrime' })}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-200 transition-colors"
          >
            Cybercrime Cases
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('fir', { docType: 'fir' })}
            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 font-medium border border-red-200 transition-colors"
          >
            FIR Records
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('forensic', { docType: 'forensic_report' })}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium border border-purple-200 transition-colors"
          >
            Forensic Reports
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('murder', { crimeType: 'murder' })}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-medium border border-rose-200 transition-colors"
          >
            Homicide
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('fraud', { crimeType: 'fraud' })}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium border border-amber-200 transition-colors"
          >
            Financial Fraud
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('25110377')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium border border-emerald-200 transition-colors font-mono"
          >
            Officer: 25110377
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center text-xs">
          {/* Scope selection */}
          <div className="flex items-center gap-1.5 font-semibold text-gray-700">
            <FiFilter className="text-blue-700" />
            <span>Scope:</span>
          </div>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => {
                const updated = { ...filters, type: 'all' };
                setFilters(updated);
                handleSearch(query, updated);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filters.type === 'all' ? 'bg-[#0a1b38] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Records
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = { ...filters, type: 'cases' };
                setFilters(updated);
                handleSearch(query, updated);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filters.type === 'cases' ? 'bg-[#0a1b38] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cases Only ({totalCases})
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = { ...filters, type: 'documents' };
                setFilters(updated);
                handleSearch(query, updated);
              }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                filters.type === 'documents' ? 'bg-[#0a1b38] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Documents Only ({totalDocs})
            </button>
          </div>

          {/* Crime Type Dropdown */}
          <select
            value={filters.crimeType}
            onChange={(e) => {
              const updated = { ...filters, crimeType: e.target.value };
              setFilters(updated);
              handleSearch(query, updated);
            }}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Crime Types</option>
            <option value="cybercrime">Cybercrime</option>
            <option value="fraud">Fraud & Financial</option>
            <option value="murder">Murder / Homicide</option>
            <option value="theft">Theft & Burglary</option>
            <option value="kidnapping">Kidnapping</option>
            <option value="assault">Assault</option>
            <option value="drug_trafficking">Narcotics & Drugs</option>
            <option value="corruption">Corruption</option>
            <option value="other">Other Offenses</option>
          </select>

          {/* Document Type Dropdown */}
          <select
            value={filters.docType}
            onChange={(e) => {
              const updated = { ...filters, docType: e.target.value };
              setFilters(updated);
              handleSearch(query, updated);
            }}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Document Types</option>
            <option value="fir">First Information Report (FIR)</option>
            <option value="charge_sheet">Charge Sheet</option>
            <option value="evidence">Digital Evidence</option>
            <option value="forensic_report">Forensic Lab Report</option>
            <option value="witness_statement">Witness Statement</option>
            <option value="court_filing">Court Filing</option>
            <option value="investigation_report">Investigation Report</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => {
              const updated = { ...filters, status: e.target.value };
              setFilters(updated);
              handleSearch(query, updated);
            }}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Case Statuses</option>
            <option value="open">Open</option>
            <option value="under_investigation">Under Investigation</option>
            <option value="charge_sheeted">Charge Sheeted</option>
            <option value="closed">Closed</option>
          </select>

          {(filters.crimeType !== 'all' || filters.docType !== 'all' || filters.status !== 'all' || filters.type !== 'all' || query) && (
            <button
              type="button"
              onClick={() => {
                const reset = { type: 'all', crimeType: 'all', docType: 'all', status: 'all' };
                setFilters(reset);
                setQuery('');
                setSearchParams({});
                setResults({ cases: [], documents: [], totalCases: 0, totalDocuments: 0 });
                setSearched(false);
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0a1b38] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-gray-500">Querying National Cryptographic Database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Case Records Matches */}
          {(filters.type === 'all' || filters.type === 'cases') && results.cases && results.cases.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-[#0a1b38]">
                    <FiFolder className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Investigation Cases ({results.cases.length})
                    </h2>
                    <p className="text-xs text-gray-500">Registered case dossiers matching search criteria</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.cases.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/cases/${c._id}`)}
                    className="p-4 rounded-xl bg-gray-50/80 hover:bg-blue-50/40 border border-gray-200 transition-all cursor-pointer group space-y-2.5 relative hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={(e) => handleCopyId(e, c.caseId || c.caseNumber)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#0a1b38] bg-blue-100 px-2 py-0.5 rounded border border-blue-300 hover:bg-blue-200 transition-colors"
                            title="Click to copy Case ID"
                          >
                            {c.caseId || c.caseNumber}
                            {copiedId === (c.caseId || c.caseNumber) ? (
                              <FiCheck className="w-3 h-3 text-green-700" />
                            ) : (
                              <FiCopy className="w-3 h-3 text-gray-500" />
                            )}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                            {c.crimeType?.replace('_', ' ') || 'General'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                          {highlightMatch(c.title, query)}
                        </h3>
                      </div>

                      {getStatusBadge(c.status)}
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {highlightMatch(c.description || 'No detailed synopsis recorded.', query)}
                    </p>

                    {/* Metadata Badges */}
                    <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 font-mono">
                      <div className="flex items-center gap-2">
                        {c.suspect?.name && (
                          <span className="text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            Suspect: {highlightMatch(c.suspect.name, query)}
                          </span>
                        )}
                        {c.station && <span>Station: {c.station}</span>}
                      </div>

                      <div className="flex items-center gap-1 text-blue-700 font-bold font-sans group-hover:translate-x-0.5 transition-transform">
                        <span>Open Case</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Document & OCR Artifacts Matches */}
          {(filters.type === 'all' || filters.type === 'documents') && results.documents && results.documents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-50 text-purple-900">
                    <FiFile className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Evidence Documents & OCR Records ({results.documents.length})
                    </h2>
                    <p className="text-xs text-gray-500">Cryptographically sealed digital evidence files & text transcripts</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {results.documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/documents/${doc._id}/view`)}
                    className="p-4 rounded-xl bg-gray-50/80 hover:bg-purple-50/40 border border-gray-200 transition-all cursor-pointer group space-y-2.5 hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                          <FiFile className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900 group-hover:text-purple-900 transition-colors">
                              {highlightMatch(doc.title || doc.originalName || 'Untitled Document', query)}
                            </h3>
                            {getDocTypeBadge(doc.docType || doc.documentType)}
                          </div>
                          <p className="text-[11px] text-gray-500 font-mono">
                            FILE: {doc.originalName || doc.title} • {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span
                          onClick={(e) => handleCopyId(e, doc.docId || doc._id)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-200 transition-colors"
                          title="Copy Document ID"
                        >
                          {doc.docId || String(doc._id).substring(0, 10)}
                          <FiCopy className="w-3 h-3 text-gray-400" />
                        </span>

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-300">
                          <FiLock className="w-2.5 h-2.5" /> SEALED
                        </span>
                      </div>
                    </div>

                    {/* OCR Text Snippet if matched */}
                    {doc.ocrSnippet && (
                      <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-gray-800 font-mono space-y-1">
                        <div className="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1">
                          <FiEye className="w-3 h-3" /> OCR Matched Snippet:
                        </div>
                        <p className="text-[11px] text-gray-700 leading-relaxed italic">
                          "{highlightMatch(doc.ocrSnippet, query)}"
                        </p>
                      </div>
                    )}

                    {/* Parent Case Reference & Action Button */}
                    <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                      <div className="flex items-center gap-2">
                        {doc.case && (
                          <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            Attached Case: <strong className="text-blue-900">{doc.case.caseId || doc.case.title}</strong>
                          </span>
                        )}
                        {doc.uploadedBy?.name && (
                          <span className="flex items-center gap-1">
                            <FiUser className="w-3 h-3 text-gray-400" />
                            Officer: {doc.uploadedBy.name} ({doc.uploadedBy.formNumber || '25110377'})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>View Evidence with Spotlight Anti-Screenshot</span>
                        <FiArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zero Results State */}
          {searched && totalMatches === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <FiSearch size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">No Forensic Records Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  No encrypted case files or evidence artifacts matched "{query || 'selected filters'}".
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ type: 'all', crimeType: 'all', docType: 'all', status: 'all' });
                    setQuery('');
                    handleSearch('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0a1b38] hover:bg-[#142f5e] text-white font-bold transition-colors"
                >
                  Show All Available Records
                </button>
              </div>
            </div>
          )}

          {/* Initial Pre-Search State */}
          {!searched && (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0a1b38] flex items-center justify-center mx-auto">
                <FiShield size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Ready for Forensic Investigation</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Enter an investigation term, suspect name, FIR number, or select a legal filter above to search the national evidence repository.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
