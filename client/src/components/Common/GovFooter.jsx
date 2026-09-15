import { FiShield, FiExternalLink, FiLock, FiCheckCircle } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';

export default function GovFooter() {
  return (
    <footer className="w-full bg-[#071326] text-gray-400 border-t border-[#1c2e4a] text-xs mt-12 font-sans">
      {/* Tricolor Accent Bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-left">
          {/* Col 1: System Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
              <FiShield className="text-[#d4af37]" />
              <span>PRATIBANDH EVIDENCE PORTAL</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              National Digital Evidence Management & Tamper-Evident Forensic Chain of Custody System under the Ministry of Home Affairs, Government of India.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-green-950/80 border border-green-500/40 text-green-300">
                <FiCheckCircle className="w-2.5 h-2.5" /> SECURE NODE ACTIVE
              </span>
            </div>
          </div>

          {/* Col 2: Legal & Statutory Compliance */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-gray-700/60 pb-1">
              Statutory Compliance
            </h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center gap-1.5">
                <span className="text-[#d4af37]">•</span> Section 65B, Indian Evidence Act, 1872
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#d4af37]">•</span> Information Technology Act, 2000
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#d4af37]">•</span> ISO/IEC 27001 Information Security
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#d4af37]">•</span> CCTNS Interoperability Guidelines
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Government Portals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-gray-700/60 pb-1">
              National Portals
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <span>National Portal of India (india.gov.in)</span>
                  <FiExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <span>National Cyber Crime Reporting Portal</span>
                  <FiExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://digitalindia.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <span>Digital India Programme</span>
                  <FiExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <span>National Informatics Centre (NIC)</span>
                  <FiExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Repository & Technical Specifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-gray-700/60 pb-1">
              Source & Repository
            </h4>
            <p className="text-xs text-gray-400">
              Open investigation codebase with automated AI OCR, Facial Recognition, and Immutable SHA-256 Audit Trail.
            </p>
            <a
              href="https://github.com/soyam-panda"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14284b] hover:bg-[#1e3a6c] text-white border border-[#2b4c85] transition-all font-semibold text-xs shadow-sm group"
            >
              <FaGithub className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>GitHub Repository</span>
              <FiExternalLink className="w-3 h-3 text-blue-300" />
            </a>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-[#1a2c47] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <p>© 2026 Ministry of Home Affairs, Government of India. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-300">
              <FiLock className="w-3 h-3 text-[#d4af37]" /> SHA-256 Cryptographic Vault
            </span>
            <span>•</span>
            <span>Portal Version: 2.4.0 (Gov-Build)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
