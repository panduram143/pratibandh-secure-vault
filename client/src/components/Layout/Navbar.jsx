import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiShield,
  FiSearch,
  FiBell,
  FiLogOut,
  FiMenu,
  FiUser,
  FiLock
} from 'react-icons/fi';
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
    <nav className="bg-[#0b1c3d] text-white h-16 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-6 shadow-xl border-b border-[#1c335e]">
      {/* Left section: Emblem & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
          aria-label="Toggle menu"
        >
          <FiMenu size={20} />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0d2a58] to-[#1e4a8a] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow-md group-hover:border-[#d4af37] transition-all">
            <FiShield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black leading-tight tracking-wider text-white">
                PRATIBANDH
              </h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3da82]">
                GOV-SEC
              </span>
            </div>
            <p className="text-[10px] text-gray-300 leading-none hidden sm:block font-medium">
              National Digital Evidence & Case Management System
            </p>
          </div>
        </Link>
      </div>

      {/* Center Search Bar */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center bg-[#071326] border border-[#203a66] rounded-xl overflow-hidden max-w-md w-full mx-6 shadow-inner focus-within:border-blue-400 transition-colors"
      >
        <span className="pl-3.5 text-gray-400">
          <FiSearch size={15} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search investigation cases, evidence files, form numbers..."
          className="bg-transparent text-white placeholder-gray-400 text-xs py-2 px-3 w-full outline-none"
        />
      </form>

      {/* Right Section: Clearance Badge, User & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Security Level Tag */}
        <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-950/60 border border-green-500/40 text-green-300 text-[10px] font-mono font-bold">
          <FiLock className="w-3 h-3 text-green-400" />
          <span>LEVEL-3 AUTHORIZED</span>
        </div>

        {/* User Card */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0e244d] border border-[#23457a]">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[9px] font-mono text-[#d4af37] uppercase">
                {user.formNumber || user.role}
              </span>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-500/30"
          aria-label="Logout"
          title="Logout from System"
        >
          <FiLogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
