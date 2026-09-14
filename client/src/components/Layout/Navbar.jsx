import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiSearch, FiBell, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white h-16 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6 shadow-md">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <FiMenu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <FiShield size={24} className="text-white" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-wide">PRATIBANDH</h1>
            <p className="text-[10px] text-white/60 leading-none hidden sm:block">
              Secure Document Management
            </p>
          </div>
        </div>
      </div>

      {/* Center search */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center bg-white/10 rounded-lg overflow-hidden max-w-md w-full mx-8"
      >
        <span className="pl-3 text-white/50">
          <FiSearch size={16} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cases, documents..."
          className="bg-transparent text-white placeholder-white/40 text-sm py-2 px-3 w-full outline-none"
        />
      </form>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Notifications"
        >
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
        </button>

        {user && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
