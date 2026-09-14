import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiZoomIn, FiZoomOut, FiLock, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // prevent print, save shortcuts, right click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
        e.preventDefault();
        toast.error('Action prohibited: Security restrictions active');
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast.error('Screen capture prohibited');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setDocumentData(res.data.document || res.data);
    } catch (err) {
      console.error('Failed to load document:', err);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // Draw on Canvas: base document + blur effect + spotlight + dynamic forensic watermark
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 800 * zoom;
    const height = 1100 * zoom;

    canvas.width = width;
    canvas.height = height;

    // Create offscreen canvas for the sharp document
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');

    // Draw Document on offscreen canvas (sharp version)
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0, 0, width, height);

    // Document header border
    offCtx.strokeStyle = '#1a237e';
    offCtx.lineWidth = 3 * zoom;
    offCtx.strokeRect(30 * zoom, 30 * zoom, width - 60 * zoom, height - 60 * zoom);

    // Inner header
    offCtx.fillStyle = '#1a237e';
    offCtx.font = `bold ${16 * zoom}px Inter, sans-serif`;
    offCtx.textAlign = 'center';
    offCtx.fillText('GOVERNMENT OF INDIA - MINISTRY OF HOME AFFAIRS', width / 2, 70 * zoom);
    offCtx.font = `${12 * zoom}px Inter, sans-serif`;
    offCtx.fillStyle = '#666666';
    offCtx.fillText('CENTRAL INVESTIGATION AND FORENSIC VAULT', width / 2, 95 * zoom);

    // Divider line
    offCtx.strokeStyle = '#cccccc';
    offCtx.lineWidth = 1;
    offCtx.beginPath();
    offCtx.moveTo(50 * zoom, 115 * zoom);
    offCtx.lineTo(width - 50 * zoom, 115 * zoom);
    offCtx.stroke();

    // Document Metadata
    offCtx.textAlign = 'left';
    offCtx.fillStyle = '#111827';
    offCtx.font = `bold ${14 * zoom}px Inter, sans-serif`;
    offCtx.fillText(`CLASSIFICATION: ${documentData?.docType || documentData?.documentType || 'OFFICIAL REPORT'}`, 60 * zoom, 150 * zoom);
    offCtx.font = `${12 * zoom}px Inter, sans-serif`;
    offCtx.fillStyle = '#374151';
    offCtx.fillText(`RECORD ID: ${documentData?._id || 'IND-2026-X8921'}`, 60 * zoom, 175 * zoom);
    offCtx.fillText(`DOCUMENT TITLE: ${documentData?.title || documentData?.name || 'INCIDENT_INVESTIGATION_DOSSIER.PDF'}`, 60 * zoom, 200 * zoom);
    offCtx.fillText(`DATE OF ENTRY: ${new Date(documentData?.createdAt || documentData?.uploadedAt || Date.now()).toLocaleDateString()}`, 60 * zoom, 225 * zoom);

    // Horizontal Rule
    offCtx.beginPath();
    offCtx.moveTo(60 * zoom, 245 * zoom);
    offCtx.lineTo(width - 60 * zoom, 245 * zoom);
    offCtx.stroke();

    // Body Text Simulation
    offCtx.font = `${11 * zoom}px Inter, monospace`;
    offCtx.fillStyle = '#1f2937';

    const sampleLines = [
      'SECTION 1: INCIDENT OVERVIEW',
      'At 0400 hours on the date specified, surveillance sensors recorded anomalous activity',
      'in Sector 7 repository. Primary response unit dispatched under standard protocol 44-B.',
      'Upon arrival, physical security seals were verified intact. Digital logs indicated',
      'unauthorized read attempts targeting encrypted sub-vault Bravo.',
      '',
      'SECTION 2: FORENSIC ACQUISITION & CHAIN OF CUSTODY',
      'Digital artifacts extracted using write-blocker hardware hash SHA-256:',
      '9f83c18b76c810d7a7b8e5c3e8a4f6d1c9b2a5e8d7c4f1a3b6e9d2c5a8b1e4f7.',
      'Evidence container transferred to forensic repository under seal #008912.',
      '',
      'SECTION 3: WITNESS DEPOSITIONS & STATEMENTS',
      'Officer on duty stated that routine verification was completed at 0200 hours.',
      'No irregularities were detected prior to the automated perimeter threshold alert.',
      'Cross-examination confirmed biometric validation logs match registry credentials.',
      '',
      'SECTION 4: PRELIMINARY CONCLUSIONS',
      'Investigation remains ongoing. Access restricted to authorized personnel under Section 69A.',
      'Unauthorized reproduction, dissemination, or viewing is punishable under IT Act 2000.',
    ];

    let yPos = 280 * zoom;
    sampleLines.forEach((line) => {
      offCtx.fillText(line, 60 * zoom, yPos);
      yPos += 22 * zoom;
    });

    // Now draw to main canvas with blur effect
    const radius = 130 * zoom;

    // Draw blurred version of document
    ctx.filter = 'blur(10px)';
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.filter = 'none';

    // If mouse is hovering, draw spotlight (sharp circular area)
    if (isHovered && mousePos.x > 0 && mousePos.y > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2, false);
      ctx.clip();

      // Draw sharp version in the spotlight
      ctx.drawImage(offscreenCanvas, 0, 0);

      ctx.restore();

      // Draw spotlight border
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2, false);
      ctx.strokeStyle = 'rgba(26, 35, 126, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Forensic Watermark Layer (Always across the view)
    ctx.save();
    ctx.rotate((-25 * Math.PI) / 180);
    ctx.font = `bold ${14 * zoom}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(198, 40, 40, 0.15)';

    const watermarkText = `CONFIDENTIAL • ${user?.name?.toUpperCase() || 'OFFICER'} • BADGE: ${user?.badgeId || 'ID-7821'} • ${new Date().toISOString()}`;

    for (let x = -width; x < width * 2; x += 350 * zoom) {
      for (let y = -height; y < height * 2; y += 140 * zoom) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();

  }, [documentData, zoom, mousePos, isHovered, user]);

  const isDocOwner = Boolean(
    user && documentData && (
      user._id === (documentData.uploadedBy?._id || documentData.uploadedBy) ||
      user.role === 'super_admin'
    )
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted successfully');
      navigate('/documents');
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error(err.response?.data?.msg || 'Failed to delete document');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsHovered(true);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: -1000, y: -1000 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 select-none">
      {/* Top Header / Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-dark">{documentData?.title || documentData?.name || 'Document Viewer'}</h1>
            <p className="text-xs text-gray-500">
              {documentData?.docType || documentData?.documentType || 'Official Document'} • Classification: Restricted
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((prev) => Math.max(0.7, prev - 0.1))}
            className="p-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 text-sm"
            title="Zoom Out"
          >
            <FiZoomOut size={16} />
          </button>
          <span className="text-xs text-gray-600 font-medium px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((prev) => Math.min(1.5, prev + 0.1))}
            className="p-2 border border-gray-300 rounded hover:bg-gray-100 text-gray-700 text-sm"
            title="Zoom In"
          >
            <FiZoomIn size={16} />
          </button>

          {isDocOwner && (
            <>
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 text-xs font-medium transition-colors"
                title="Only the uploader can delete this document"
              >
                <FiTrash2 className="mr-1.5" size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded flex items-center justify-between text-xs text-amber-800">
        <div className="flex items-center">
          <FiAlertTriangle className="mr-2 text-amber-600 flex-shrink-0" size={16} />
          <span>
            <strong>CONFIDENTIAL ACCESS:</strong> Dynamic forensic watermark active for{' '}
            <strong>{user?.name}</strong> (Badge: {user?.badgeId || 'N/A'}). Screenshots and downloads are strictly prohibited and logged.
          </span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[10px] text-amber-700">
          <FiLock size={12} />
          <span>AES-256 ENCRYPTED</span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="bg-gray-900 rounded-lg p-6 flex justify-center items-center overflow-auto min-h-[600px] border border-gray-800"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="shadow-2xl cursor-crosshair rounded bg-white"
        />
      </div>

      {/* Delete Document Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-dark">Delete Document</h3>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete document <strong className="text-dark font-semibold">{documentData?.title || documentData?.originalName || 'this file'}</strong>?
            </p>
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              ⚠️ Warning: This will permanently delete the encrypted file from storage. Only the officer who uploaded this file can perform this action.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;
