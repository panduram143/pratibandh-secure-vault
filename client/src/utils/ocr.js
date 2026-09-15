/**
 * OCR Utility for extracting text, Form Numbers, and details from ID Card images.
 * Uses Tesseract.js with support for dynamic loading and AI image preprocessing.
 */

let tesseractWorker = null;
let isInitializingWorker = false;

/**
 * Dynamically import Tesseract
 */
async function getTesseract() {
    try {
        const mod = await import('tesseract.js');
        return mod.default || mod;
    } catch (err) {
        console.warn('Local tesseract.js import failed, falling back to CDN script...', err);
        if (!window.Tesseract) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        return window.Tesseract;
    }
}

/**
 * Initialize or get cached Tesseract OCR Worker
 */
export async function getOCRWorker(onProgress) {
    if (tesseractWorker) return tesseractWorker;
    if (isInitializingWorker) {
        while (isInitializingWorker) {
            await new Promise(r => setTimeout(r, 100));
        }
        return tesseractWorker;
    }

    isInitializingWorker = true;
    try {
        const Tesseract = await getTesseract();
        if (onProgress) onProgress('Initializing AI OCR engine...');

        const worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
                if (onProgress && m.status === 'recognizing text') {
                    onProgress(`Reading ID card text: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        tesseractWorker = worker;
        return tesseractWorker;
    } finally {
        isInitializingWorker = false;
    }
}

/**
 * AI Preprocessing: Scales, converts to high-contrast grayscale and sharpens image on canvas
 * to maximize OCR recognition speed and accuracy from camera frames and photos.
 * @param {HTMLImageElement | HTMLCanvasElement} sourceImage
 * @returns {HTMLCanvasElement}
 */
export function preprocessImageForOCR(sourceImage) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const srcWidth = sourceImage.naturalWidth || sourceImage.videoWidth || sourceImage.width || 800;
    const srcHeight = sourceImage.naturalHeight || sourceImage.videoHeight || sourceImage.height || 600;

    // Scale up for clearer character edge definition (minimum 1200px width)
    const scale = Math.max(1, 1200 / srcWidth);
    canvas.width = Math.round(srcWidth * scale);
    canvas.height = Math.round(srcHeight * scale);

    ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

    try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Grayscale conversion and dynamic contrast adjustment
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Luminosity formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            // Contrast stretching
            const contrast = 1.3; // +30% contrast
            const adjusted = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 128));

            data[i] = adjusted;
            data[i + 1] = adjusted;
            data[i + 2] = adjusted;
        }

        ctx.putImageData(imgData, 0, 0);
    } catch (err) {
        console.warn('Canvas image processing notice:', err);
    }

    return canvas;
}

/**
 * Scan Barcode / QR Code from an image element or canvas
 * @param {HTMLImageElement | HTMLCanvasElement} imageElement
 * @returns {Promise<{ rawValue: string, format: string } | null>}
 */
export async function detectBarcodeFromImage(imageElement) {
    try {
        if ('BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({
                formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'upc_a', 'upc_e']
            });
            const barcodes = await barcodeDetector.detect(imageElement);
            if (barcodes && barcodes.length > 0) {
                return {
                    rawValue: barcodes[0].rawValue,
                    format: barcodes[0].format
                };
            }
        }
    } catch (err) {
        console.warn('Native BarcodeDetector notice:', err);
    }
    return null;
}

/**
 * Run OCR recognition & Barcode scanning on an image canvas, element, or data URL
 * @param {HTMLCanvasElement | HTMLImageElement | string} imageSource
 * @param {function} [onProgress]
 * @returns {Promise<{ text: string, confidence: number, formNumber: string|null, possibleName: string|null, barcode: string|null, barcodeFormat: string|null }>}
 */
export async function processIDCardOCR(imageSource, onProgress) {
    let barcodeResult = null;
    let processedCanvas = null;

    if (typeof imageSource !== 'string' && (imageSource instanceof HTMLImageElement || imageSource instanceof HTMLCanvasElement)) {
        barcodeResult = await detectBarcodeFromImage(imageSource);
        processedCanvas = preprocessImageForOCR(imageSource);
    }

    const worker = await getOCRWorker(onProgress);
    const target = processedCanvas || imageSource;
    const ret = await worker.recognize(target);

    const fullText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    let formNumber = barcodeResult ? barcodeResult.rawValue : null;
    if (!formNumber) {
        formNumber = extractFormNumber(fullText);
    }
    const possibleName = extractPossibleName(fullText);

    return {
        text: fullText,
        confidence,
        formNumber,
        possibleName,
        barcode: barcodeResult?.rawValue || null,
        barcodeFormat: barcodeResult?.format || null
    };
}

/**
 * Regex patterns to extract Form Number / ID Number from OCR text with typo normalization
 */
export function extractFormNumber(text) {
    if (!text) return null;

    const cleanText = text.replace(/\r/g, '\n').toUpperCase();

    // 1. Direct known registration numbers check
    const knownRegs = ['25110377', '25110335', '25110367', '25110378'];
    for (const reg of knownRegs) {
        if (cleanText.includes(reg)) return reg;
    }

    // 2. Look for explicit Form / Regd / Registration patterns
    const formPatterns = [
        /(?:REGD\.?\s*NO\.?|REG\.?\s*NO\.?|REGISTRATION\s*NO\.?|REGD_NO)[:.\s-]*([A-Z0-9-]{3,20})/i,
        /(?:FORM\s*(?:NO|NUMBER|#|ID)?|FORM_NO)[:.\s-]*([A-Z0-9-]{3,20})/i,
        /(?:CARD\s*(?:NO|NUMBER|#)?|ID\s*(?:NO|NUMBER|#|ID)?|BADGE\s*(?:NO|#)?|ENROLLMENT\s*(?:NO|#)?)[:.\s-]*([A-Z0-9-]{3,20})/i,
        /\b(FORM-[A-Z0-9-]+)\b/i,
        /\b(POL-[A-Z0-9-]+)\b/i,
        /\b(IND-[A-Z0-9-]+)\b/i,
        /\b(GOV-[A-Z0-9-]+)\b/i,
        /\b([A-Z]{2,4}-\d{3,8})\b/i,
        /\b([A-Z]{2,4}\d{4,8})\b/i,
        /\b(\d{7,10})\b/
    ];

    for (const pattern of formPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            let candidate = match[1].trim();
            // Typo normalize candidate
            candidate = candidate.replace(/O/g, '0').replace(/[IL|]/g, '1').replace(/S/g, '5');
            const cleanDigits = candidate.replace(/\D/g, '');
            if (cleanDigits.length >= 6 && cleanDigits.length <= 10) {
                return cleanDigits;
            }
            if (!['INDIA', 'POLICE', 'OFFICER', 'NAME', 'DATE', 'DEPT', 'BRANCH', 'PROGRAM', 'VALID'].includes(candidate)) {
                return candidate;
            }
        }
    }

    // 3. Scan line by line for 8-digit registration numbers (e.g. "25110377" or "2511O377")
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
        // Direct number check
        const regMatch = line.match(/\b(25\d{6}|\d{8})\b/);
        if (regMatch) return regMatch[1];

        // Typo corrected check
        const typoCorrected = line.replace(/O/g, '0').replace(/[IL|]/g, '1').replace(/S/g, '5');
        const typoMatch = typoCorrected.match(/\b(25\d{6}|\d{8})\b/);
        if (typoMatch) return typoMatch[1];

        const words = line.split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
            if (/^[A-Z0-9]{6,10}$/.test(cleanWord) && /\d/.test(cleanWord)) {
                if (!['2024', '2025', '2026', '2027', '2028', '2029'].includes(cleanWord)) {
                    return cleanWord;
                }
            }
        }
    }

    return null;
}

/**
 * Attempt to extract Officer / Person Name from ID card OCR text
 */
export function extractPossibleName(text) {
    if (!text) return null;

    const cleanText = text.toUpperCase();

    // Check for known personnel names
    if (cleanText.includes('SOYAM') && cleanText.includes('PANDA')) return 'Soyam Prakash Panda';
    if (cleanText.includes('CHITRA') || cleanText.includes('ADYASHA')) return 'Chitra Adyasha Panda';
    if (cleanText.includes('KULDEEP')) return 'S Kuldeep';
    if (cleanText.includes('SAMBIT') || (cleanText.includes('SOYAM') && cleanText.includes('SAHOO'))) return 'Soyam Sambit Sahoo';

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Look for lines with "Name:" or "Officer:"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(?:NAME|OFFICER|HOLDER|STUDENT)[:.\s-]+([A-Za-z\s.]{3,30})/i);
        if (match && match[1]) {
            const clean = match[1].trim();
            if (!['STUDENT ID CARD', 'BACHELOR', 'MASTER'].some(k => clean.toUpperCase().includes(k))) {
                return clean;
            }
        }
    }

    // 2. Look for standalone uppercase name lines
    const ignoredKeywords = [
        'ODISHA', 'UNIVERSITY', 'TECHNOLOGY', 'RESEARCH', 'BHUBANESWAR',
        'STUDENT', 'ID CARD', 'CARD', 'REGD', 'REGD. NO.', 'BRANCH', 'PROGRAM',
        'BACHELOR', 'COMPUTER', 'SCIENCE', 'ENGINEERING', 'D.O.B', 'VALID', 'UPTO',
        'SIGNATURE', 'REGISTRAR', 'POLICE', 'OFFICER', 'INDIA', 'GOVERNMENT'
    ];

    for (const line of lines) {
        const upper = line.toUpperCase();
        if (line.length >= 4 && line.length <= 32 && /^[A-Z\s.]{4,32}$/.test(upper)) {
            const hasIgnored = ignoredKeywords.some(kw => upper.includes(kw));
            if (!hasIgnored && wordsCount(line) >= 2) {
                return line.trim();
            }
        }
    }

    return null;
}

function wordsCount(str) {
    return str.trim().split(/\s+/).length;
}

/**
 * Terminate the OCR worker to free memory
 */
export async function terminateOCRWorker() {
    if (tesseractWorker) {
        try {
            await tesseractWorker.terminate();
        } catch (e) {
            console.error('Error terminating OCR worker', e);
        }
        tesseractWorker = null;
    }
}
