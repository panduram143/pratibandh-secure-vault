import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiFile,
  FiUpload,
  FiSearch,
  FiShield,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: FiGrid, path: '/' },
    { label: 'Cases', icon: FiFolder, path: '/cases' },
    { label: 'Documents', icon: FiFile, path: '/documents' },
    { label: 'Upload', icon: FiUpload, path: '/documents/upload' },
    { label: 'Search', icon: FiSearch, path: '/search' },
    { label: 'Audit Trail', icon: FiShield, path: '/audit', adminOnly: true },
    { label: 'Collaboration', icon: FiUsers, path: '/collaboration' },
    { label: 'Settings', icon: FiSettings, path: '#' },
  ];

  return (
    <>
      {/* overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-16 left-0 bottom-0 w-60 bg-primary text-white z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin' && user?.role !== 'super_admin' && user?.role !== 'station_admin') return null;

              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 border-l-4 border-white font-medium'
                          : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[10px] text-white/40 text-center leading-relaxed">
            v1.0.0<br />
            Ministry of Home Affairs
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
