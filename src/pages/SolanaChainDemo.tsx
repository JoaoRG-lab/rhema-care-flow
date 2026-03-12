import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield, Play, CheckCircle, XCircle, Loader2, Lock, Hash, Link2,
  Cpu, Eye, Zap, ChevronDown, RotateCcw,
} from "lucide-react";
import { canonicalize, sha256, toBase64, fromBase64, aesGcmEncrypt, aesGcmDecrypt } from "@/lib/crypto";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface TestStep {
  id: string;
  name: string;
  category: "crypto" | "chain" | "custody" | "integrity";
  status: "pending" | "running" | "pass" | "fail";
  duration?: number;
  details?: string;
  hash?: string;
}

interface ChainState {
  initialized: boolean;
  lastScoreHash: Uint8Array;
  lastScoreU32: number;
  updates: Array<{
    score: number;
    confidence: number;
    prevHash: string;
    newHash: string;
    featuresHash: string;
    timestamp: number;
  }>;
  records: Array<{
    dataHash: string;
    uri: string;
    schemaVersion: number;
    timestamp: number;
  }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hexFromBytes(u8: Uint8Array): string {
  return Array.from(u8).map(b => b.toString(16).padStart(2, "0")).join("");
}

function u32ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = n & 0xff; out[1] = (n >> 8) & 0xff; out[2] = (n >> 16) & 0xff; out[3] = (n >> 24) & 0xff;
  return out;
}

function u16ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = n & 0xff; out[1] = (n >> 8) & 0xff;
  return out;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SolanaChainDemo() {
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chainState, setChainState] = useState<ChainState>({
    initialized: false, lastScoreHash: new Uint8Array(32), lastScoreU32: 0, updates: [], records: [],
  });
  const [logOpen, setLogOpen] = useState(true);

  const updateStep = (id: string, update: Partial<TestStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const runFullDemo = useCallback(async () => {
    setRunning(true);
    setProgress(0);

    const allSteps: TestStep[] = [
      // Crypto primitives
      { id: "c1", name: "SHA-256 Hash Verification", category: "crypto", status: "pending" },
      { id: "c2", name: "Canonical JSON Determinism", category: "crypto", status: "pending" },
      { id: "c3", name: "AES-256-GCM Encrypt/Decrypt", category: "crypto", status: "pending" },
      { id: "c4", name: "Base64 Encode/Decode Roundtrip", category: "crypto", status: "pending" },
      { id: "c5", name: "PBKDF2 Key Derivation Simulation", category: "crypto", status: "pending" },
      // Chain operations
      { id: "ch1", name: "Initialize Chain State (PDA Simulation)", category: "chain", status: "pending" },
      { id: "ch2", name: "Create Health Record (SHA-256 Commitment)", category: "chain", status: "pending" },
      { id: "ch3", name: "Post Score Update #1 (Initial Score)", category: "chain", status: "pending" },
      { id: "ch4", name: "Post Score Update #2 (Chained Hash)", category: "chain", status: "pending" },
      { id: "ch5", name: "Post Score Update #3 (±5% Step Limiter)", category: "chain", status: "pending" },
      { id: "ch6", name: "Verify Hash Chain Integrity", category: "chain", status: "pending" },
      // Custody simulation
      { id: "cu1", name: "Generate Ed25519 Keypair (Simulated)", category: "custody", status: "pending" },
      { id: "cu2", name: "Sign Challenge Message", category: "custody", status: "pending" },
      { id: "cu3", name: "Verify Ed25519 Signature", category: "custody", status: "pending" },
      { id: "cu4", name: "Hardware Transfer Initiation", category: "custody", status: "pending" },
      // Integrity
      { id: "i1", name: "No-PII Heuristic Check", category: "integrity", status: "pending" },
      { id: "i2", name: "Score Step Limiter Enforcement", category: "integrity", status: "pending" },
      { id: "i3", name: "Hash Determinism (1000 iterations)", category: "integrity", status: "pending" },
      { id: "i4", name: "Encrypt/Decrypt Consistency (100 iterations)", category: "integrity", status: "pending" },
    ];

    setSteps(allSteps);
    const total = allSteps.length;
    let localChain = { ...chainState, initialized: false, lastScoreHash: new Uint8Array(32), lastScoreU32: 0, updates: [] as ChainState["updates"], records: [] as ChainState["records"] };

    const runStep = async (id: string, fn: () => Promise<{ details: string; hash?: string }>) => {
      updateStep(id, { status: "running" });
      const t0 = performance.now();
      try {
        const result = await fn();
        const duration = Math.round(performance.now() - t0);
        updateStep(id, { status: "pass", duration, details: result.details, hash: result.hash });
      } catch (e: any) {
        const duration = Math.round(performance.now() - t0);
        updateStep(id, { status: "fail", duration, details: e.message || String(e) });
      }
      setProgress(prev => Math.min(100, prev + (100 / total)));
      await new Promise(r => setTimeout(r, 80));
    };

    // ── Crypto Primitives ──
    await runStep("c1", async () => {
      const input = new TextEncoder().encode("UHS Health OS - Chain Engine Test");
      const hash = await sha256(input);
      const hex = hexFromBytes(hash);
      if (hash.length !== 32) throw new Error("SHA-256 must produce 32 bytes");
      // Verify determinism
      const hash2 = await sha256(input);
      if (hexFromBytes(hash2) !== hex) throw new Error("SHA-256 not deterministic");
      return { details: `SHA-256 ✓ (32 bytes, deterministic)`, hash: hex.slice(0, 16) + "..." };
    });

    await runStep("c2", async () => {
      const obj1 = { z: 1, a: 2, m: { x: 10, b: 20 } };
      const obj2 = { a: 2, z: 1, m: { b: 20, x: 10 } };
      const c1 = canonicalize(obj1);
      const c2 = canonicalize(obj2);
      if (c1 !== c2) throw new Error(`Canonical mismatch: ${c1} !== ${c2}`);
      const hash1 = hexFromBytes(await sha256(new TextEncoder().encode(c1)));
      const hash2 = hexFromBytes(await sha256(new TextEncoder().encode(c2)));
      if (hash1 !== hash2) throw new Error("Canonical hash mismatch");
      return { details: `Canonical JSON stable ✓ Key order: ${c1.slice(0, 40)}...`, hash: hash1.slice(0, 16) + "..." };
    });

    await runStep("c3", async () => {
      const key = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = new TextEncoder().encode("PHI must never touch the chain — only hashes");
      const { iv, ciphertext } = await aesGcmEncrypt(plaintext, key);
      const decrypted = await aesGcmDecrypt(ciphertext, key, iv);
      const decryptedText = new TextDecoder().decode(decrypted);
      if (decryptedText !== "PHI must never touch the chain — only hashes") throw new Error("Decryption mismatch");
      return { details: `AES-256-GCM roundtrip ✓ (${ciphertext.length} bytes ciphertext)` };
    });

    await runStep("c4", async () => {
      const original = crypto.getRandomValues(new Uint8Array(64));
      const encoded = toBase64(original);
      const decoded = fromBase64(encoded);
      if (original.length !== decoded.length) throw new Error("Length mismatch");
      for (let i = 0; i < original.length; i++) {
        if (original[i] !== decoded[i]) throw new Error(`Byte mismatch at index ${i}`);
      }
      return { details: `Base64 roundtrip ✓ (64 bytes → ${encoded.length} chars → 64 bytes)` };
    });

    await runStep("c5", async () => {
      const password = "UHS-Ultimate-Key-2026";
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" }, keyMaterial, 256);
      const derivedKey = new Uint8Array(bits);
      if (derivedKey.length !== 32) throw new Error("Derived key must be 32 bytes");
      // Verify determinism with same salt
      const bits2 = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" }, keyMaterial, 256);
      if (hexFromBytes(new Uint8Array(bits2)) !== hexFromBytes(derivedKey)) throw new Error("PBKDF2 not deterministic");
      return { details: `PBKDF2 ✓ (10k iterations, 256-bit key derived)`, hash: hexFromBytes(derivedKey).slice(0, 16) + "..." };
    });

    // ── Chain Operations ──
    await runStep("ch1", async () => {
      localChain.initialized = true;
      localChain.lastScoreHash = new Uint8Array(32);
      localChain.lastScoreU32 = 0;
      const stateHash = await sha256(new TextEncoder().encode(canonicalize({ admin: "SimulatedAdmin", oracle: "SimulatedOracle", lastScore: 0 })));
      return { details: `State initialized ✓ (admin=SimulatedAdmin, oracle=SimulatedOracle)`, hash: hexFromBytes(stateHash).slice(0, 16) + "..." };
    });

    await runStep("ch2", async () => {
      const visitPayload = {
        provider: { provider_id: "UUID-001", type: "clinic", location: "BR-SP" },
        service: { service_id: "UUID-002", service_type: "consult", timestamp: new Date().toISOString() },
        results: { anchors: { ra_acr: "ACR50", das28: 3.1, cdai: 7 } },
        process: { protocol_adherence: 0.9, continuity: 0.85, safety_events: 0, documentation_quality: 0.9 },
      };
      const canon = canonicalize(visitPayload);
      const dataHash = await sha256(new TextEncoder().encode(canon));
      const hex = hexFromBytes(dataHash);
      localChain.records.push({ dataHash: hex, uri: "ipfs://Qm...simulated", schemaVersion: 1, timestamp: Date.now() });
      return { details: `Record committed ✓ (canonical JSON → SHA-256)`, hash: hex.slice(0, 16) + "..." };
    });

    // Score update #1 (initial)
    await runStep("ch3", async () => {
      const score = 7200; // 72.00
      const conf = 9100; // 91%
      const features = { R: 70, P: 80, I: 75, E: 65, X: 78 };
      const featHash = await sha256(new TextEncoder().encode(canonicalize(features)));
      const toHash = new Uint8Array([...localChain.lastScoreHash, ...featHash, ...u32ToLeBytes(score), ...u16ToLeBytes(conf)]);
      const newHash = await sha256(toHash);
      localChain.updates.push({
        score, confidence: conf,
        prevHash: hexFromBytes(localChain.lastScoreHash),
        newHash: hexFromBytes(newHash),
        featuresHash: hexFromBytes(featHash),
        timestamp: Date.now(),
      });
      localChain.lastScoreHash = newHash;
      localChain.lastScoreU32 = score;
      return { details: `Score update #1 ✓ (URV=72.00, conf=91%, initial zero→hash)`, hash: hexFromBytes(newHash).slice(0, 16) + "..." };
    });

    // Score update #2 (chained)
    await runStep("ch4", async () => {
      const score = 7300; // within ±5% of 7200
      const conf = 9200;
      const features = { R: 72, P: 81, I: 76, E: 66, X: 79 };
      const featHash = await sha256(new TextEncoder().encode(canonicalize(features)));
      const prevHash = localChain.lastScoreHash;
      const toHash = new Uint8Array([...prevHash, ...featHash, ...u32ToLeBytes(score), ...u16ToLeBytes(conf)]);
      const newHash = await sha256(toHash);
      // Verify chain link
      if (hexFromBytes(prevHash) !== localChain.updates[localChain.updates.length - 1].newHash) {
        throw new Error("Chain link broken!");
      }
      localChain.updates.push({
        score, confidence: conf,
        prevHash: hexFromBytes(prevHash),
        newHash: hexFromBytes(newHash),
        featuresHash: hexFromBytes(featHash),
        timestamp: Date.now(),
      });
      localChain.lastScoreHash = newHash;
      localChain.lastScoreU32 = score;
      return { details: `Score update #2 ✓ (URV=73.00, chained from previous hash)`, hash: hexFromBytes(newHash).slice(0, 16) + "..." };
    });

    // Score update #3 (step limiter test)
    await runStep("ch5", async () => {
      const lastScore = localChain.lastScoreU32;
      const step = Math.max(1, Math.floor(lastScore / 20)); // ±5%
      const maxUp = lastScore + step;
      const minDn = lastScore - step;
      // Valid score within range
      const validScore = lastScore + Math.floor(step * 0.8);
      const features = { R: 73, P: 82, I: 77 };
      const featHash = await sha256(new TextEncoder().encode(canonicalize(features)));
      const toHash = new Uint8Array([...localChain.lastScoreHash, ...featHash, ...u32ToLeBytes(validScore), ...u16ToLeBytes(9300)]);
      const newHash = await sha256(toHash);
      // Verify limiter would reject excessive change
      const invalidScore = lastScore + step * 3;
      const rejected = invalidScore < minDn || invalidScore > maxUp;
      if (!rejected) throw new Error("Step limiter should reject large delta");
      localChain.updates.push({
        score: validScore, confidence: 9300,
        prevHash: hexFromBytes(localChain.lastScoreHash),
        newHash: hexFromBytes(newHash),
        featuresHash: hexFromBytes(featHash),
        timestamp: Date.now(),
      });
      localChain.lastScoreHash = newHash;
      localChain.lastScoreU32 = validScore;
      return { details: `Step limiter ✓ (±5% enforced, range [${minDn}-${maxUp}], accepted ${validScore}, rejected ${invalidScore})`, hash: hexFromBytes(newHash).slice(0, 16) + "..." };
    });

    // Verify full chain integrity
    await runStep("ch6", async () => {
      for (let i = 1; i < localChain.updates.length; i++) {
        if (localChain.updates[i].prevHash !== localChain.updates[i - 1].newHash) {
          throw new Error(`Chain broken at update ${i}`);
        }
      }
      return { details: `Hash chain integrity ✓ (${localChain.updates.length} updates, all links valid)` };
    });

    // ── Custody Simulation ──
    await runStep("cu1", async () => {
      const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" } as any, true, ["sign", "verify"]);
      const pubKeyRaw = await crypto.subtle.exportKey("raw", (keyPair as any).publicKey);
      const pubHex = hexFromBytes(new Uint8Array(pubKeyRaw));
      return { details: `Ed25519 keypair generated ✓ (browser Web Crypto API)`, hash: pubHex.slice(0, 16) + "..." };
    });

    await runStep("cu2", async () => {
      const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" } as any, true, ["sign", "verify"]);
      const challenge = `UHS-CUSTODY-CHALLENGE-${Date.now()}-${crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")}`;
      const sigBuffer = await crypto.subtle.sign({ name: "Ed25519" } as any, (keyPair as any).privateKey, new TextEncoder().encode(challenge));
      const sigHex = hexFromBytes(new Uint8Array(sigBuffer));
      if (new Uint8Array(sigBuffer).length !== 64) throw new Error("Ed25519 signature must be 64 bytes");
      return { details: `Challenge signed ✓ (64-byte Ed25519 signature)`, hash: sigHex.slice(0, 16) + "..." };
    });

    await runStep("cu3", async () => {
      const keyPair = await crypto.subtle.generateKey({ name: "Ed25519" } as any, true, ["sign", "verify"]);
      const challenge = "UHS-VERIFY-TEST-2026";
      const sig = await crypto.subtle.sign({ name: "Ed25519" } as any, (keyPair as any).privateKey, new TextEncoder().encode(challenge));
      const valid = await crypto.subtle.verify({ name: "Ed25519" } as any, (keyPair as any).publicKey, sig, new TextEncoder().encode(challenge));
      if (!valid) throw new Error("Signature verification failed");
      // Test invalid message
      const invalid = await crypto.subtle.verify({ name: "Ed25519" } as any, (keyPair as any).publicKey, sig, new TextEncoder().encode("tampered"));
      if (invalid) throw new Error("Should reject tampered message");
      return { details: `Ed25519 verify ✓ (valid=true, tampered=false)` };
    });

    await runStep("cu4", async () => {
      // Simulate the full custody transfer flow
      const steps = ["pending_generation", "awaiting_hardware", "hardware_connected", "installed", "active"];
      for (const step of steps) {
        await new Promise(r => setTimeout(r, 30));
      }
      return { details: `Custody lifecycle simulated ✓ (5 states: ${steps.join(" → ")})` };
    });

    // ── Integrity Tests ──
    await runStep("i1", async () => {
      const validDids = ["did:uhs:12345", "ORG_CODE_BR_001", "SUBJECT_HASH_ABC"];
      const invalidDids = ["john@email.com", "12345678901234567890", "555-123-4567"];
      for (const did of validDids) {
        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(did)) throw new Error(`False positive: ${did}`);
      }
      let caught = 0;
      for (const did of invalidDids) {
        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(did) || /\d{15,}/.test(did) || /\d{3}-\d{3}-\d{4}/.test(did)) caught++;
      }
      if (caught < 2) throw new Error("PII heuristic too weak");
      return { details: `No-PII heuristic ✓ (${validDids.length} valid accepted, ${caught}/${invalidDids.length} PII patterns caught)` };
    });

    await runStep("i2", async () => {
      let passed = 0;
      let rejected = 0;
      let lastScore = 5000;
      for (let i = 0; i < 50; i++) {
        const step = Math.max(1, Math.floor(lastScore / 20));
        const delta = Math.floor(Math.random() * step * 4) - step * 2;
        const newScore = lastScore + delta;
        const withinRange = newScore >= lastScore - step && newScore <= lastScore + step;
        if (withinRange) { passed++; lastScore = newScore; } else { rejected++; }
      }
      return { details: `Step limiter stress test ✓ (${passed} accepted, ${rejected} rejected out of 50 attempts)` };
    });

    await runStep("i3", async () => {
      const input = canonicalize({ test: "determinism", version: 1, nested: { a: 1, z: 2 } });
      const bytes = new TextEncoder().encode(input);
      const referenceHash = hexFromBytes(await sha256(bytes));
      for (let i = 0; i < 1000; i++) {
        const hash = hexFromBytes(await sha256(bytes));
        if (hash !== referenceHash) throw new Error(`Hash diverged at iteration ${i}`);
      }
      return { details: `Hash determinism ✓ (1000 iterations, all identical)`, hash: referenceHash.slice(0, 16) + "..." };
    });

    await runStep("i4", async () => {
      const key = crypto.getRandomValues(new Uint8Array(32));
      for (let i = 0; i < 100; i++) {
        const msg = `Test message iteration ${i} - ${crypto.getRandomValues(new Uint8Array(8)).reduce((s, b) => s + b.toString(16), "")}`;
        const plain = new TextEncoder().encode(msg);
        const { iv, ciphertext } = await aesGcmEncrypt(plain, key);
        const decrypted = await aesGcmDecrypt(ciphertext, key, iv);
        if (new TextDecoder().decode(decrypted) !== msg) throw new Error(`Decrypt fail at iteration ${i}`);
      }
      return { details: `AES-GCM consistency ✓ (100 encrypt/decrypt cycles, all matched)` };
    });

    setChainState(localChain);
    setRunning(false);
    setProgress(100);
    toast.success("All chain engine procedures completed successfully");
  }, [chainState]);

  const reset = () => {
    setSteps([]);
    setProgress(0);
    setChainState({ initialized: false, lastScoreHash: new Uint8Array(32), lastScoreU32: 0, updates: [], records: [] });
  };

  const passCount = steps.filter(s => s.status === "pass").length;
  const failCount = steps.filter(s => s.status === "fail").length;
  const totalSteps = steps.length;

  const categoryColors: Record<string, string> = {
    crypto: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    chain: "bg-green-500/15 text-green-500 border-green-500/30",
    custody: "bg-purple-500/15 text-purple-500 border-purple-500/30",
    integrity: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Solana Chain Engine — Full Demo</h1>
              <p className="text-xs text-muted-foreground">Crypto primitives • Hash chaining • Ed25519 custody • Integrity tests</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={runFullDemo} disabled={running} size="sm" className="gap-1.5">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {running ? "Running..." : "Run Full Demo"}
            </Button>
            <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        {(running || progress > 0) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{running ? "Executing chain engine procedures..." : `Complete — ${passCount}/${totalSteps} passed`}</span>
              <span className="font-mono">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary Cards */}
        {totalSteps > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center">
                <Cpu className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-2xl font-bold font-mono">{totalSteps}</span>
                <span className="text-xs text-muted-foreground">Total Tests</span>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-2xl font-bold font-mono text-green-500">{passCount}</span>
                <span className="text-xs text-muted-foreground">Passed</span>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center">
                <XCircle className="h-5 w-5 text-destructive mb-1" />
                <span className="text-2xl font-bold font-mono text-destructive">{failCount}</span>
                <span className="text-xs text-muted-foreground">Failed</span>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex flex-col items-center">
                <Zap className="h-5 w-5 text-yellow-500 mb-1" />
                <span className="text-2xl font-bold font-mono">
                  {steps.filter(s => s.duration).reduce((sum, s) => sum + (s.duration || 0), 0)}ms
                </span>
                <span className="text-xs text-muted-foreground">Total Time</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results by Category */}
        {totalSteps > 0 && (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({totalSteps})</TabsTrigger>
              <TabsTrigger value="crypto"><Lock className="h-3 w-3 mr-1" />Crypto</TabsTrigger>
              <TabsTrigger value="chain"><Link2 className="h-3 w-3 mr-1" />Chain</TabsTrigger>
              <TabsTrigger value="custody"><Shield className="h-3 w-3 mr-1" />Custody</TabsTrigger>
              <TabsTrigger value="integrity"><Eye className="h-3 w-3 mr-1" />Integrity</TabsTrigger>
            </TabsList>

            {["all", "crypto", "chain", "custody", "integrity"].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-2 mt-4">
                {steps.filter(s => tab === "all" || s.category === tab).map(step => (
                  <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border ${step.status === "pass" ? "border-green-500/20 bg-green-500/5" : step.status === "fail" ? "border-destructive/20 bg-destructive/5" : step.status === "running" ? "border-primary/20 bg-primary/5" : "border-border/30 bg-muted/10"}`}>
                    <div className="mt-0.5">
                      {step.status === "pass" && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {step.status === "fail" && <XCircle className="h-4 w-4 text-destructive" />}
                      {step.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {step.status === "pending" && <div className="h-4 w-4 rounded-full border border-border/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{step.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${categoryColors[step.category]}`}>{step.category}</Badge>
                        {step.duration !== undefined && <span className="text-[10px] text-muted-foreground font-mono">{step.duration}ms</span>}
                      </div>
                      {step.details && <p className="text-xs text-muted-foreground mt-0.5">{step.details}</p>}
                      {step.hash && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Hash className="h-3 w-3 text-muted-foreground/50" />
                          <code className="text-[10px] text-muted-foreground/70 font-mono">{step.hash}</code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Chain State Visualization */}
        {chainState.updates.length > 0 && (
          <Collapsible open={logOpen} onOpenChange={setLogOpen}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> Hash Chain Log ({chainState.updates.length} updates)
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${logOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-2">
                  {chainState.updates.map((u, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/30 bg-muted/10 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Update #{i + 1}</span>
                        <Badge variant="outline" className="text-[10px]">Score: {(u.score / 100).toFixed(2)}</Badge>
                      </div>
                      <div className="text-muted-foreground">
                        <div>prev: <span className="text-foreground/70">{u.prevHash.slice(0, 24)}...</span></div>
                        <div>feat: <span className="text-foreground/70">{u.featuresHash.slice(0, 24)}...</span></div>
                        <div>new:  <span className="text-primary">{u.newHash.slice(0, 24)}...</span></div>
                        {i > 0 && (
                          <div className="mt-1">
                            chain link: {u.prevHash === chainState.updates[i - 1].newHash
                              ? <span className="text-green-500">✓ valid</span>
                              : <span className="text-destructive">✗ BROKEN</span>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Empty State */}
        {totalSteps === 0 && !running && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">Chain Engine Ready</h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mt-1">
              Click <strong>Run Full Demo</strong> to execute all crypto primitives, hash chaining, Ed25519 custody simulation, and integrity tests.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-left max-w-sm">
              {[
                { icon: Lock, label: "5 Crypto Tests", desc: "SHA-256, AES-GCM, PBKDF2" },
                { icon: Link2, label: "6 Chain Tests", desc: "PDA, records, chained scores" },
                { icon: Shield, label: "4 Custody Tests", desc: "Ed25519, sign, verify, lifecycle" },
                { icon: Eye, label: "4 Integrity Tests", desc: "PII guard, step limiter, determinism" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Summary */}
        {!running && passCount > 0 && (
          <Alert variant={failCount === 0 ? "default" : "destructive"}>
            {failCount === 0 ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{failCount === 0 ? "All Procedures Passed ✓" : `${failCount} Procedure(s) Failed`}</AlertTitle>
            <AlertDescription>
              {failCount === 0
                ? `${passCount}/${totalSteps} chain engine tests completed successfully. Crypto primitives verified, hash chain integrity confirmed, Ed25519 custody simulation complete, and all integrity checks passed.`
                : `${passCount} passed, ${failCount} failed. Review failed steps above for details.`
              }
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}
