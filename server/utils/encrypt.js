/**
 * AES-256-GCM encryption for secrets at rest (e.g. OpenAI API key).
 * Uses OPENAI_KEY_ENC_SECRET from env (32 bytes). Never log plaintext or secret.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const secret = process.env.OPENAI_KEY_ENC_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('OPENAI_KEY_ENC_SECRET or JWT_SECRET must be set for encryption');
  }
  // Prefer 64-char hex as 32-byte key; otherwise derive 32 bytes
  if (typeof secret === 'string' && secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plaintext. Returns a string: iv:authTag:ciphertext (base64).
 */
export function encrypt(plaintext) {
  if (plaintext == null || typeof plaintext !== 'string') {
    throw new Error('encrypt expects a non-empty string');
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), enc.toString('base64')].join(':');
}

/**
 * Decrypt a string produced by encrypt(). Returns plaintext or null if invalid.
 */
export function decrypt(encrypted) {
  if (encrypted == null || typeof encrypted !== 'string') {
    return null;
  }
  const parts = encrypted.split(':');
  if (parts.length !== 3) return null;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return null;
  }
}
