import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
    console.warn('⚠️  TOKEN_ENCRYPTION_KEY not set or invalid — token encryption disabled');
}

const KEY = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: "iv:authTag:ciphertext" (all hex-encoded)
 */
export function encryptToken(plaintext: string): string {
    if (!KEY) return plaintext; // Fallback if key not configured

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted token string.
 * Accepts either "iv:authTag:ciphertext" format or plaintext (for migration).
 */
export function decryptToken(encrypted: string): string {
    if (!KEY) return encrypted;

    // If it doesn't look encrypted (no colons), return as-is (plaintext migration)
    if (!encrypted.includes(':')) return encrypted;

    const parts = encrypted.split(':');
    if (parts.length !== 3) return encrypted;

    try {
        const [ivHex, authTagHex, ciphertext] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv, { authTagLength: AUTH_TAG_LENGTH });
        if (authTag.length !== AUTH_TAG_LENGTH) throw new Error('Invalid auth tag length');
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch {
        // Failed to decrypt — might be plaintext from before encryption was enabled
        return encrypted;
    }
}
