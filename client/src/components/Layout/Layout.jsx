import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-light">
      <Navbar onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="pt-16 lg:pl-60 transition-all duration-300">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
