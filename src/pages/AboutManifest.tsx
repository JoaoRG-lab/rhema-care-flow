import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Shield, Lock, Brain, Database, Blocks, Eye, EyeOff,
  Users, Globe, FileCode, Heart, CheckCircle, ExternalLink,
  Fingerprint, Server, Cpu, GitBranch,
} from 'lucide-react';

const principles = [
  {
    icon: EyeOff,
    title: 'Zero Patient Identification',
    description: 'No names, CPFs, phone numbers, or addresses ever enter the system. Patients are referenced only by physician-defined codes and optional last-4 MRN digits.',
  },
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    description: 'All sensitive clinical data is encrypted client-side before leaving your device. The server never sees plaintext patient information.',
  },
  {
    icon: Fingerprint,
    title: 'Differential Privacy',
    description: 'Laplace noise (ε=1.0) is mathematically injected into every data contribution, making it impossible to reverse-engineer individual patient data from aggregated statistics.',
  },
  {
    icon: Blocks,
    title: 'Blockchain Audit Trail',
    description: 'Cryptographic hashes (SHA-256) of all clinical operations are anchored on the Solana blockchain, creating an immutable, publicly verifiable audit log. No PHI is ever stored on-chain.',
  },
  {
    icon: Shield,
    title: 'Row-Level Security',
    description: 'Every database table enforces mandatory authentication through restrictive RLS policies. Doctors see only their own patients. Audit logs are append-only and immutable.',
  },
  {
    icon: FileCode,
    title: '100% Open Source',
    description: 'The entire codebase — frontend, backend, smart contracts, and cryptographic libraries — is publicly auditable on GitHub. Trust through transparency, not obscurity.',
  },
];

const techStack = [
  { label: 'Frontend', value: 'React 18 + TypeScript + Vite', icon: Cpu },
  { label: 'Backend', value: 'Supabase Edge Functions (Deno/TypeScript)', icon: Server },
  { label: 'Database', value: 'PostgreSQL with pgcrypto + RLS', icon: Database },
  { label: 'Blockchain', value: 'Solana (Anchor/Rust)', icon: Blocks },
  { label: 'Encryption', value: 'AES-256-GCM + SHA-256 + PBKDF2', icon: Lock },
  { label: 'Privacy', value: 'Differential Privacy (Laplace mechanism)', icon: EyeOff },
];

const matrixVariableCategories = [
  { category: 'Demographics', examples: 'Age, biological sex, ethnicity' },
  { category: 'Comorbidities', examples: 'Hypertension, diabetes, dyslipidemia, CKD' },
  { category: 'Family History', examples: 'Cardiovascular, diabetes, autoimmune, cancer' },
  { category: 'Rheumatology', examples: 'DAS28, HAQ-DI, BASDAI, RF, Anti-CCP, disease duration' },
  { category: 'Vitals & Labs', examples: 'Blood pressure, cholesterol, creatinine, CRP, ESR' },
  { category: 'Lifestyle', examples: 'Smoking status, BMI' },
  { category: 'Custom', examples: 'Physician-defined variables for specialized cohorts' },
];

export default function AboutManifest() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
          <Badge variant="outline" className="mb-4 gap-1">
            <Globe className="h-3 w-3" /> Open Source Manifest
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            UHS Health OS
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-2">
            A universal, privacy-first clinical platform that transforms de-identified medical data
            into population-level intelligence — without ever compromising patient identity.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Every line of code is open source. Every cryptographic decision is auditable.
            Every patient remains unidentifiable.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-4 w-4 mr-2" /> View on GitHub
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/epi-matrix">
                <Brain className="h-4 w-4 mr-2" /> Explore the Matrix
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/scores">
                <Heart className="h-4 w-4 mr-2" /> Clinical Calculators
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Medicine generates massive amounts of clinical data every day — disease activity scores,
              laboratory results, comorbidity profiles, treatment responses. Yet this data remains
              siloed in individual clinics, inaccessible for population-level analysis, and vulnerable
              to privacy breaches.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mt-4">
              <strong className="text-foreground">UHS Health OS</strong> solves this by creating an
              <strong className="text-foreground"> Encrypted Epidemiological Matrix</strong> — a system where
              physicians contribute de-identified, encrypted clinical variables that are mathematically
              combined into population-level risk predictions. The individual patient is never identifiable,
              but the collective intelligence becomes extraordinarily precise.
            </p>
          </div>
        </section>

        <Separator />

        {/* Core Principles */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Core Security Principles</h2>
          <p className="text-muted-foreground mb-8">
            Six non-negotiable pillars that govern every architectural decision.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map((p) => (
              <Card key={p.title} className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <p.icon className="h-5 w-5 text-primary" />
                    {p.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* The Epidemiological Matrix */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            The Epidemiological Matrix
          </h2>
          <p className="text-muted-foreground mb-6">
            How we transform isolated clinical observations into collective medical intelligence.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">How It Works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span><strong className="text-foreground">Encode:</strong> Clinical variables (age, comorbidities, scores, labs) are transformed into a normalized numeric vector [0,1] — no identifiers attached.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span><strong className="text-foreground">Noise:</strong> Differential privacy (Laplace mechanism, ε=1.0) injects calibrated random noise, making re-identification mathematically impossible.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span><strong className="text-foreground">Encrypt:</strong> The noisy vector is encrypted with AES-256-GCM on the client device. The server stores only ciphertext.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                  <span><strong className="text-foreground">Anchor:</strong> A SHA-256 hash of the vector is recorded on the Solana blockchain for tamper-proof auditability.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">5</span>
                  <span><strong className="text-foreground">Aggregate:</strong> Population statistics are computed with additional DP noise, producing risk models that benefit all participants without exposing anyone.</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Variable Categories</h3>
              <div className="space-y-2">
                {matrixVariableCategories.map((v) => (
                  <div key={v.category} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{v.category}:</span>{' '}
                      <span className="text-muted-foreground">{v.examples}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>v1 includes 27 system variables</strong> across rheumatology and general medicine.
                  Physicians can define custom variables for specialized research cohorts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Blockchain Layer */}
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Blocks className="h-6 w-6 text-primary" />
            Blockchain Audit Layer
          </h2>
          <p className="text-muted-foreground mb-6">
            Solana-based immutable audit trail — zero PHI on-chain.
          </p>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">What IS stored on-chain</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• SHA-256 hashes of clinical records</li>
                    <li>• URV Score updates (0-100) with ±5% step limiter</li>
                    <li>• Confidence metrics (basis points)</li>
                    <li>• Chained hash references (tamper detection)</li>
                    <li>• URI pointers to encrypted off-chain data</li>
                    <li>• Timestamps</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What is NEVER stored on-chain</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Patient names or identifiers</li>
                    <li>• CPF, phone numbers, addresses</li>
                    <li>• Raw clinical data</li>
                    <li>• Any Protected Health Information (PHI)</li>
                    <li>• Any Personally Identifiable Information (PII)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Smart Contract (Anchor/Rust)</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code className="text-xs bg-background px-1 rounded">init_state</code> — Initialize oracle config</li>
                    <li>• <code className="text-xs bg-background px-1 rounded">create_record</code> — Register hash + URI</li>
                    <li>• <code className="text-xs bg-background px-1 rounded">post_score_update</code> — Chained URV update</li>
                    <li>• PDA-based account derivation</li>
                    <li>• All code publicly auditable</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Tech Stack */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Technology Stack</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {techStack.map((t) => (
              <div key={t.label} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <t.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{t.label}</div>
                  <div className="text-sm font-medium">{t.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Data Flow Diagram (text-based) */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Data Flow</h2>
          <Card>
            <CardContent className="pt-6">
              <pre className="text-xs md:text-sm text-muted-foreground overflow-x-auto font-mono leading-relaxed">
{`┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Physician   │────▶│ Client-Side  │────▶│  Encrypted   │
│  Input Form  │     │  Encoding +  │     │   Storage    │
│ (coded vars) │     │  AES-256-GCM │     │ (PostgreSQL) │
└─────────────┘     │  + DP Noise  │     └──────┬───────┘
                    └──────┬───────┘            │
                           │                    │
                    ┌──────▼───────┐     ┌──────▼───────┐
                    │  SHA-256     │     │  Aggregation │
                    │  Hash        │     │  Engine      │
                    │  Generation  │     │  (+ DP Noise)│
                    └──────┬───────┘     └──────┬───────┘
                           │                    │
                    ┌──────▼───────┐     ┌──────▼───────┐
                    │   Solana     │     │  Population  │
                    │  Blockchain  │     │  Risk Models │
                    │  (audit log) │     │  (public)    │
                    └──────────────┘     └──────────────┘

  ⚠️ NO PII/PHI crosses any boundary. Only coded variables,
     encrypted vectors, and cryptographic hashes flow through the system.`}
              </pre>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Call to Action */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Built in the Open</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            We believe medical technology must be transparent, auditable, and owned by the community.
            Every commit, every algorithm, every security decision is public.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-4 w-4 mr-2" /> Audit the Code
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/epi-matrix">
                <Brain className="h-4 w-4 mr-2" /> Contribute Data
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">
                <Heart className="h-4 w-4 mr-2" /> Back to Home
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer note */}
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        UHS Health OS is not an official medical record. It is an organizational tool for healthcare professionals.
      </div>
    </div>
  );
}
