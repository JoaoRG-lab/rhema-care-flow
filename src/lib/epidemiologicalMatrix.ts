/**
 * Epidemiological Matrix - Feature Vector Encoder & Crypto
 * 
 * Implements privacy-preserving clinical feature vectors:
 * 1. Encodes categorical/numeric patient variables into dense numeric vectors
 * 2. Encrypts vectors client-side (AES-256-GCM) before storage
 * 3. Adds differential privacy noise (Laplace mechanism)
 * 4. Hashes vectors for Solana chain anchoring
 * 
 * NO PII is ever stored or transmitted — only coded clinical variables.
 */

import { sha256, aesGcmEncrypt, aesGcmDecrypt, toBase64, fromBase64 } from '@/lib/crypto';

// ============================================
// TYPES
// ============================================

export interface VariableDefinition {
  id: string;
  code: string;
  label: string;
  category: string;
  data_type: 'numeric' | 'binary' | 'categorical';
  value_range: {
    min?: number;
    max?: number;
    values?: (string | number)[];
  } | null;
  description: string | null;
  is_system: boolean;
  sort_order: number;
}

export interface FeatureVectorInput {
  [variableCode: string]: string | number | null;
}

export interface EncodedVector {
  values: number[];
  codes: string[];
  dimension: number;
}

export interface EncryptedVector {
  encrypted: string; // base64
  iv: string;        // base64
  hash: string;      // base64 SHA-256
  codes: string[];
  dimension: number;
}

// ============================================
// VARIABLE CATEGORIES
// ============================================

export const VARIABLE_CATEGORIES = [
  { code: 'demographics', label: 'Demographics' },
  { code: 'anthropometry', label: 'Anthropometry' },
  { code: 'lifestyle', label: 'Lifestyle' },
  { code: 'comorbidity', label: 'Comorbidities' },
  { code: 'family_history', label: 'Family History' },
  { code: 'rheumatology', label: 'Rheumatology Scores' },
  { code: 'vitals', label: 'Vitals' },
  { code: 'labs', label: 'Laboratory' },
  { code: 'custom', label: 'Custom' },
] as const;

// ============================================
// ENCODING FUNCTIONS
// ============================================

/**
 * Encode a categorical value to a numeric index.
 * Returns -1 for unknown/null values.
 */
function encodeCategorical(value: string | number | null, allowedValues: (string | number)[]): number {
  if (value === null || value === undefined) return -1;
  const idx = allowedValues.indexOf(value);
  return idx >= 0 ? idx : -1;
}

/**
 * Normalize a numeric value to [0, 1] range using min-max scaling.
 */
function normalizeNumeric(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Encode raw patient input into a dense numeric vector.
 * Each variable is encoded based on its data_type:
 * - numeric: min-max normalized to [0,1]
 * - binary: 0 or 1
 * - categorical: one-hot or ordinal index normalized
 */
export function encodeFeatureVector(
  input: FeatureVectorInput,
  definitions: VariableDefinition[]
): EncodedVector {
  const values: number[] = [];
  const codes: string[] = [];

  // Sort definitions by sort_order for deterministic encoding
  const sorted = [...definitions].sort((a, b) => a.sort_order - b.sort_order);

  for (const def of sorted) {
    const raw = input[def.code];
    if (raw === null || raw === undefined) continue;

    const range = def.value_range;
    let encoded: number;

    switch (def.data_type) {
      case 'binary':
        encoded = Number(raw) === 1 ? 1 : 0;
        break;

      case 'categorical':
        if (range?.values) {
          encoded = encodeCategorical(raw, range.values);
          if (encoded === -1) continue; // skip unknown
          // Normalize to [0,1] range
          encoded = range.values.length > 1
            ? encoded / (range.values.length - 1)
            : 0;
        } else {
          continue;
        }
        break;

      case 'numeric':
      default: {
        const numVal = typeof raw === 'string' ? parseFloat(raw) : raw as number;
        if (isNaN(numVal)) continue;
        encoded = normalizeNumeric(
          numVal,
          range?.min ?? 0,
          range?.max ?? 100
        );
        break;
      }
    }

    values.push(encoded);
    codes.push(def.code);
  }

  return { values, codes, dimension: values.length };
}

// ============================================
// DIFFERENTIAL PRIVACY
// ============================================

/**
 * Add Laplace noise for differential privacy.
 * ε (epsilon) controls privacy budget — smaller = more private.
 * Sensitivity is 1/dimension for normalized vectors.
 */
export function addLaplaceNoise(vector: number[], epsilon: number = 1.0): number[] {
  const sensitivity = 1.0 / Math.max(vector.length, 1);
  const scale = sensitivity / epsilon;

  return vector.map(v => {
    // Laplace noise via inverse CDF: b * sign(u) * ln(1 - 2|u|)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return Math.max(0, Math.min(1, v + noise)); // clamp to [0,1]
  });
}

// ============================================
// ENCRYPTION & HASHING
// ============================================

/**
 * Encrypt a feature vector using AES-256-GCM.
 * Returns encrypted data + SHA-256 hash of the original vector.
 */
export async function encryptVector(
  encoded: EncodedVector,
  encryptionKey: Uint8Array
): Promise<EncryptedVector> {
  // Serialize vector to bytes
  const jsonStr = JSON.stringify(encoded.values);
  const plaintext = new TextEncoder().encode(jsonStr);

  // Hash the original vector for chain anchoring
  const hashBytes = await sha256(plaintext);
  const hash = toBase64(hashBytes);

  // Encrypt
  const { iv, ciphertext } = await aesGcmEncrypt(plaintext, encryptionKey);

  return {
    encrypted: toBase64(ciphertext),
    iv: toBase64(iv),
    hash,
    codes: encoded.codes,
    dimension: encoded.dimension,
  };
}

/**
 * Decrypt a feature vector.
 */
export async function decryptVector(
  encrypted: EncryptedVector,
  encryptionKey: Uint8Array
): Promise<number[]> {
  const ciphertext = fromBase64(encrypted.encrypted);
  const iv = fromBase64(encrypted.iv);
  const plaintext = await aesGcmDecrypt(ciphertext, encryptionKey, iv);
  const jsonStr = new TextDecoder().decode(plaintext);
  return JSON.parse(jsonStr);
}

// ============================================
// RISK COMPUTATION (Population-level)
// ============================================

/**
 * Compute basic population statistics from a collection of vectors.
 * All computation happens on decrypted vectors server-side with DP noise.
 */
export function computePopulationStats(
  vectors: number[][],
  codes: string[],
  epsilon: number = 1.0
): Record<string, { mean: number; std: number; n: number }> {
  const stats: Record<string, { mean: number; std: number; n: number }> = {};

  for (let i = 0; i < codes.length; i++) {
    const values = vectors.map(v => v[i]).filter(v => v !== undefined && v !== null);
    const n = values.length;
    if (n === 0) continue;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(n - 1, 1);
    const std = Math.sqrt(variance);

    // Add DP noise to statistics
    const sensitivity = 1.0 / n;
    const scale = sensitivity / epsilon;
    const noiseMean = mean + laplaceNoise(scale);
    const noiseStd = Math.max(0, std + laplaceNoise(scale));

    stats[codes[i]] = {
      mean: Math.max(0, Math.min(1, noiseMean)),
      std: noiseStd,
      n,
    };
  }

  return stats;
}

function laplaceNoise(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

// ============================================
// RISK SCORING (Simple v1 — weighted sum)
// ============================================

/**
 * Simple weighted risk score based on known clinical risk factors.
 * Returns a score between 0 and 100.
 * 
 * This is a v1 heuristic — future versions will use proper ML models
 * trained on the privacy-preserved aggregated data.
 */
export const RISK_WEIGHTS: Record<string, number> = {
  AGE: 15,
  HAS: 12,
  DM: 12,
  SMOKING: 10,
  FH_CV: 8,
  FH_DM: 5,
  FH_AI: 5,
  DLP: 8,
  CKD: 10,
  BMI: 7,
  DAS28: 5,
  CRP: 3,
};

export function computeRiskScore(
  values: number[],
  codes: string[]
): { score: number; category: string; factors: Record<string, number> } {
  let totalWeight = 0;
  let weightedSum = 0;
  const factors: Record<string, number> = {};

  for (let i = 0; i < codes.length; i++) {
    const weight = RISK_WEIGHTS[codes[i]] || 1;
    const contribution = values[i] * weight;
    weightedSum += contribution;
    totalWeight += weight;
    if (RISK_WEIGHTS[codes[i]]) {
      factors[codes[i]] = Math.round(values[i] * weight * 100) / 100;
    }
  }

  const score = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100)
    : 0;

  const category =
    score >= 75 ? 'HIGH' :
    score >= 50 ? 'MODERATE' :
    score >= 25 ? 'LOW' :
    'MINIMAL';

  return { score, category, factors };
}
