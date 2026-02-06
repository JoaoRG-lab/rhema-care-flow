// src/lib/solana.ts
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";

export const CLUSTER_URL = "https://api.devnet.solana.com";

export function getProvider(wallet: any) {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

export function formatSignature(signature: string, length: number = 8): string {
  if (signature.length <= length * 2) return signature;
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

export function getExplorerUrl(signature: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
