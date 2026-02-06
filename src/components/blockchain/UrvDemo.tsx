import { useMemo, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import {
  Link2,
  FileCheck,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Settings,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { canonicalize } from '@/lib/crypto';
import { getExplorerUrl, formatSignature } from '@/lib/solana';

import idl from '@/idl/urv_privacy.json';

// TODO: Replace with your deployed ProgramId after `anchor deploy`
const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const SCHEMA_VERSION = 1;

// ============================================================================
// Helper Functions
// ============================================================================

/** Convert Uint8Array(32) to number[] for Anchor */
function u8ToArr32(u8: Uint8Array): number[] {
  if (u8.length !== 32) throw new Error('Hash must be 32 bytes.');
  return Array.from(u8);
}

/** Convert u32 to little-endian bytes */
function u32ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  out[2] = (n >> 16) & 0xff;
  out[3] = (n >> 24) & 0xff;
  return out;
}

/** Convert u16 to little-endian bytes */
function u16ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  return out;
}

/** SHA-256 hash of bytes, returns Uint8Array(32) */
async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  return new Uint8Array(hashBuffer);
}

/** Derive State PDA: ["state", admin] */
function deriveStatePda(adminPk: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('state'), adminPk.toBuffer()],
    PROGRAM_ID
  );
}

/** Derive Record PDA: ["rec", owner, dataHash] */
function deriveRecordPda(ownerPk: PublicKey, dataHash: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('rec'), ownerPk.toBuffer(), Buffer.from(dataHash)],
    PROGRAM_ID
  );
}

/** Derive Update PDA: ["upd", statePda, newScoreHash] */
function deriveUpdatePda(statePda: PublicKey, newScoreHash: Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('upd'), statePda.toBuffer(), Buffer.from(newScoreHash)],
    PROGRAM_ID
  );
}

interface TransactionStatus {
  type: 'success' | 'error' | 'pending';
  message: string;
  signature?: string;
}

export function UrvDemo() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction, signAllTransactions, connected } = wallet;

  // Form state
  const [uri, setUri] = useState('ipfs://example-ciphertext-uri');
  const [score, setScore] = useState<number[]>([72]);
  const [conf, setConf] = useState<number[]>([0.91]);

  // Transaction state
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stateInitialized, setStateInitialized] = useState(false);

  // Create provider
  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // Create program instance
  const program = useMemo(() => {
    if (!provider) return null;
    // Check if IDL has real instructions (not placeholder)
    const idlData = idl as any;
    if (!idlData.instructions || idlData.instructions.length === 0) {
      console.warn('IDL is placeholder - replace with actual IDL after Anchor build');
      return null;
    }
    try {
      return new Program(idlData, provider);
    } catch (e) {
      console.error('Failed to create program:', e);
      return null;
    }
  }, [provider]);

  /**
   * Initialize global state account.
   * MVP: wallet acts as both admin and oracle.
   * Production: oracle should be a backend signer.
   */
  const initState = useCallback(async () => {
    if (!program || !publicKey) {
      toast.error('Connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Initializing state (init_state)...' });

    try {
      const oraclePk = publicKey; // MVP: wallet is oracle
      const [statePda] = deriveStatePda(publicKey);

      console.log('Initializing state:');
      console.log('  Admin:', publicKey.toBase58());
      console.log('  Oracle:', oraclePk.toBase58());
      console.log('  State PDA:', statePda.toBase58());

      const tx = await program.methods
        .initState()
        .accounts({
          admin: publicKey,
          oracle: oraclePk,
          state: statePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStateInitialized(true);
      setStatus({
        type: 'success',
        message: `State initialized ✅ PDA: ${statePda.toBase58().slice(0, 16)}...`,
        signature: tx,
      });
      toast.success('State initialized on-chain');
    } catch (e: any) {
      console.error('init_state error:', e);
      setStatus({
        type: 'error',
        message: `Error init_state: ${e?.message ?? String(e)}`,
      });
      toast.error('Failed to initialize state');
    } finally {
      setIsProcessing(false);
    }
  }, [program, publicKey]);

  /**
   * Create a new health record on-chain.
   * Uses canonical JSON + SHA-256 to derive data_hash and record PDA.
   */
  const createRecord = useCallback(async () => {
    if (!program || !publicKey) {
      toast.error('Connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Creating record (create_record)...' });

    try {
      // Example payload - replace with real structured data
      const visitPayload = {
        provider: { provider_id: 'UUID', type: 'clinic', location: 'BR-SP' },
        service: { service_id: 'UUID', service_type: 'consult', timestamp: new Date().toISOString() },
        results: { anchors: { ra_acr: 'ACR50', das28: 3.1, cdai: 7 } },
        process: { protocol_adherence: 0.9, continuity: 0.85, safety_events: 0, documentation_quality: 0.9 },
        infrastructure: { equipment_score: 0.8, digitalization_score: 0.9, ambience_score: 0.85, accessibility_score: 0.8 },
        evolution: { education_score: 0.9, innovation_score: 0.7, teaching_score: 0.6, research_score: 0.5 },
        experience: { crm_score: 0.88, consistency_score: 0.9 },
      };

      const canon = canonicalize(visitPayload);
      const bytes = new TextEncoder().encode(canon);
      const dataHash = await sha256Bytes(bytes);

      const [statePda] = deriveStatePda(publicKey);
      const [recordPda] = deriveRecordPda(publicKey, dataHash);

      console.log('Creating record:');
      console.log('  Data hash:', Array.from(dataHash).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('  Record PDA:', recordPda.toBase58());

      const tx = await program.methods
        .createRecord(u8ToArr32(dataHash), uri, SCHEMA_VERSION)
        .accounts({
          owner: publicKey,
          state: statePda,
          record: recordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus({
        type: 'success',
        message: `Record created ✅ PDA: ${recordPda.toBase58().slice(0, 16)}...`,
        signature: tx,
      });
      toast.success('Record created on-chain');
    } catch (e: any) {
      console.error('create_record error:', e);
      setStatus({
        type: 'error',
        message: `Error create_record: ${e?.message ?? String(e)}`,
      });
      toast.error('Failed to create record');
    } finally {
      setIsProcessing(false);
    }
  }, [program, publicKey, uri]);

  /**
   * Post a score update with REAL chaining.
   * 1. Fetches state via program.account.urvState.fetch(statePda) to read lastScoreHash
   * 2. Computes features_hash from canonical JSON
   * 3. Computes new_score_hash = sha256(prevHash + featuresHash + scoreU32LE + confBpsLE)
   * 4. Derives update PDA: ["upd", statePda, new_score_hash]
   */
  const postScoreUpdate = useCallback(async () => {
    if (!program || !publicKey) {
      toast.error('Connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Reading state and posting score update (chained)...' });

    try {
      const [statePda] = deriveStatePda(publicKey);

      // 1) Fetch state on-chain to get lastScoreHash
      let prevHashBytes: Uint8Array;
      try {
        const stateAcc: any = await (program.account as any).state.fetch(statePda);
        prevHashBytes = stateAcc.lastScoreHash 
          ? Uint8Array.from(stateAcc.lastScoreHash) 
          : new Uint8Array(32);
        console.log('Fetched state, lastScoreHash:', 
          prevHashBytes.every(b => b === 0) ? '(zero - first update)' : 
          Array.from(prevHashBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
      } catch {
        prevHashBytes = new Uint8Array(32);
        console.log('State not found, using zero hash');
      }

      // 2) Build features object and hash it
      const features = {
        results: { R: 70 },
        process: { P: 80, protocol: 0.9, safety: 1.0, continuity: 0.85 },
        infrastructure: { I: 75, equipment: 0.8, ambience: 0.85, digital: 0.9 },
        evolution: { E: 65, education: 0.9, innovation: 0.7 },
        experience: { X: 78, crm: 0.88, consistency: 0.9 },
      };
      const featCanon = canonicalize(features);
      const featBytes = new TextEncoder().encode(featCanon);
      const featuresHash = await sha256Bytes(featBytes);

      // 3) Record data hash (MVP: zero, production: use real record hash)
      const recordDataHash = new Uint8Array(32);

      // 4) Score and confidence
      const scoreU32 = Math.round(score[0] * 100); // 0-10000
      const confBps = Math.round(conf[0] * 10000); // 0-10000

      // 5) new_score_hash = sha256(prevHash + featuresHash + scoreU32LE + confBpsLE)
      const toHash = new Uint8Array([
        ...prevHashBytes,
        ...featuresHash,
        ...u32ToLeBytes(scoreU32),
        ...u16ToLeBytes(confBps),
      ]);
      const newHash = await sha256Bytes(toHash);

      // 6) Derive update PDA: ["upd", statePda, newHash]
      const [updatePda] = deriveUpdatePda(statePda, newHash);

      console.log('Posting score update:');
      console.log('  Score:', score[0], '-> u32:', scoreU32);
      console.log('  Confidence:', conf[0], '-> bps:', confBps);
      console.log('  Features hash:', Array.from(featuresHash).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...');
      console.log('  Prev hash:', Array.from(prevHashBytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...');
      console.log('  New hash:', Array.from(newHash).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...');
      console.log('  Update PDA:', updatePda.toBase58());

      // 7) RPC call
      const tx = await program.methods
        .postScoreUpdate(
          u8ToArr32(recordDataHash),
          u8ToArr32(featuresHash),
          scoreU32,
          confBps,
          u8ToArr32(prevHashBytes),
          u8ToArr32(newHash)
        )
        .accounts({
          oracle: publicKey, // MVP: wallet is oracle
          state: statePda,
          update: updatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus({
        type: 'success',
        message: `Score update ✅ URV=${score[0].toFixed(2)} conf=${conf[0].toFixed(2)}`,
        signature: tx,
      });
      toast.success('Score update recorded on-chain');
    } catch (e: any) {
      console.error('post_score_update error:', e);
      setStatus({
        type: 'error',
        message: `Error post_score_update: ${e?.message ?? String(e)}`,
      });
      toast.error('Failed to post score update');
    } finally {
      setIsProcessing(false);
    }
  }, [program, publicKey, score, conf]);

  const isProgramReady = !!program;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            URV Health Chain (Devnet MVP)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            On-chain proof registry with chained score updates
          </p>
        </div>
        <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !h-9 !text-sm !rounded-md" />
      </div>

      {/* Connection Status */}
      <Alert variant={connected ? 'default' : 'destructive'}>
        <Wallet className="h-4 w-4" />
        <AlertTitle>{connected ? 'Wallet Connected' : 'Wallet Not Connected'}</AlertTitle>
        <AlertDescription>
          {connected ? (
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
              </Badge>
              <Badge variant="secondary">Devnet</Badge>
              {!isProgramReady && (
                <Badge variant="destructive">IDL not loaded</Badge>
              )}
            </span>
          ) : (
            'Connect your Phantom wallet to interact with the blockchain'
          )}
        </AlertDescription>
      </Alert>

      {/* URI Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Ciphertext URI (off-chain)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="ipfs://... or https://..."
            className="font-mono text-sm"
            disabled={!connected || isProcessing}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          onClick={initState}
          disabled={!connected || isProcessing || !isProgramReady}
          variant="outline"
          className="w-full"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Init State
        </Button>

        <Button
          onClick={createRecord}
          disabled={!connected || isProcessing || !isProgramReady}
          variant="outline"
          className="w-full"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileCheck className="h-4 w-4 mr-2" />
          )}
          Create Record
        </Button>

        <Button
          onClick={postScoreUpdate}
          disabled={!connected || isProcessing || !isProgramReady}
          className="w-full"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          Post Score Update
        </Button>
      </div>

      {/* Score and Confidence Sliders */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">URV Score (0-100)</CardTitle>
              <Badge variant="outline" className="font-mono">{score[0]}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Slider
              value={score}
              onValueChange={setScore}
              min={0}
              max={100}
              step={0.1}
              disabled={!connected || isProcessing}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Confidence (0-1)</CardTitle>
              <Badge variant="outline" className="font-mono">{conf[0].toFixed(2)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Slider
              value={conf}
              onValueChange={setConf}
              min={0}
              max={1}
              step={0.01}
              disabled={!connected || isProcessing}
            />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      {status && (
        <Card className={
          status.type === 'success' ? 'border-success' :
          status.type === 'error' ? 'border-destructive' :
          'border-warning'
        }>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {status.type === 'success' && <CheckCircle className="h-5 w-5 text-success shrink-0" />}
              {status.type === 'error' && <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
              {status.type === 'pending' && <Loader2 className="h-5 w-5 animate-spin shrink-0" />}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{status.message}</p>
                {status.signature && (
                  <a
                    href={getExplorerUrl(status.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <span className="font-mono">{formatSignature(status.signature)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MVP Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Privacy-Preserving Design</AlertTitle>
        <AlertDescription className="text-sm">
          <p className="mb-2">
            <strong>MVP:</strong> Wallet acts as oracle. <strong>Production:</strong> Oracle = backend signer + probabilistic engine + emission policy.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Plaintext is never stored on-chain</li>
            <li>Only hashes (commitments), scores, confidence, and chain links are recorded</li>
            <li>new_score_hash = sha256(prev_hash + features_hash + score_u32_LE + conf_bps_LE)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
