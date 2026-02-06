import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  Link2, 
  BookOpen, 
  Code, 
  Blocks,
  CheckCircle,
  Info,
} from 'lucide-react';
import { UrvDemo } from '@/components/blockchain/UrvDemo';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

export default function BlockchainRegistry() {
  // Configure Phantom wallet for devnet
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  return (
    <AppLayout>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="container max-w-6xl py-6 space-y-6">
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">Revolutionary Healthcare Integration</span>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Welcome to HealthOS
                  </h1>
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    A revolutionary new way to integrate health data with blockchain technology. 
                    Secure, transparent, and privacy-preserving healthcare value chain.
                  </p>
                </div>
              </div>

              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Blocks className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">URV Health Value Chain</h1>
                    <p className="text-muted-foreground">
                      Blockchain-based proof registry for healthcare data integrity
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">Solana Devnet</Badge>
                  <Badge variant="outline">Privacy-Preserving</Badge>
                  <Badge variant="outline">Anchor Framework</Badge>
                </div>
              </div>

              <Tabs defaultValue="demo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="demo">
                    <Blocks className="h-4 w-4 mr-2" />
                    Demo
                  </TabsTrigger>
                  <TabsTrigger value="docs">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Documentation
                  </TabsTrigger>
                  <TabsTrigger value="architecture">
                    <Code className="h-4 w-4 mr-2" />
                    Architecture
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="demo" className="mt-6">
                  <UrvDemo />
                </TabsContent>

                <TabsContent value="docs" className="mt-6 space-y-6">
                  {/* Privacy Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Privacy Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <p>
                        The URV Health Value Chain is designed with privacy as a core principle.
                        <strong> No Protected Health Information (PHI) or Personally Identifiable 
                        Information (PII) is ever stored on-chain.</strong>
                      </p>

                      <h4>What IS stored on-chain:</h4>
                      <ul>
                        <li><strong>Data Hashes:</strong> SHA-256 hashes of canonical JSON records</li>
                        <li><strong>URI Pointers:</strong> References to encrypted off-chain storage (IPFS, cloud)</li>
                        <li><strong>Score Updates:</strong> Chained hashes for audit trail integrity</li>
                        <li><strong>Timestamps:</strong> When records and updates were created</li>
                      </ul>

                      <h4>What is NOT stored on-chain:</h4>
                      <ul>
                        <li>Patient names, addresses, or contact information</li>
                        <li>Medical records, diagnoses, or treatment details</li>
                        <li>Any data that could identify an individual</li>
                      </ul>

                      <Alert className="mt-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Key Privacy Guarantee</AlertTitle>
                        <AlertDescription>
                          Even with full blockchain access, an observer can only see hashes and pointers.
                          The actual health data remains encrypted and stored off-chain, accessible only
                          to authorized parties with the decryption keys.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* Production Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        Production Deployment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <h4>Deploying the Anchor Program</h4>
                      <ol>
                        <li>Navigate to the <code>/anchor</code> folder in your repository</li>
                        <li>Install Anchor CLI: <code>cargo install --git https://github.com/coral-xyz/anchor anchor-cli</code></li>
                        <li>Build the program: <code>anchor build</code></li>
                        <li>Deploy to devnet: <code>anchor deploy --provider.cluster devnet</code></li>
                        <li>Copy the generated IDL from <code>target/idl/urv_privacy.json</code></li>
                        <li>Paste into <code>src/idl/urv_privacy.json</code></li>
                        <li>Update <code>URV_PROGRAM_ID</code> in <code>src/lib/solana.ts</code></li>
                      </ol>

                      <h4>Security Considerations</h4>
                      <ul>
                        <li>Use hardware wallets for production deployments</li>
                        <li>Implement proper key rotation mechanisms</li>
                        <li>Audit the Anchor program before mainnet deployment</li>
                        <li>Use encrypted off-chain storage with proper access controls</li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="architecture" className="mt-6 space-y-6">
                  {/* PDAs */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Program Derived Addresses (PDAs)</CardTitle>
                      <CardDescription>
                        Deterministic account addresses for on-chain data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <h4 className="font-medium flex items-center gap-2">
                            <Badge>State PDA</Badge>
                          </h4>
                          <code className="text-sm text-muted-foreground block mt-2">
                            Seeds: ["state", admin_pubkey]
                          </code>
                          <p className="text-sm mt-2">
                            Stores global configuration including admin and oracle addresses.
                          </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted/30">
                          <h4 className="font-medium flex items-center gap-2">
                            <Badge>Record PDA</Badge>
                          </h4>
                          <code className="text-sm text-muted-foreground block mt-2">
                            Seeds: ["rec", owner_pubkey, data_hash]
                          </code>
                          <p className="text-sm mt-2">
                            Each health record has a unique PDA derived from owner and data hash.
                          </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted/30">
                          <h4 className="font-medium flex items-center gap-2">
                            <Badge>Update PDA</Badge>
                          </h4>
                          <code className="text-sm text-muted-foreground block mt-2">
                            Seeds: ["upd", state_pubkey, new_score_hash]
                          </code>
                          <p className="text-sm mt-2">
                            Score updates are chained via hashes for immutable audit trail.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Program Instructions</CardTitle>
                      <CardDescription>
                        Available on-chain operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: 'init_state', desc: 'Initialize global state with admin and oracle' },
                          { name: 'create_record', desc: 'Register a new health record proof' },
                          { name: 'post_score_update', desc: 'Record a URV score update with chaining' },
                        ].map((inst) => (
                          <div key={inst.name} className="flex items-center gap-3">
                            <CheckCircle className="h-4 w-4 text-success shrink-0" />
                            <div>
                              <code className="text-sm font-medium">{inst.name}</code>
                              <p className="text-xs text-muted-foreground">{inst.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Step Limiter */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Score Step Limiter</CardTitle>
                      <CardDescription>
                        Prevents dramatic score manipulation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>±5% Step Limit</AlertTitle>
                        <AlertDescription>
                          The program enforces a maximum score change of ±5% per update.
                          This prevents sudden, potentially fraudulent score changes while
                          still allowing legitimate gradual adjustments over time.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AppLayout>
  );
}
