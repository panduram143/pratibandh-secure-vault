import { useState, useEffect } from 'react';
import { FiShield, FiClock, FiLock } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';

export default function GovHeader() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as IST (Indian Standard Time)
      const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setCurrentTime(now.toLocaleString('en-IN', options) + ' IST');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#08152c] text-white select-none border-b border-[#1c2e4a] text-[11px] font-sans">
      {/* Tricolor National Ribbon Accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Government of India & Ministry Branding */}
        <div className="flex items-center gap-3">
          {/* Ashoka Lion Emblem / State Insignia SVG */}
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-6 text-[#d4af37]"
              viewBox="0 0 24 28"
              fill="currentColor"
              aria-label="Government Emblem"
            >
              <path d="M12 1L8 5h8L12 1zm0 5C8.5 6 6 8.5 6 12v3l-2 2v2h16v-2l-2-2v-3c0-3.5-2.5-6-6-6zm-4 7c0-2.2 1.8-4 4-4s4 1.8 4 4v3H8v-3zm4 9c-3 0-5.5 1.5-6 3.5h12c-.5-2-3-3.5-6-3.5z" />
            </svg>
            <div className="leading-tight">
              <div className="font-bold text-gray-100 flex items-center gap-1.5 tracking-wide">
                <span>भारत सरकार</span>
                <span className="text-gray-400">|</span>
                <span>GOVERNMENT OF INDIA</span>
              </div>
              <div className="text-[10px] text-[#93a9c7] flex items-center gap-1">
                <span>गृह मंत्रालय</span>
                <span>•</span>
                <span>Ministry of Home Affairs — National Forensic Vault</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Security Classification Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#102444] border border-[#234273] text-[#d4af37]">
          <FiLock className="w-3 h-3 text-[#d4af37]" />
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
            RESTRICTED // LAW ENFORCEMENT & EVIDENCE VAULT
          </span>
        </div>

        {/* Right: Live IST Clock & GitHub Link */}
        <div className="flex items-center gap-4 text-gray-300">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-gray-200">
            <FiClock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{currentTime || 'Loading IST...'}</span>
          </div>

          <a
            href="https://github.com/soyam-panda"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors text-[10px] font-semibold border border-white/15"
            title="View Source Code on GitHub"
          >
            <FaGithub className="w-3 h-3" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
