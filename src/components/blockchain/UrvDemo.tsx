import { useState, useMemo, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Hash,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  hashObject,
  toHex,
  computeScoreHash,
  createFeaturesHash,
} from '@/lib/crypto';
import {
  URV_PROGRAM_ID,
  deriveRecordPda,
  deriveStatePda,
  deriveUpdatePda,
  getExplorerUrl,
  formatSignature,
  toBasisPoints,
  validateScore,
  validateConfidence,
} from '@/lib/solana';

// Placeholder IDL - replace with actual after Anchor build
import idl from '@/idl/urv_privacy.json';

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
  const [ciphertextUri, setCiphertextUri] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1');
  const [urvScore, setUrvScore] = useState<number[]>([50]);
  const [confidence, setConfidence] = useState<number[]>([0.8]);
  const [prevScoreHash, setPrevScoreHash] = useState('');
  
  // Transaction state
  const [status, setStatus] = useState<TransactionStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create provider when wallet is connected
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
    if (!idl.instructions || idl.instructions.length === 0) {
      console.warn('IDL is placeholder - replace with actual IDL after Anchor build');
      return null;
    }
    try {
      return new Program(idl as any, provider);
    } catch (e) {
      console.error('Failed to create program:', e);
      return null;
    }
  }, [provider]);

  /**
   * Create a new health record on-chain.
   * Only stores the data hash and URI pointer - no PHI on chain.
   */
  const createRecord = useCallback(async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!ciphertextUri.trim()) {
      toast.error('Please enter a ciphertext URI');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Creating health record...' });

    try {
      // Create a deterministic hash of the record data
      const recordData = {
        resourceType: 'HealthRecord',
        uri: ciphertextUri,
        timestamp: Date.now(),
        owner: publicKey.toBase58(),
      };
      const dataHash = await hashObject(recordData);

      // Derive the record PDA
      const [recordPda] = await deriveRecordPda(publicKey, dataHash);

      console.log('Creating record with:');
      console.log('  Data hash:', toHex(dataHash));
      console.log('  Record PDA:', recordPda.toBase58());
      console.log('  URI:', ciphertextUri);

      // NOTE: This will fail until the actual program is deployed
      // The IDL is a placeholder - replace with real IDL after anchor build
      const tx = await program.methods
        .createRecord(
          Array.from(dataHash),
          ciphertextUri,
          parseInt(schemaVersion)
        )
        .accounts({
          owner: publicKey,
          record: recordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus({
        type: 'success',
        message: 'Health record created successfully!',
        signature: tx,
      });
      toast.success('Record created on-chain');
    } catch (error: any) {
      console.error('Create record error:', error);
      
      // Check if it's because the program doesn't exist
      if (error.message?.includes('Account does not exist') || 
          error.message?.includes('not found')) {
        setStatus({
          type: 'error',
          message: 'Program not deployed. Deploy the Anchor program first, then update the IDL.',
        });
      } else {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to create record',
        });
      }
      toast.error('Failed to create record');
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, program, ciphertextUri, schemaVersion]);

  /**
   * Post a score update to an existing record.
   * Implements chained hashing for audit trail.
   */
  const postScoreUpdate = useCallback(async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    const score = urvScore[0];
    const conf = confidence[0];

    if (!validateScore(score)) {
      toast.error('Score must be between 0 and 100');
      return;
    }

    if (!validateConfidence(conf)) {
      toast.error('Confidence must be between 0 and 1');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Posting score update...' });

    try {
      // Create features hash (simplified for demo)
      const features = {
        metrics: { painScore: score, functionScore: 100 - score },
        weights: { painScore: 0.6, functionScore: 0.4 },
      };
      const featuresHash = await createFeaturesHash(features);

      // Use previous score hash or default
      const prevHash = prevScoreHash
        ? new Uint8Array(Buffer.from(prevScoreHash, 'hex'))
        : new Uint8Array(32); // Zero hash for first update

      // Compute new chained hash
      const newScoreHash = await computeScoreHash(
        prevHash,
        score,
        conf,
        featuresHash
      );

      // Derive PDAs
      const [statePda] = await deriveStatePda(publicKey);
      const [updatePda] = await deriveUpdatePda(statePda, newScoreHash);

      console.log('Posting score update:');
      console.log('  Score:', score);
      console.log('  Confidence:', conf);
      console.log('  Features hash:', toHex(featuresHash));
      console.log('  New score hash:', toHex(newScoreHash));

      // NOTE: This will fail until the actual program is deployed
      const tx = await program.methods
        .postScoreUpdate(
          Array.from(featuresHash),
          Math.round(score * 100), // score as u32
          toBasisPoints(conf), // confidence in basis points
          Array.from(prevHash),
          Array.from(newScoreHash)
        )
        .accounts({
          oracle: publicKey,
          state: statePda,
          update: updatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Update previous hash for chaining
      setPrevScoreHash(toHex(newScoreHash));

      setStatus({
        type: 'success',
        message: 'Score update posted successfully!',
        signature: tx,
      });
      toast.success('Score update recorded on-chain');
    } catch (error: any) {
      console.error('Post score update error:', error);
      
      if (error.message?.includes('Account does not exist') || 
          error.message?.includes('not found')) {
        setStatus({
          type: 'error',
          message: 'Program not deployed. Deploy the Anchor program first.',
        });
      } else {
        setStatus({
          type: 'error',
          message: error.message || 'Failed to post score update',
        });
      }
      toast.error('Failed to post score update');
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, program, urvScore, confidence, prevScoreHash]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            URV Health Value Chain
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            On-chain proof registry with privacy-preserving score updates
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
            </span>
          ) : (
            'Connect your Phantom wallet to interact with the blockchain'
          )}
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Record Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Create Health Record
            </CardTitle>
            <CardDescription>
              Register a new health record proof on-chain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uri">Ciphertext URI</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="uri"
                  value={ciphertextUri}
                  onChange={(e) => setCiphertextUri(e.target.value)}
                  placeholder="ipfs://... or https://..."
                  className="pl-10"
                  disabled={!connected || isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pointer to encrypted off-chain data
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema">Schema Version</Label>
              <Input
                id="schema"
                type="number"
                min={1}
                value={schemaVersion}
                onChange={(e) => setSchemaVersion(e.target.value)}
                disabled={!connected || isProcessing}
              />
            </div>

            <Button
              onClick={createRecord}
              disabled={!connected || isProcessing || !ciphertextUri}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-2" />
              )}
              Create Record
            </Button>
          </CardContent>
        </Card>

        {/* Post Score Update Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Post Score Update
            </CardTitle>
            <CardDescription>
              Record a URV score update with chained proofs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>URV Score</Label>
                <Badge variant="outline" className="font-mono">
                  {urvScore[0]}
                </Badge>
              </div>
              <Slider
                value={urvScore}
                onValueChange={setUrvScore}
                min={0}
                max={100}
                step={1}
                disabled={!connected || isProcessing}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence</Label>
                <Badge variant="outline" className="font-mono">
                  {confidence[0].toFixed(2)}
                </Badge>
              </div>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                min={0}
                max={1}
                step={0.01}
                disabled={!connected || isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prevHash">Previous Score Hash (optional)</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prevHash"
                  value={prevScoreHash}
                  onChange={(e) => setPrevScoreHash(e.target.value)}
                  placeholder="Leave empty for first update"
                  className="pl-10 font-mono text-xs"
                  disabled={!connected || isProcessing}
                />
              </div>
            </div>

            <Button
              onClick={postScoreUpdate}
              disabled={!connected || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Post Score Update
            </Button>
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
                <p className="font-medium">{status.message}</p>
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

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Privacy-Preserving Design</AlertTitle>
        <AlertDescription className="text-sm">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>No PHI/PII is ever stored on-chain</li>
            <li>Only cryptographic hashes and URI pointers are recorded</li>
            <li>Score updates use chained hashing for immutable audit trails</li>
            <li>All sensitive data remains encrypted off-chain</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
