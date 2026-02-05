 /**
  * AES-256-GCM encryption utility for Deno Edge Functions
  * Uses Web Crypto API (native Deno support)
  */
 
 // Encode Uint8Array to base64
 function encodeBase64(data: Uint8Array): string {
   let binary = "";
   for (let i = 0; i < data.length; i++) {
     binary += String.fromCharCode(data[i]);
   }
   return btoa(binary);
 }
 
 // Decode base64 to Uint8Array
 function decodeBase64(base64: string): Uint8Array {
   const binary = atob(base64);
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
 }
 
 /**
  * Encrypt plaintext using AES-256-GCM
  * @param plaintext - The text to encrypt
  * @param keyB64 - Optional base64-encoded key (generates new if not provided)
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
  * Decrypt ciphertext using AES-256-GCM
  * @param ciphertext_b64 - Base64-encoded ciphertext (includes auth tag)
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
  * Hash data using SHA-256
  */
 export async function sha256Hash(data: string): Promise<string> {
   const encoder = new TextEncoder();
   const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
   return encodeBase64(new Uint8Array(hashBuffer));
 }