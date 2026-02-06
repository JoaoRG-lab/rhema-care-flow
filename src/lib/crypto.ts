/**
 * URV Privacy - Cryptographic Utilities
 * 
 * Implements canonical JSON hashing, SHA-256, Base64 helpers, 
 * and AES-GCM encryption/decryption using WebCrypto API.
 * 
 * IMPORTANT: All sensitive data is encrypted client-side before 
 * any on-chain operations. Only hashes are stored on-chain.
 */

/**
 * Canonicalize an object to a deterministic JSON string.
 * Keys are sorted recursively, ensuring consistent hashing.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj);
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(key => {
    const value = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalize(value)}`;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Compute SHA-256 hash of a string and return as Uint8Array (32 bytes).
 */
export async function sha256(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return new Uint8Array(hashBuffer);
}

/**
 * Compute SHA-256 hash of an object using canonical JSON.
 * Returns 32-byte Uint8Array suitable for on-chain storage.
 */
export async function hashObject(obj: unknown): Promise<Uint8Array> {
  const canonical = canonicalize(obj);
  return sha256(canonical);
}

/**
 * Convert Uint8Array to hex string.
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Encode Uint8Array to Base64 string.
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode Base64 string to Uint8Array.
 */
export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random AES-256-GCM key.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export CryptoKey to Base64 for storage.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const rawKey = await crypto.subtle.exportKey('raw', key);
  return toBase64(new Uint8Array(rawKey));
}

/**
 * Import Base64 key to CryptoKey.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyData = fromBase64(base64Key);
  return crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns Base64 encoded result with IV prepended.
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  
  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return toBase64(combined);
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Expects Base64 encoded input with IV prepended.
 */
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const combined = fromBase64(encryptedBase64);
  
  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Create a data hash suitable for on-chain record PDAs.
 * Hashes the canonical JSON of the record data.
 */
export async function createDataHash(recordData: {
  patientId?: string;
  resourceType: string;
  content: unknown;
  timestamp: number;
}): Promise<Uint8Array> {
  return hashObject(recordData);
}

/**
 * Create a features hash for score updates.
 * Used in chained score update calculations.
 */
export async function createFeaturesHash(features: {
  metrics: Record<string, number>;
  weights: Record<string, number>;
}): Promise<Uint8Array> {
  return hashObject(features);
}

/**
 * Compute new score hash for chained updates (production version).
 * new_score_hash = SHA256(prev_hash || features_hash || score_u32_LE || conf_bps_LE)
 * 
 * Uses little-endian byte encoding for integers to match on-chain format.
 */
export async function computeScoreHash(
  prevScoreHash: Uint8Array,
  score: number,
  confidence: number,
  featuresHash: Uint8Array
): Promise<Uint8Array> {
  // Convert score to u32 (0-10000 representing 0.00-100.00)
  const scoreU32 = Math.round(score * 100);
  // Convert confidence to basis points (0-10000)
  const confBps = Math.round(confidence * 10000);
  
  // Create buffers for little-endian encoding
  const scoreBuffer = new ArrayBuffer(4);
  const confBuffer = new ArrayBuffer(2);
  new DataView(scoreBuffer).setUint32(0, scoreU32, true); // little-endian
  new DataView(confBuffer).setUint16(0, confBps, true); // little-endian
  
  // Concatenate: prev_hash (32) + features_hash (32) + score_u32 (4) + conf_bps (2)
  const combined = new Uint8Array(32 + 32 + 4 + 2);
  combined.set(prevScoreHash, 0);
  combined.set(featuresHash, 32);
  combined.set(new Uint8Array(scoreBuffer), 64);
  combined.set(new Uint8Array(confBuffer), 68);
  
  // Hash the concatenated bytes
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Compute score hash from raw bytes (for production use).
 * Directly hashes the concatenated binary data.
 */
export async function computeScoreHashBytes(
  prevHash: Uint8Array,
  featuresHash: Uint8Array,
  scoreU32: number,
  confidenceBps: number
): Promise<Uint8Array> {
  const scoreBuffer = new ArrayBuffer(4);
  const confBuffer = new ArrayBuffer(2);
  new DataView(scoreBuffer).setUint32(0, scoreU32, true);
  new DataView(confBuffer).setUint16(0, confidenceBps, true);
  
  const combined = new Uint8Array(70);
  combined.set(prevHash, 0);
  combined.set(featuresHash, 32);
  combined.set(new Uint8Array(scoreBuffer), 64);
  combined.set(new Uint8Array(confBuffer), 68);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}
