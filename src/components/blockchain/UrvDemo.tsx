import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Hash,
  Wallet,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  hashObject,
  toHex,
  fromHex,
  canonicalize,
  createFeaturesHash,
  computeScoreHashBytes,
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

interface StateAccount {
  admin: PublicKey;
  oracle: PublicKey;
  recordCount: bigint;
  updateCount: bigint;
  lastScoreHash?: Uint8Array;
  bump: number;
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
  const [recordDataHash, setRecordDataHash] = useState('');
  const [oraclePubkey, setOraclePubkey] = useState('');
  
  // State account data
  const [stateAccount, setStateAccount] = useState<StateAccount | null>(null);
  const [stateInitialized, setStateInitialized] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  
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
   * Fetch the state account to get lastScoreHash for chaining.
   */
  const fetchStateAccount = useCallback(async () => {
    if (!publicKey || !program) return;

    setIsLoadingState(true);
    try {
      const [statePda] = await deriveStatePda(publicKey);
      
      // Try to fetch the state account
      const state = await (program.account as any).state.fetch(statePda);
      
      setStateAccount({
        admin: state.admin,
        oracle: state.oracle,
        recordCount: state.recordCount,
        updateCount: state.updateCount,
        lastScoreHash: state.lastScoreHash ? new Uint8Array(state.lastScoreHash) : undefined,
        bump: state.bump,
      });
      setStateInitialized(true);
      
      console.log('State account fetched:', {
        admin: state.admin.toBase58(),
        oracle: state.oracle.toBase58(),
        recordCount: state.recordCount.toString(),
        updateCount: state.updateCount.toString(),
      });
    } catch (error: any) {
      if (error.message?.includes('Account does not exist')) {
        setStateInitialized(false);
        setStateAccount(null);
        console.log('State account not initialized');
      } else {
        console.error('Error fetching state:', error);
      }
    } finally {
      setIsLoadingState(false);
    }
  }, [publicKey, program]);

  // Fetch state when program is ready
  useEffect(() => {
    if (program && publicKey) {
      fetchStateAccount();
    }
  }, [program, publicKey, fetchStateAccount]);

  /**
   * Initialize the global state account.
   */
  const initState = useCallback(async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    const oracle = oraclePubkey.trim() || publicKey.toBase58();
    
    try {
      new PublicKey(oracle);
    } catch {
      toast.error('Invalid oracle public key');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Initializing state account...' });

    try {
      const [statePda] = await deriveStatePda(publicKey);
      const oracleKey = new PublicKey(oracle);

      console.log('Initializing state with:');
      console.log('  Admin:', publicKey.toBase58());
      console.log('  Oracle:', oracleKey.toBase58());
      console.log('  State PDA:', statePda.toBase58());

      const tx = await program.methods
        .initState()
        .accounts({
          admin: publicKey,
          oracle: oracleKey,
          state: statePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus({
        type: 'success',
        message: 'State initialized successfully!',
        signature: tx,
      });
      toast.success('State account created on-chain');
      
      // Refresh state
      await fetchStateAccount();
    } catch (error: any) {
      console.error('Init state error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to initialize state',
      });
      toast.error('Failed to initialize state');
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, program, oraclePubkey, fetchStateAccount]);

  /**
   * Create a new health record on-chain.
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

    if (!stateInitialized) {
      toast.error('Initialize state first');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'pending', message: 'Creating health record...' });

    try {
      const [statePda] = await deriveStatePda(stateAccount!.admin);
      
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

      const tx = await program.methods
        .createRecord(
          Array.from(dataHash),
          ciphertextUri,
          parseInt(schemaVersion)
        )
        .accounts({
          owner: publicKey,
          state: statePda,
          record: recordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Save the data hash for score updates
      setRecordDataHash(toHex(dataHash));

      setStatus({
        type: 'success',
        message: 'Health record created successfully!',
        signature: tx,
      });
      toast.success('Record created on-chain');
      
      await fetchStateAccount();
    } catch (error: any) {
      console.error('Create record error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to create record',
      });
      toast.error('Failed to create record');
    } finally {
      setIsProcessing(false);
    }
  }, [publicKey, program, ciphertextUri, schemaVersion, stateInitialized, stateAccount, fetchStateAccount]);

  /**
   * Post a score update with proper chain validation.
   * Fetches state PDA to get lastScoreHash as prev_score_hash.
   */
  const postScoreUpdate = useCallback(async () => {
    if (!publicKey || !program) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!stateInitialized || !stateAccount) {
      toast.error('Initialize state first');
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
    setStatus({ type: 'pending', message: 'Fetching state and posting score update...' });

    try {
      const [statePda] = await deriveStatePda(stateAccount.admin);
      
      // Fetch fresh state to get latest lastScoreHash
      let prevHash: Uint8Array;
      try {
        const freshState = await (program.account as any).state.fetch(statePda);
        prevHash = freshState.lastScoreHash 
          ? new Uint8Array(freshState.lastScoreHash) 
          : new Uint8Array(32); // Zero hash for first update
        
        console.log('Fetched state, lastScoreHash:', 
          freshState.lastScoreHash ? toHex(new Uint8Array(freshState.lastScoreHash)) : 'none (first update)');
      } catch {
        prevHash = new Uint8Array(32);
        console.log('No previous hash, using zero hash');
      }

      // Create canonical features object for hashing
      const features = {
        metrics: { 
          painScore: Math.round(score), 
          functionScore: Math.round(100 - score) 
        },
        weights: { 
          painScore: 0.6, 
          functionScore: 0.4 
        },
        timestamp: Date.now(),
      };
      const featuresHash = await createFeaturesHash(features);

      // Convert to on-chain format
      const scoreU32 = Math.round(score * 100); // 0-10000
      const confBps = toBasisPoints(conf); // 0-10000

      // Compute new score hash using production formula
      // SHA256(prev_hash || features_hash || score_u32_LE || conf_bps_LE)
      const newScoreHash = await computeScoreHashBytes(
        prevHash,
        featuresHash,
        scoreU32,
        confBps
      );

      // Derive update PDA
      const [updatePda] = await deriveUpdatePda(statePda, newScoreHash);

      // Get record data hash (use provided or empty)
      const recDataHash = recordDataHash 
        ? fromHex(recordDataHash)
        : new Uint8Array(32);

      console.log('Posting score update:');
      console.log('  Score:', score, '-> u32:', scoreU32);
      console.log('  Confidence:', conf, '-> bps:', confBps);
      console.log('  Features hash:', toHex(featuresHash));
      console.log('  Prev score hash:', toHex(prevHash));
      console.log('  New score hash:', toHex(newScoreHash));
      console.log('  Update PDA:', updatePda.toBase58());

      const tx = await program.methods
        .postScoreUpdate(
          Array.from(recDataHash),
          Array.from(featuresHash),
          scoreU32,
          confBps,
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

      setStatus({
        type: 'success',
        message: 'Score update posted successfully!',
        signature: tx,
      });
      toast.success('Score update recorded on-chain');
      
      // Refresh state to show updated lastScoreHash
      await fetchStateAccount();
    } catch (error: any) {
      console.error('Post score update error:', error);
      
      if (error.message?.includes('UnauthorizedOracle')) {
        setStatus({
          type: 'error',
          message: 'Only the designated oracle can post score updates.',
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
  }, [publicKey, program, urvScore, confidence, stateInitialized, stateAccount, recordDataHash, fetchStateAccount]);

  const isProgramReady = !!program;

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

      {/* Connection & Program Status */}
      <div className="grid md:grid-cols-2 gap-4">
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

        <Alert variant={stateInitialized ? 'default' : 'destructive'}>
          <Settings className="h-4 w-4" />
          <AlertTitle>
            {!isProgramReady ? 'Program Not Ready' : stateInitialized ? 'State Initialized' : 'State Not Initialized'}
          </AlertTitle>
          <AlertDescription>
            {!isProgramReady ? (
              'Deploy the Anchor program and update the IDL first'
            ) : stateInitialized && stateAccount ? (
              <span className="text-xs">
                Records: {stateAccount.recordCount.toString()} | Updates: {stateAccount.updateCount.toString()}
              </span>
            ) : (
              'Initialize state to enable record creation and score updates'
            )}
          </AlertDescription>
        </Alert>
      </div>

      {/* Init State Card */}
      {connected && isProgramReady && !stateInitialized && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Initialize State
            </CardTitle>
            <CardDescription>
              Create the global state account to enable the program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oracle">Oracle Public Key (optional)</Label>
              <Input
                id="oracle"
                value={oraclePubkey}
                onChange={(e) => setOraclePubkey(e.target.value)}
                placeholder="Leave empty to use your wallet"
                className="font-mono text-xs"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                The oracle is authorized to post score updates
              </p>
            </div>

            <Button
              onClick={initState}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Initialize State
            </Button>
          </CardContent>
        </Card>
      )}

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
                  disabled={!connected || isProcessing || !stateInitialized}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema">Schema Version</Label>
              <Input
                id="schema"
                type="number"
                min={1}
                value={schemaVersion}
                onChange={(e) => setSchemaVersion(e.target.value)}
                disabled={!connected || isProcessing || !stateInitialized}
              />
            </div>

            <Button
              onClick={createRecord}
              disabled={!connected || isProcessing || !ciphertextUri || !stateInitialized}
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Post Score Update
                </CardTitle>
                <CardDescription>
                  Record a URV score update with chained proofs
                </CardDescription>
              </div>
              {stateInitialized && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchStateAccount}
                  disabled={isLoadingState}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingState ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
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
                disabled={!connected || isProcessing || !stateInitialized}
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
                disabled={!connected || isProcessing || !stateInitialized}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recHash">Record Data Hash (optional)</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recHash"
                  value={recordDataHash}
                  onChange={(e) => setRecordDataHash(e.target.value)}
                  placeholder="Auto-filled after creating record"
                  className="pl-10 font-mono text-xs"
                  disabled={!connected || isProcessing || !stateInitialized}
                />
              </div>
            </div>

            <Button
              onClick={postScoreUpdate}
              disabled={!connected || isProcessing || !stateInitialized}
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
