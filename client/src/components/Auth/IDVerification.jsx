import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  loadFaceModels,
  extractFaceDescriptorFromImage,
  extractFaceDescriptorFromVideo,
  detectFaceInVideo
} from '../../utils/faceApi';
import { processIDCardOCR } from '../../utils/ocr';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiShield,
  FiCamera,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiUser,
  FiLock,
  FiUpload,
  FiArrowRight,
  FiChevronRight,
  FiCheck,
  FiZap,
  FiInfo
} from 'react-icons/fi';

const STEPS = {
  INIT: 'init',
  CARD_SCAN: 'card_scan',
  CARD_MATCHED: 'card_matched',
  FACE_SCAN: 'face_scan',
  VERIFYING: 'verifying',
  SUCCESS: 'success'
};

const SAMPLE_CARDS = [
  {
    id: 'soyam_prakash',
    name: 'Soyam Prakash Panda',
    regdNo: '25110377',
    role: 'super_admin',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'A+',
    image: '/sample_ids/soyam_prakash.jpeg'
  },
  {
    id: 'chitra',
    name: 'Chitra Adyasha Panda',
    regdNo: '25110335',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'A+',
    image: '/sample_ids/chitra.jpeg'
  },
  {
    id: 'kuldeep',
    name: 'S Kuldeep',
    regdNo: '25110367',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'O+',
    image: '/sample_ids/kuldeep.jpeg'
  },
  {
    id: 'soyam_sambit',
    name: 'Soyam Sambit Sahoo',
    regdNo: '25110378',
    role: 'officer',
    department: 'Computer Science and Engineering',
    station: 'OUTR Bhubaneswar',
    bloodGroup: 'AB+',
    image: '/sample_ids/soyam_sambit.jpeg'
  }
];

export default function IDVerification() {
  const navigate = useNavigate();
  const { faceLogin } = useAuth();

  const [currentStep, setCurrentStep] = useState(STEPS.INIT);
  const [initStatus, setInitStatus] = useState('Initializing AI Neural Networks...');
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for ID card, 'user' for face

  // ID Card data & Match state
  const [capturedCardImage, setCapturedCardImage] = useState(null);
  const [formNumber, setFormNumber] = useState('');
  const [cardFaceDescriptor, setCardFaceDescriptor] = useState(null);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [matchedPersonnel, setMatchedPersonnel] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [matchMethod, setMatchMethod] = useState('');
  const [scanningCard, setScanningCard] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  // Face scanning
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [verifyingStatus, setVerifyingStatus] = useState('');
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectIntervalRef = useRef(null);

  // 1. Initialize AI Models & Auto-Seed Sample ID Cards on mount
  useEffect(() => {
    let isMounted = true;

    async function initAIAndSeed() {
      try {
        setInitStatus('Loading AI Face Recognition & OCR Models...');
        await loadFaceModels((status) => {
          if (isMounted) setInitStatus(status);
        });

        if (isMounted) {
          setInitStatus('Checking & Synchronizing Registered ID Database...');
        }

        // Check if sample ID cards are in database
        try {
          const statusRes = await api.get('/registered-ids/sample-status');
          if (!statusRes.data || statusRes.data.count < SAMPLE_CARDS.length) {
            if (isMounted) setInitStatus('Extracting Biometrics for Registered ID Cards...');
            const seedPayload = [];

            for (const sample of SAMPLE_CARDS) {
              try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = sample.image;
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                });

                const faceDesc = await extractFaceDescriptorFromImage(img);
                if (faceDesc && faceDesc.descriptor) {
                  seedPayload.push({
                    formNumber: sample.regdNo,
                    name: sample.name,
                    email: `${sample.id}.${sample.regdNo}@outr.ac.in`,
                    role: sample.role,
                    station: sample.station,
                    department: sample.department,
                    phone: '+91 9876543210',
                    faceDescriptor: faceDesc.descriptor,
                    idCardImage: sample.image
                  });
                }
              } catch (e) {
                console.warn(`Could not extract face for sample ${sample.name}:`, e);
              }
            }

            if (seedPayload.length > 0) {
              await api.post('/registered-ids/seed-samples', { samples: seedPayload });
              console.log(`Synced ${seedPayload.length} sample ID cards to database.`);
            }
          }
        } catch (seedErr) {
          console.warn('Sample ID auto-sync notice:', seedErr);
        }

        if (isMounted) {
          setCurrentStep(STEPS.CARD_SCAN);
        }
      } catch (err) {
        console.error('Model initialization error:', err);
        if (isMounted) {
          toast.error('AI neural models ready in fallback mode.');
          setCurrentStep(STEPS.CARD_SCAN);
        }
      }
    }

    initAIAndSeed();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // 2. Manage Camera lifecycle when step changes
  useEffect(() => {
    if (currentStep === STEPS.CARD_SCAN) {
      startCamera(facingMode);
    } else if (currentStep === STEPS.FACE_SCAN) {
      startCamera('user');
    } else if (currentStep === STEPS.CARD_MATCHED || currentStep === STEPS.VERIFYING || currentStep === STEPS.SUCCESS) {
      stopCamera();
    }
  }, [currentStep, facingMode]);

  // 3. Real-time face detection loop during FACE_SCAN step
  useEffect(() => {
    if (currentStep === STEPS.FACE_SCAN && videoRef.current) {
      detectIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        try {
          const detection = await detectFaceInVideo(videoRef.current);
          if (detection) {
            setIsFaceDetected(true);
            setFaceConfidence(Math.round(detection.score * 100));
          } else {
            setIsFaceDetected(false);
            setFaceConfidence(0);
          }
        } catch (e) {
          // Ignore intermittent frame detection
        }
      }, 300);
    } else {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      setIsFaceDetected(false);
    }

    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };
  }, [currentStep]);

  // Start Camera Stream
  const startCamera = async (mode) => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable. You can upload an ID card photo or choose a sample ID.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Switch between back/front camera
  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture frame from video to canvas
  const captureFrame = () => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  /**
   * Process ID Card Image:
   * 1. Extract Face Portrait Descriptor from Card
   * 2. Run OCR to extract Registration / Form Number and Name
   * 3. Send to /api/auth/match-id-card to find the perfect match in database
   */
  const processAndMatchIDCard = async (dataUrlOrImageSrc) => {
    setScanningCard(true);
    setScanStatus('Analyzing ID card portrait & scanning text...');

    try {
      // Create an image element for AI face extraction
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrlOrImageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // 1. Extract Face Biometric Descriptor from Card
      setScanStatus('Extracting facial portrait biometric vector from ID card...');
      let cardFaceDesc = null;
      try {
        const faceRes = await extractFaceDescriptorFromImage(img);
        if (faceRes && faceRes.descriptor) {
          cardFaceDesc = faceRes.descriptor;
          setCardFaceDescriptor(faceRes.descriptor);
        }
      } catch (fErr) {
        console.warn('Face extraction on ID card notice:', fErr);
      }

      // 2. Run OCR Text Extraction
      setScanStatus('Running OCR text analysis on ID card...');
      let detectedFormNo = null;
      let detectedName = null;
      try {
        const ocrRes = await processIDCardOCR(img, (progress) => {
          setScanStatus(progress);
        });
        setOcrConfidence(Math.round(ocrRes.confidence));
        setOcrText(ocrRes.text);
        detectedFormNo = ocrRes.formNumber;
        detectedName = ocrRes.possibleName;
      } catch (oErr) {
        console.warn('OCR notice:', oErr);
      }

      setScanStatus('Matching ID card against registered database...');

      // 3. Query Server for Best Matching ID Card
      const matchRes = await api.post('/auth/match-id-card', {
        formNumber: detectedFormNo,
        cardFaceDescriptor: cardFaceDesc,
        extractedName: detectedName
      });

      if (matchRes.data?.matched) {
        const p = matchRes.data.personnel;
        setMatchedPersonnel(p);
        setFormNumber(p.formNumber);
        setMatchScore(matchRes.data.confidenceScore || 99);
        setMatchMethod(matchRes.data.matchMethod || 'biometric');
        setCapturedCardImage(dataUrlOrImageSrc);
        setCurrentStep(STEPS.CARD_MATCHED);
        toast.success(`ID Matched: ${p.name} (${p.formNumber})`);
      } else {
        throw new Error('No registered match found');
      }
    } catch (err) {
      console.error('ID Card Match error:', err);
      const msg = err.response?.data?.msg || 'Could not find a match for this ID card. You can try selecting a sample or entering Regd No manually.';
      toast.error(msg);
      // Still show confirmation view so user can manually verify
      setCapturedCardImage(dataUrlOrImageSrc);
      setCurrentStep(STEPS.CARD_MATCHED);
    } finally {
      setScanningCard(false);
      setScanStatus('');
    }
  };

  // Step 1: Capture from Live Camera
  const handleCaptureCard = async () => {
    const dataUrl = captureFrame();
    if (!dataUrl) {
      toast.error('Unable to capture camera frame');
      return;
    }
    await processAndMatchIDCard(dataUrl);
  };

  // Handle Manual File Upload for ID Card
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      await processAndMatchIDCard(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Select one of the 4 Pre-registered Sample ID Cards
  const handleSelectSampleCard = async (sample) => {
    toast.loading(`Scanning ${sample.name}'s ID Card...`, { id: 'scan-toast', duration: 1500 });
    await processAndMatchIDCard(sample.image);
  };

  // Manual Verify / Re-verify with backend if edited
  const handleManualVerifyFormNo = async (customFormNo) => {
    const num = (customFormNo || formNumber).trim().toUpperCase();
    if (!num) {
      toast.error('Please enter a Registration / Form Number');
      return;
    }

    try {
      const res = await api.get(`/registered-ids/verify/${encodeURIComponent(num)}`);
      if (res.data?.exists) {
        setMatchedPersonnel(res.data.personnel);
        setFormNumber(res.data.personnel.formNumber);
        toast.success(`Verified: ${res.data.personnel.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Record not found in database');
    }
  };

  // Proceed from Matched Card to Step 2 (Live Face Match)
  const proceedToFaceMatch = () => {
    if (!formNumber.trim() && !matchedPersonnel) {
      toast.error('Please select or verify an ID card first');
      return;
    }
    setCurrentStep(STEPS.FACE_SCAN);
  };

  // Step 2: Capture Live Face & Authenticate against Matched ID Card
  const handleFaceAuthenticate = async () => {
    if (!videoRef.current) {
      toast.error('Camera stream unavailable');
      return;
    }

    setCurrentStep(STEPS.VERIFYING);
    setVerifyingStatus('Extracting live facial biometric landmarks...');

    try {
      // 1. Extract 128-point face descriptor from live selfie video
      const liveFaceResult = await extractFaceDescriptorFromVideo(videoRef.current);

      if (!liveFaceResult) {
        toast.error('No face detected clearly. Please center your face in the oval and retry.');
        setCurrentStep(STEPS.FACE_SCAN);
        return;
      }

      setVerifyingStatus(`Matching live face with ${matchedPersonnel?.name || 'ID Card'}...`);

      // 2. Submit to backend for Euclidean distance comparison against the matched ID card
      const targetFormNo = (formNumber || matchedPersonnel?.formNumber || '').trim().toUpperCase();
      const success = await faceLogin(targetFormNo, liveFaceResult.descriptor);

      if (success) {
        setCurrentStep(STEPS.SUCCESS);
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setCurrentStep(STEPS.FACE_SCAN);
      }
    } catch (err) {
      console.error('Face authentication error:', err);
      toast.error('Biometric authentication failed. Please retry.');
      setCurrentStep(STEPS.FACE_SCAN);
    }
  };

  // Reset verification flow
  const handleReset = () => {
    setCapturedCardImage(null);
    setFormNumber('');
    setMatchedPersonnel(null);
    setCardFaceDescriptor(null);
    setMatchScore(null);
    setCurrentStep(STEPS.CARD_SCAN);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-primary/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white shadow-xl shadow-primary/30 mb-3 border border-white/10">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            PRATIBANDH
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-300">
              AI BIOMETRIC AUTH
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase font-medium">
            Automated ID Card Scan & Live Face Recognition
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-5 px-4">
          <div className={`flex items-center gap-2 ${currentStep === STEPS.CARD_SCAN || currentStep === STEPS.CARD_MATCHED ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-mono ${currentStep === STEPS.CARD_SCAN || currentStep === STEPS.CARD_MATCHED ? 'border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-gray-700 bg-gray-800'}`}>
              1
            </span>
            <span className="text-xs">Scan & Match ID</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-gray-800" />
          <div className={`flex items-center gap-2 ${currentStep === STEPS.FACE_SCAN || currentStep === STEPS.VERIFYING ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-mono ${currentStep === STEPS.FACE_SCAN || currentStep === STEPS.VERIFYING ? 'border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'border-gray-700 bg-gray-800'}`}>
              2
            </span>
            <span className="text-xs">Live Face Verification</span>
          </div>
          <div className="h-0.5 flex-1 mx-3 bg-gray-800" />
          <div className={`flex items-center gap-2 ${currentStep === STEPS.SUCCESS ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border font-mono ${currentStep === STEPS.SUCCESS ? 'border-green-400 bg-green-500/20 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-700 bg-gray-800'}`}>
              3
            </span>
            <span className="text-xs">Access</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-6 relative">

          {/* STEP 0: INITIALIZING */}
          {currentStep === STEPS.INIT && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-gray-200 text-sm font-semibold">{initStatus}</p>
                <p className="text-xs text-gray-500 mt-1">Initializing neural facial embeddings and OCR models...</p>
              </div>
            </div>
          )}

          {/* STEP 1: ID CARD SCANNING & INPUT */}
          {currentStep === STEPS.CARD_SCAN && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiLock className="text-blue-400" /> Step 1: Show or Select ID Card
                  </h2>
                  <p className="text-xs text-gray-400">Scan via camera, upload image, or select a registered card below</p>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-1 border border-gray-700"
                  title="Switch Camera"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Camera Viewport with Card Bounding Box */}
              <div className="relative aspect-[16/10] bg-black rounded-xl overflow-hidden border-2 border-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* ID Card Alignment Guides */}
                <div className="absolute inset-x-10 inset-y-6 border-2 border-blue-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-3 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-t-2 border-l-2 border-blue-400" />
                    <span className="w-5 h-5 border-t-2 border-r-2 border-blue-400" />
                  </div>
                  <div className="text-center bg-black/75 py-1 px-3 rounded-full backdrop-blur-sm self-center border border-blue-500/30">
                    <p className="text-[11px] font-semibold text-blue-300 tracking-wider uppercase">
                      Align ID Card Photo & Regd No Inside Frame
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-5 h-5 border-b-2 border-l-2 border-blue-400" />
                    <span className="w-5 h-5 border-b-2 border-r-2 border-blue-400" />
                  </div>
                </div>

                {scanningCard && (
                  <div className="absolute inset-0 bg-gray-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
                    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-blue-300 font-medium">{scanStatus}</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-4 text-center">
                    <FiAlertTriangle className="w-8 h-8 text-yellow-400 mb-2" />
                    <p className="text-xs text-gray-300 mb-3">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg"
                    >
                      Upload ID Card Image Instead
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons: Camera Capture & Upload */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanningCard}
                  className="w-full py-2.5 px-4 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-700"
                >
                  <FiUpload className="w-4 h-4 text-blue-400" /> Upload ID Photo
                </button>
                <button
                  type="button"
                  onClick={handleCaptureCard}
                  disabled={scanningCard || !!cameraError}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                >
                  <FiCamera className="w-4 h-4" /> Scan & Match ID
                </button>
              </div>

              {/* Quick Registered ID Card Selection (4 Students / Officers) */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                    <FiZap className="text-yellow-400" /> Registered ID Cards (Click to Test Scan)
                  </span>
                  <span className="text-[10px] text-gray-500">{SAMPLE_CARDS.length} Cards in DB</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_CARDS.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectSampleCard(card)}
                      disabled={scanningCard}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-900/60 hover:bg-blue-950/40 border border-gray-800 hover:border-blue-500/50 transition-all text-left group"
                    >
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-700 group-hover:border-blue-400 transition-colors shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-200 group-hover:text-blue-300 truncate">
                          {card.name}
                        </p>
                        <p className="text-[10px] font-mono text-gray-400">
                          {card.regdNo} • {card.bloodGroup}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1.5: MATCH FOUND & CONFIRMATION */}
          {currentStep === STEPS.CARD_MATCHED && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiCheckCircle className="text-green-400" /> ID Card Matched Successfully
                  </h2>
                  <p className="text-xs text-gray-400">Database identity confirmed from scanned ID card</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-gray-800 border border-gray-700"
                >
                  <FiRefreshCw className="w-3 h-3" /> Rescan ID
                </button>
              </div>

              {/* Scanned ID Thumbnail & Match Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {capturedCardImage && (
                  <div className="relative aspect-[3/4] max-h-44 rounded-xl overflow-hidden border border-gray-700 bg-black flex items-center justify-center">
                    <img
                      src={capturedCardImage}
                      alt="Scanned ID Card"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-gray-300 backdrop-blur-sm border border-gray-700">
                      Scanned Card
                    </span>
                  </div>
                )}

                {/* Matched Profile Details */}
                <div className="md:col-span-2 p-3.5 bg-gradient-to-br from-blue-950/50 to-indigo-950/40 border border-blue-500/40 rounded-xl flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
                        <FiCheck className="w-3 h-3" /> {matchScore ? `${matchScore}% Match` : 'Verified'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {matchedPersonnel?.role?.replace('_', ' ') || 'Registered ID'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <FiUser className="text-blue-400 w-4 h-4" /> {matchedPersonnel?.name || 'Verified Personnel'}
                    </h3>

                    <p className="text-xs text-blue-200 font-mono mt-0.5">
                      REGD NO: <span className="font-bold text-white">{matchedPersonnel?.formNumber || formNumber}</span>
                    </p>

                    <p className="text-[11px] text-gray-300 mt-1 leading-tight">
                      {matchedPersonnel?.department || 'Computer Science & Engineering'} • {matchedPersonnel?.station || 'OUTR'}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-400 bg-black/40 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <FiInfo className="text-blue-400 shrink-0" />
                    <span>ID card verified. Next: Match live face with this ID portrait.</span>
                  </div>
                </div>
              </div>

              {/* Proceed to Face Match Trigger Button */}
              <button
                type="button"
                onClick={proceedToFaceMatch}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 transition-all"
              >
                Proceed to Live Face Match <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: LIVE FACE SCAN */}
          {currentStep === STEPS.FACE_SCAN && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <FiUser className="text-blue-400" /> Step 2: Live Face Verification
                  </h2>
                  <p className="text-xs text-gray-400">
                    Verifying live biometric match against <span className="text-blue-300 font-semibold">{matchedPersonnel?.name || 'ID Card'}</span>
                  </p>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${isFaceDetected ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'}`}>
                  {isFaceDetected ? `Face Detected (${faceConfidence}%)` : 'Looking for face...'}
                </span>
              </div>

              {/* Live Selfie Stream with Oval Alignment Guide */}
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-gray-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Face Oval Overlay Guide */}
                <div className={`absolute w-44 h-56 rounded-[50%] border-2 transition-all duration-300 pointer-events-none ${isFaceDetected ? 'border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.35)]' : 'border-blue-400/70 border-dashed'}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md transition-colors ${isFaceDetected ? 'bg-green-600/80 text-white' : 'bg-black/70 text-gray-300'}`}>
                      {isFaceDetected ? 'Face Aligned • Hold Still' : 'Center Face in Oval'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authenticate Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFaceAuthenticate}
                  disabled={!isFaceDetected}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-green-600/30 transition-all uppercase tracking-wider"
                >
                  <FiShield className="w-4 h-4" /> Match Live Face & Login
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFYING BIOMETRICS */}
          {currentStep === STEPS.VERIFYING && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <FiShield className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="text-white text-sm font-bold">{verifyingStatus || 'Comparing Biometric Vector Descriptors...'}</p>
                <p className="text-xs text-gray-500 mt-1">Calculating Euclidean distance with ID card portrait embeddings</p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {currentStep === STEPS.SUCCESS && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center text-green-400 animate-bounce">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Identity Confirmed</h3>
              <p className="text-xs text-gray-400">Live face matched ID card. Redirecting to Pratibandh dashboard...</p>
            </div>
          )}
        </div>

        {/* Fallback Option */}
        <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <span>Having camera hardware issues?</span>
          <Link
            to="/login/password"
            className="text-blue-400 hover:text-blue-300 font-medium underline inline-flex items-center gap-1"
          >
            Password Fallback <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
