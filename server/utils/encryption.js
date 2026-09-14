const crypto = require('crypto');
const fs = require('fs').promises;

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'utf-8').slice(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypt a file
 * @param {string} inputPath - Path to the file to encrypt
 * @param {string} outputPath - Path where encrypted file will be saved
 */
async function encryptFile(inputPath, outputPath) {
    try {
        const data = await fs.readFile(inputPath);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

        // Prepend IV to encrypted data
        const result = Buffer.concat([iv, encrypted]);

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

        // Extract IV from the beginning
        const iv = data.slice(0, IV_LENGTH);
        const encrypted = data.slice(IV_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
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
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt text data
 * @param {string} encryptedData - Encrypted text in format "iv:encrypted"
 */
function decryptText(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

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
