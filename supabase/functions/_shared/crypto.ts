 /**
  * AES-256-GCM encryption utility for Deno Edge Functions
  * Uses Web Crypto API (native Deno support)
 * 
 * Note: Web Crypto's AES-GCM automatically appends the 16-byte auth tag
 * to the ciphertext. This is different from Node.js crypto which separates them.
  */
 
// Encode Uint8Array to base64 (URL-safe optional)
export function encodeBase64(data: Uint8Array, urlSafe = false): string {
   let binary = "";
   for (let i = 0; i < data.length; i++) {
     binary += String.fromCharCode(data[i]);
   }
  const base64 = btoa(binary);
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : base64;
 }
 
// Decode base64 to Uint8Array (handles URL-safe)
export function decodeBase64(base64: string): Uint8Array {
  // Convert URL-safe base64 to standard
  let normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (normalized.length % 4) {
    normalized += '=';
  }
  const binary = atob(normalized);
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
     bytes[i] = binary.charCodeAt(i);
   }
   return bytes;
 }
 
 export interface EncryptedData {
   key_b64: string;
   iv_b64: string;
   ciphertext_b64: string;
  // Note: auth tag is included in ciphertext for Web Crypto API
}

export interface EncryptedDataWithTag {
  key_b64: string;
  iv_b64: string;
  ciphertext_b64: string;
  authtag_b64: string;
 }
 
 /**
  * Encrypt plaintext using AES-256-GCM
  * @param plaintext - The text to encrypt
  * @param keyB64 - Optional base64-encoded key (generates new if not provided)
 * @returns EncryptedData with combined ciphertext+authtag
  */
 export async function encryptSecret(
   plaintext: string,
   keyB64?: string
 ): Promise<EncryptedData> {
   let cryptoKey: CryptoKey;
   let keyBytes: Uint8Array;
 
   if (keyB64) {
     keyBytes = decodeBase64(keyB64);
     cryptoKey = await crypto.subtle.importKey(
       "raw",
       keyBytes.buffer as ArrayBuffer,
       { name: "AES-GCM", length: 256 },
       true,
       ["encrypt", "decrypt"]
     );
   } else {
     cryptoKey = await crypto.subtle.generateKey(
       { name: "AES-GCM", length: 256 },
       true,
       ["encrypt", "decrypt"]
     );
     const exportedKey = await crypto.subtle.exportKey("raw", cryptoKey);
     keyBytes = new Uint8Array(exportedKey);
   }
 
   // Generate random IV (12 bytes for GCM)
   const iv = new Uint8Array(12);
   crypto.getRandomValues(iv);
 
   // Encrypt
   const encoder = new TextEncoder();
   const plaintextBytes = encoder.encode(plaintext);
 
   const ciphertext = await crypto.subtle.encrypt(
     { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
     cryptoKey,
     plaintextBytes
   );
 
   return {
     key_b64: encodeBase64(keyBytes),
     iv_b64: encodeBase64(iv),
     ciphertext_b64: encodeBase64(new Uint8Array(ciphertext)),
   };
 }
 
 /**
 * Encrypt with separate auth tag (Node.js compatible format)
 * @param plaintext - The text to encrypt
 * @param keyB64 - Optional base64-encoded key
 */
export async function encryptSecretWithTag(
  plaintext: string,
  keyB64?: string
): Promise<EncryptedDataWithTag> {
  const result = await encryptSecret(plaintext, keyB64);
  const combined = decodeBase64(result.ciphertext_b64);
  
  // Web Crypto appends 16-byte auth tag to ciphertext
  const ciphertext = combined.slice(0, -16);
  const authtag = combined.slice(-16);
  
  return {
    key_b64: result.key_b64,
    iv_b64: result.iv_b64,
    ciphertext_b64: encodeBase64(ciphertext),
    authtag_b64: encodeBase64(authtag),
  };
}

/**
  * Decrypt ciphertext using AES-256-GCM
 * @param ciphertext_b64 - Base64-encoded ciphertext (with auth tag appended)
  * @param key_b64 - Base64-encoded encryption key
  * @param iv_b64 - Base64-encoded initialization vector
  */
 export async function decryptSecret(
   ciphertext_b64: string,
   key_b64: string,
   iv_b64: string
 ): Promise<string> {
   const keyBytes = decodeBase64(key_b64);
   const iv = decodeBase64(iv_b64);
   const ciphertext = decodeBase64(ciphertext_b64);
 
   const cryptoKey = await crypto.subtle.importKey(
     "raw",
     keyBytes.buffer as ArrayBuffer,
     { name: "AES-GCM", length: 256 },
     false,
     ["decrypt"]
   );
 
   const decrypted = await crypto.subtle.decrypt(
     { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
     cryptoKey,
     ciphertext.buffer as ArrayBuffer
   );
 
   const decoder = new TextDecoder();
   return decoder.decode(decrypted);
 }
 
 /**
 * Decrypt with separate auth tag (Node.js compatible format)
 */
export async function decryptSecretWithTag(
  ciphertext_b64: string,
  key_b64: string,
  iv_b64: string,
  authtag_b64: string
): Promise<string> {
  // Combine ciphertext and auth tag for Web Crypto API
  const ciphertext = decodeBase64(ciphertext_b64);
  const authtag = decodeBase64(authtag_b64);
  const combined = new Uint8Array(ciphertext.length + authtag.length);
  combined.set(ciphertext);
  combined.set(authtag, ciphertext.length);
  
  return decryptSecret(encodeBase64(combined), key_b64, iv_b64);
}

/**
  * Hash data using SHA-256
  */
 export async function sha256Hash(data: string): Promise<string> {
   const encoder = new TextEncoder();
   const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
   return encodeBase64(new Uint8Array(hashBuffer));
 }

/**
 * Generate a random encryption key
 */
export async function generateKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  return encodeBase64(new Uint8Array(exported));
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const exported = await crypto.subtle.exportKey("raw", derivedKey);
  return encodeBase64(new Uint8Array(exported));
}