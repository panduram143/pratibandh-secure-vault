/**
 * Face-API utility for face detection, landmark extraction, and 128-d biometric descriptor computation.
 * Supports both bundled npm package and CDN dynamic fallback for maximum browser compatibility.
 */

let faceapiInstance = null;
let modelsLoaded = false;
let modelLoadingPromise = null;

// CDN Model paths hosted by @vladmandic/face-api
const CDN_MODELS_URI = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
const LOCAL_MODELS_URI = '/models';

/**
 * Dynamically import faceapi
 */
export async function getFaceApi() {
    if (faceapiInstance) return faceapiInstance;

    try {
        // Try importing from local package
        const mod = await import('@vladmandic/face-api');
        faceapiInstance = mod.default || mod;
    } catch (err) {
        console.warn('Local face-api import failed, falling back to CDN module...', err);
        // Fallback to dynamic CDN import
        const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.esm.js');
        faceapiInstance = mod.default || mod;
    }

    return faceapiInstance;
}

/**
 * Load face-api AI models (TinyFaceDetector / SSD, Landmarks, Recognition)
 */
export async function loadFaceModels(onProgress) {
    if (modelsLoaded) return true;
    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        const faceapi = await getFaceApi();

        if (onProgress) onProgress('Loading face detection neural networks...');

        // Try local models first, then fallback to CDN
        let modelUri = LOCAL_MODELS_URI;
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelUri)
            ]);
        } catch (e) {
            console.log('Using CDN model repository for weights...');
            modelUri = CDN_MODELS_URI;
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelUri),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelUri),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelUri)
            ]);
        }

        modelsLoaded = true;
        if (onProgress) onProgress('Face recognition models ready');
        return true;
    })();

    return modelLoadingPromise;
}

/**
 * Extract 128-point face descriptor vector from an Image element or canvas
 * @param {HTMLImageElement | HTMLCanvasElement | string} imageInput
 * @returns {Promise<{ descriptor: number[], confidence: number, box?: any, croppedFaceUrl?: string } | null>}
 */
export async function extractFaceDescriptorFromImage(imageInput) {
    await loadFaceModels();
    const faceapi = await getFaceApi();

    let imageElement = imageInput;
    if (typeof imageInput === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageInput;
        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => resolve();
        });
        imageElement = img;
    }

    let detection = null;
    // Try multiple detector sizes and lowered threshold for ID card photos
    for (const size of [416, 512, 320, 224, 160]) {
        try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: size, scoreThreshold: 0.25 });
            detection = await faceapi
                .detectSingleFace(imageElement, options)
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (detection) break;
        } catch (e) {
            // continue next size
        }
    }

    if (!detection) {
        return null;
    }

    // Crop the extracted face region for visual display in bio-data comparison
    let croppedFaceUrl = null;
    try {
        const box = detection.detection.box;
        const cropCanvas = document.createElement('canvas');
        const padding = 0.2;
        const x = Math.max(0, box.x - box.width * padding);
        const y = Math.max(0, box.y - box.height * padding);
        const w = Math.min(imageElement.width - x, box.width * (1 + 2 * padding));
        const h = Math.min(imageElement.height - y, box.height * (1 + 2 * padding));

        cropCanvas.width = 160;
        cropCanvas.height = 160;
        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(imageElement, x, y, w, h, 0, 0, 160, 160);
        croppedFaceUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
    } catch (cropErr) {
        console.warn('Face crop notice:', cropErr);
    }

    return {
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score,
        box: detection.detection.box,
        croppedFaceUrl
    };
}

/**
 * Extract 128-point face descriptor from a live Video element frame
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<{ descriptor: number[], confidence: number, box: any } | null>}
 */
export async function extractFaceDescriptorFromVideo(videoElement) {
    await loadFaceModels();
    const faceapi = await getFaceApi();

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const detection = await faceapi
        .detectSingleFace(videoElement, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        return null;
    }

    return {
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score,
        box: detection.detection.box
    };
}

/**
 * Detect face presence and bounding box in real-time (fast frame detection)
 */
export async function detectFaceInVideo(videoElement) {
    await loadFaceModels();
    const faceapi = await getFaceApi();

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
    return faceapi.detectSingleFace(videoElement, options);
}

/**
 * Calculate Euclidean Distance between two 128-d descriptors
 */
export function calculateEuclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2) {
        return Infinity;
    }
    const arr1 = Array.isArray(desc1) ? desc1 : Object.values(desc1);
    const arr2 = Array.isArray(desc2) ? desc2 : Object.values(desc2);
    if (arr1.length !== 128 || arr2.length !== 128) {
        return Infinity;
    }
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        const diff = arr1[i] - arr2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
