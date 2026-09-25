const crypto = require('crypto');
const fs = require('fs').promises;

const ALGORITHM = 'chacha20-poly1305';
// KEY must be exactly 32 bytes for ChaCha20-Poly1305
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'utf-8').slice(0, 32);
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a file
 * @param {string} inputPath - Path to the file to encrypt
 * @param {string} outputPath - Path where encrypted file will be saved
 */
async function encryptFile(inputPath, outputPath) {
    try {
        const data = await fs.readFile(inputPath);
        const nonce = crypto.randomBytes(NONCE_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, nonce, { authTagLength: AUTH_TAG_LENGTH });

        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Format: [NONCE] [AUTH_TAG] [ENCRYPTED_DATA]
        const result = Buffer.concat([nonce, authTag, encrypted]);

        await fs.writeFile(outputPath, result);
        return true;
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

/**
 * Decrypt a file
 * @param {string} inputPath - Path to the encrypted file
 * @param {string} outputPath - Path where decrypted file will be saved
 */
async function decryptFile(inputPath, outputPath) {
    try {
        const data = await fs.readFile(inputPath);

        const nonce = data.slice(0, NONCE_LENGTH);
        const authTag = data.slice(NONCE_LENGTH, NONCE_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = data.slice(NONCE_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, nonce, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        await fs.writeFile(outputPath, decrypted);
        return true;
    } catch (error) {
        console.error('Decryption error:', error);
        throw error;
    }
}

/**
 * Encrypt text data
 * @param {string} text - Text to encrypt
 */
function encryptText(text) {
    const nonce = crypto.randomBytes(NONCE_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, nonce, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: nonce:authTag:encrypted
    return nonce.toString('hex') + ':' + authTag + ':' + encrypted;
}

/**
 * Decrypt text data
 * @param {string} encryptedData - Encrypted text in format "nonce:authTag:encrypted"
 */
function decryptText(encryptedData) {
    const parts = encryptedData.split(':');
    const nonce = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, nonce, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    encryptFile,
    decryptFile,
    encryptText,
    decryptText
};
