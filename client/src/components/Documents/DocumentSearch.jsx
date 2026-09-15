import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiFile, FiFolder, FiFilter, FiArrowRight } from 'react-icons/fi';
import api from '../../utils/api';

function DocumentSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ documents: [], cases: [] });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    station: '',
    sortBy: 'relevance',
  });

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&type=${filters.type}`);
      setResults(res.data.results || { documents: [], cases: [] });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    handleSearch(query);
  };

  const highlightMatch = (text, match) => {
    if (!match || !text) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 text-dark px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark mb-1">Unified Search</h1>
        <p className="text-gray-600 text-sm">Search across all encrypted case files, depositions, and forensic records</p>
      </div>

      {/* Search Input */}
      <form onSubmit={onSearchSubmit} className="relative">
        <div className="flex shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:border-primary">
          <div className="flex items-center pl-4 bg-white text-gray-400">
            <FiSearch size={20} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, suspect name, case ID, or form number..."
            className="w-full px-4 py-3 text-base text-dark bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white px-6 font-medium text-sm transition-colors"
          >
            Search Vault
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-wrap gap-4 items-center text-xs">
        <div className="flex items-center text-gray-500 font-medium">
          <FiFilter className="mr-1.5" /> Scope:
        </div>
        <button
          onClick={() => setFilters({ ...filters, type: 'all' })}
          className={`px-3 py-1 rounded-full ${
            filters.type === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'cases' })}
          className={`px-3 py-1 rounded-full ${
            filters.type === 'cases' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cases Only
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'documents' })}
          className={`px-3 py-1 rounded-full ${
            filters.type === 'documents' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Documents Only
        </button>
      </div>

      {/* Results Area */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Case Results */}
          {results.cases && results.cases.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <FiFolder className="mr-2 text-primary" /> Case Records ({results.cases.length})
              </h2>
              <div className="space-y-2">
                {results.cases.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => navigate(`/cases/${c._id}`)}
                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-primary">{c.caseNumber || 'CASE-RECORD'}</span>
                        <h3 className="text-base font-medium text-dark mt-0.5">{highlightMatch(c.title, query)}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {highlightMatch(c.description, query)}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
                        {c.crimeType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Results */}
          {results.documents && results.documents.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <FiFile className="mr-2 text-primary" /> Document Artifacts ({results.documents.length})
              </h2>
              <div className="space-y-2">
                {results.documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/documents/${doc._id}/view`)}
                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-200">
                            {doc.documentType}
                          </span>
                          <span className="text-xs text-gray-400">• {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base font-medium text-dark mt-1">{highlightMatch(doc.name, query)}</h3>
                      </div>
                      <FiArrowRight className="text-gray-400 hover:text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && query && results.cases?.length === 0 && results.documents?.length === 0 && (
            <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
              <FiSearch className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-gray-700 font-medium">No results found for "{query}"</p>
              <p className="text-gray-400 text-xs mt-1">Check spelling or search using broader investigation keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentSearch;
