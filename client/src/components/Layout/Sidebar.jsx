import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiFile,
  FiUpload,
  FiSearch,
  FiShield,
  FiUsers,
  FiUserCheck
} from 'react-icons/fi';
import { BiBarcodeReader } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const isAdmin =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'station_admin' ||
    user?.formNumber === '25110377' ||
    user?.badgeId === '25110377';

  const navItems = [
    { label: 'Dashboard', icon: FiGrid, path: '/' },
    { label: 'AI ID Verification', icon: BiBarcodeReader, path: '/login' },
    { label: 'Cases & FIRs', icon: FiFolder, path: '/cases' },
    { label: 'Evidence Vault', icon: FiFile, path: '/documents' },
    { label: 'Upload Evidence', icon: FiUpload, path: '/documents/upload' },
    { label: 'Forensic Search', icon: FiSearch, path: '/search' },
    { label: 'Authorized Personnel', icon: FiUserCheck, path: '/admin/personnel', adminOnly: true },
    { label: 'Audit Trail & Charts', icon: FiShield, path: '/audit', adminOnly: true },
    { label: 'Multi-Agency Collab', icon: FiUsers, path: '/collaboration' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-[#08152c] text-gray-200 z-40 flex flex-col justify-between border-r border-[#192b49] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 font-sans`}
      >
        <div className="flex-1 overflow-y-auto py-4">
          {/* Section: Main Navigation */}
          <div className="px-4 mb-2">
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-400">
              CORE NAVIGATION
            </p>
          </div>

          <ul className="space-y-1 px-2.5">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;

              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#153464] text-white font-bold border-l-4 border-[#d4af37] shadow-md'
                          : 'hover:bg-white/5 text-gray-300 hover:text-white border-l-4 border-transparent'
                      }`
                    }
                  >
                    <Icon size={17} className="text-blue-300 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Official Footer Branding */}
        <div className="p-3.5 border-t border-[#192b49] bg-[#061022] text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-300">
            <FiShield className="text-[#d4af37]" />
            <span>Ministry of Home Affairs</span>
          </div>
          <p className="text-[9px] text-gray-400 leading-tight">
            Government of India • NIC CCTNS Node
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
