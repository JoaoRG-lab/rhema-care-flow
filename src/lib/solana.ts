// src/lib/solana.ts
import { AnchorProvider } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";

export const CLUSTER_URL = "https://api.devnet.solana.com";

export interface WalletAdapter {
  publicKey: import("@solana/web3.js").PublicKey;
  signTransaction: <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(txs: T[]) => Promise<T[]>;
}

export function getProvider(wallet: WalletAdapter) {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
}

export function formatSignature(signature: string, length: number = 8): string {
  if (signature.length <= length * 2) return signature;
  return `${signature.slice(0, length)}...${signature.slice(-length)}`;
}

export function getExplorerUrl(signature: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
