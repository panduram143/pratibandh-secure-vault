import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiShield,
  FiFileText,
  FiPlus,
  FiArrowUp,
  FiHelpCircle,
  FiX,
  FiActivity,
  FiLayers,
  FiExternalLink,
  FiCheckCircle,
  FiLock,
  FiPhoneCall
} from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import { BiBarcodeReader } from 'react-icons/bi';

export default function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showGovModal, setShowGovModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Show scroll-to-top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const actions = [
    {
      id: 'github',
      label: 'GitHub Repository',
      icon: FaGithub,
      color: 'bg-gray-900 hover:bg-black text-white border-gray-700',
      badge: 'Code',
      action: () => {
        window.open('https://github.com/soyam-panda', '_blank', 'noopener,noreferrer');
      }
    },
    {
      id: 'audit',
      label: 'Audit Trail & Charts',
      icon: FiActivity,
      color: 'bg-[#0f274d] hover:bg-[#18396e] text-blue-200 border-blue-500/40',
      badge: 'Ledger',
      action: () => {
        navigate('/audit');
        setIsOpen(false);
      }
    },
    {
      id: 'id-scanner',
      label: 'AI ID Card Scanner',
      icon: BiBarcodeReader,
      color: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400',
      badge: 'AI Scan',
      action: () => {
        navigate('/login');
        setIsOpen(false);
      }
    },
    {
      id: 'upload-doc',
      label: 'Upload Evidence Document',
      icon: FiFileText,
      color: 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/40',
      badge: 'Upload',
      action: () => {
        navigate('/documents/upload');
        setIsOpen(false);
      }
    },
    {
      id: 'new-case',
      label: 'Create Investigation Case',
      icon: FiPlus,
      color: 'bg-indigo-700 hover:bg-indigo-600 text-white border-indigo-500/40',
      badge: 'New',
      action: () => {
        navigate('/cases/new');
        setIsOpen(false);
      }
    },
    {
      id: 'gov-help',
      label: 'National Helpline & Status',
      icon: FiHelpCircle,
      color: 'bg-amber-700 hover:bg-amber-600 text-white border-amber-500/40',
      badge: 'Help',
      action: () => {
        setShowGovModal(true);
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Floating Action Menu in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 font-sans select-none">
        {/* Scroll To Top floating button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-[#0d234a]/90 hover:bg-blue-700 text-white shadow-lg border border-blue-400/40 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 mb-1 group"
            title="Back to Top"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}

        {/* Expanded Speed-Dial Sub-buttons */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-fadeIn">
            {actions.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={item.action}
                >
                  {/* Tooltip Label */}
                  <span className="px-2.5 py-1 text-xs font-semibold bg-[#0b1c3d]/95 text-gray-100 rounded-lg shadow-xl border border-gray-700/80 backdrop-blur-md whitespace-nowrap opacity-95 transition-opacity flex items-center gap-1.5">
                    {item.label}
                    {item.badge && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/15 text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </span>

                  {/* Icon Circle Button */}
                  <button
                    type="button"
                    className={`w-11 h-11 rounded-full ${item.color} shadow-xl border flex items-center justify-center transition-all duration-200 transform group-hover:scale-110`}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white border-2 transition-all duration-300 transform hover:scale-105 ${
            isOpen
              ? 'bg-red-600 hover:bg-red-500 border-red-300 rotate-90'
              : 'bg-gradient-to-tr from-[#0b244d] via-[#1a4b8c] to-[#0f346b] hover:from-blue-700 hover:to-indigo-600 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
          }`}
          title="Government Portal Quick Actions & GitHub"
          aria-label="Toggle quick actions"
        >
          {isOpen ? (
            <FiX className="w-6 h-6" />
          ) : (
            <div className="relative flex items-center justify-center">
              <FiLayers className="w-6 h-6 text-[#f7e7a9]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF9933] rounded-full border border-white animate-pulse" />
            </div>
          )}
        </button>
      </div>

      {/* Government Support & Verification Info Modal */}
      {showGovModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1c3d] text-white border border-[#234273] rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowGovModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 border border-white/10"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Government Assistance & Verification</h3>
                <p className="text-xs text-gray-300">Pratibandh Digital Evidence Framework</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#071326] border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <FiPhoneCall className="w-4 h-4" /> National Cyber Crime Helpline
                </div>
                <p className="text-gray-300">Dial <span className="font-bold text-white font-mono text-sm">1930</span> (Toll Free 24x7) for immediate cyber financial fraud or digital evidence assistance.</p>
              </div>

              <div className="p-3 bg-[#071326] border border-gray-700 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-green-300 font-semibold">
                  <FiCheckCircle className="w-4 h-4" /> System Cryptographic Compliance
                </div>
                <p className="text-gray-300">All audit logs and case records are hashed with SHA-256 and time-stamped in compliance with Section 65B of the Indian Evidence Act.</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-gray-400">
                <span>Repository Access:</span>
                <a
                  href="https://github.com/soyam-panda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <FaGithub className="w-3.5 h-3.5" /> github.com/soyam-panda
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowGovModal(false)}
              className="w-full py-2.5 bg-[#173868] hover:bg-[#1f4b8a] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Close Information
            </button>
          </div>
        </div>
      )}
    </>
  );
}
