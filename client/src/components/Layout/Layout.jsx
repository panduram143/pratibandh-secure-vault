import { useState } from 'react';
import GovHeader from '../Common/GovHeader';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import GovFooter from '../Common/GovFooter';
import FloatingActions from '../Common/FloatingActions';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col font-sans text-gray-900 selection:bg-[#0b1c3d] selection:text-white">
      {/* Topmost Government Ribbon & Live IST Clock */}
      <GovHeader />

      {/* Main App Navbar */}
      <Navbar onToggleSidebar={toggleSidebar} />

      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 lg:pl-64 transition-all duration-300 flex flex-col justify-between">
        <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>

        {/* Official Government Footer */}
        <GovFooter />
      </main>

      {/* Little Floating Speed-Dial Buttons */}
      <FloatingActions />
    </div>
  );
}

export default Layout;
