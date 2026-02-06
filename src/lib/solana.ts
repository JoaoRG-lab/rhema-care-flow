/**
 * URV Health Value Chain - Solana Utilities
 * 
 * Provides connection setup, Anchor provider configuration,
 * and PDA derivation helpers for the URV privacy program.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';

// Devnet cluster for development
export const CLUSTER_URL = clusterApiUrl('devnet');

// Program ID - Replace with actual deployed program ID after Anchor build
export const URV_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

/**
 * Create a Solana connection to devnet.
 */
export function createConnection(): Connection {
  return new Connection(CLUSTER_URL, 'confirmed');
}

/**
 * Create an Anchor provider from wallet adapter.
 * Used to interact with the on-chain program.
 */
export function createProvider(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    signTransaction: <T>(tx: T) => Promise<T>;
    signAllTransactions: <T>(txs: T[]) => Promise<T[]>;
  }
): AnchorProvider {
  return new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}

/**
 * Derive the State PDA.
 * Seeds: ["state", admin_pubkey]
 */
export async function deriveStatePda(
  adminPubkey: PublicKey,
  programId: PublicKey = URV_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('state'), adminPubkey.toBuffer()],
    programId
  );
}

/**
 * Derive the Record PDA.
 * Seeds: ["rec", owner_pubkey, data_hash]
 */
export async function deriveRecordPda(
  ownerPubkey: PublicKey,
  dataHash: Uint8Array,
  programId: PublicKey = URV_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('rec'),
      ownerPubkey.toBuffer(),
      Buffer.from(dataHash),
    ],
    programId
  );
}

/**
 * Derive the Update PDA.
 * Seeds: ["upd", state_pubkey, new_score_hash]
 */
export async function deriveUpdatePda(
  statePubkey: PublicKey,
  newScoreHash: Uint8Array,
  programId: PublicKey = URV_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('upd'),
      statePubkey.toBuffer(),
      Buffer.from(newScoreHash),
    ],
    programId
  );
}

/**
 * Format a Solana signature for display.
 */
export function formatSignature(signature: string, length: number = 8): string {
  if (signature.length <= length * 2) return signature;
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

/**
 * Get Solana Explorer URL for a transaction.
 */
export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Helper to convert a number to basis points (0-10000).
 */
export function toBasisPoints(value: number): number {
  return Math.round(value * 10000);
}

/**
 * Helper to convert basis points to decimal.
 */
export function fromBasisPoints(bps: number): number {
  return bps / 10000;
}

/**
 * Validate URV score is within bounds (0-100).
 */
export function validateScore(score: number): boolean {
  return score >= 0 && score <= 100;
}

/**
 * Validate confidence is within bounds (0-1).
 */
export function validateConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1;
}

/**
 * Check if step change is within ±5% limit.
 */
export function validateStepChange(oldScore: number, newScore: number): boolean {
  const maxChange = oldScore * 0.05;
  const actualChange = Math.abs(newScore - oldScore);
  return actualChange <= maxChange + 0.001; // Small epsilon for floating point
}
