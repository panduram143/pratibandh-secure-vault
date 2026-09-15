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
 * Extract 128-point face descriptor vector from an Image element
 * @param {HTMLImageElement | HTMLCanvasElement} imageElement
 * @returns {Promise<{ descriptor: number[], confidence: number } | null>}
 */
export async function extractFaceDescriptorFromImage(imageElement) {
    await loadFaceModels();
    const faceapi = await getFaceApi();

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const detection = await faceapi
        .detectSingleFace(imageElement, options)
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
    if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) {
        return Infinity;
    }
    let sum = 0;
    for (let i = 0; i < 128; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
