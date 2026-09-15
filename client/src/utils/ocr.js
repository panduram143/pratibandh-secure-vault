/**
 * OCR Utility for extracting text, Form Numbers, and details from ID Card images.
 * Uses Tesseract.js with support for dynamic loading.
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
        if (onProgress) onProgress('Initializing OCR engine...');

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
 * Run OCR recognition on an image canvas, element, or data URL
 * @param {HTMLCanvasElement | HTMLImageElement | string} imageSource
 * @param {function} [onProgress]
 * @returns {Promise<{ text: string, confidence: number, formNumber: string|null, possibleName: string|null }>}
 */
export async function processIDCardOCR(imageSource, onProgress) {
    const worker = await getOCRWorker(onProgress);
    const ret = await worker.recognize(imageSource);

    const fullText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    const formNumber = extractFormNumber(fullText);
    const possibleName = extractPossibleName(fullText);

    return {
        text: fullText,
        confidence,
        formNumber,
        possibleName
    };
}

/**
 * Regex patterns to extract Form Number / ID Number from OCR text
 */
export function extractFormNumber(text) {
    if (!text) return null;

    const cleanText = text.replace(/\r/g, '\n');

    // 1. Explicit Form No / Regd No / ID Number patterns (case insensitive)
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
            const candidate = match[1].trim().toUpperCase();
            // Discard common false positives
            if (!['INDIA', 'POLICE', 'OFFICER', 'NAME', 'DATE', 'DEPT', 'BRANCH', 'PROGRAM', 'VALID'].includes(candidate)) {
                return candidate;
            }
        }
    }

    // 2. Scan line by line for standalone alphanumeric codes or 8-digit registration numbers (e.g. "25110377")
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
        // Direct number check on line if it looks like an 8-digit regd number
        const regMatch = line.match(/\b(25\d{6}|\d{8})\b/);
        if (regMatch) return regMatch[1];

        const words = line.split(/\s+/);
        for (const word of words) {
            const cleanWord = word.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
            if (/^[A-Z0-9]{4,12}$/.test(cleanWord) && /\d/.test(cleanWord)) {
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

    // 2. Look for standalone uppercase name lines (e.g. "SOYAM PRAKASH PANDA" or "S KULDEEP")
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
