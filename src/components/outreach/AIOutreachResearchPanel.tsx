import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bot,
  Search,
  Rocket,
  Zap,
  Building2,
  GraduationCap,
  Landmark,
  Briefcase,
  Loader2,
  CheckCircle,
  Globe,
  Sparkles,
  Send,
  Users,
} from 'lucide-react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResearchResult {
  found: number;
  saved: number;
  contacts: Array<{
    name: string;
    email: string;
    organization: string;
    organization_type: string;
    position: string;
    country: string;
  }>;
  errors?: string[];
}

interface AIOutreachResearchPanelProps {
  onComplete: () => void;
}

const RESEARCH_CATEGORIES = [
  { 
    id: 'investors', 
    label: 'HealthTech Investors', 
    icon: Briefcase,
    description: 'Top VCs and investors in healthcare and healthtech globally',
    color: 'text-green-500',
  },
  { 
    id: 'academics', 
    label: 'Academic Institutions', 
    icon: GraduationCap,
    description: 'Leading medical schools and research institutions worldwide',
    color: 'text-blue-500',
  },
  { 
    id: 'associations', 
    label: 'Medical Associations', 
    icon: Landmark,
    description: 'Major medical and healthcare professional associations globally',
    color: 'text-purple-500',
  },
];

// The EPIC call-to-action email template
export const EPIC_CTA_TEMPLATE = {
  subject: "🌍 The Future of Healthcare is Here — And It's Free (For Now)",
  body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #1a1a1a; margin: 0; padding: 0; }
    .container { max-width: 680px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #2D8B74, #3AA88F, #D4A543); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .tagline { color: #666; font-size: 14px; margin-top: 8px; }
    h1 { font-size: 32px; color: #1a1a1a; margin-bottom: 20px; line-height: 1.3; }
    .highlight { background: linear-gradient(135deg, #2D8B74, #3AA88F); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
    .content { font-size: 16px; color: #333; }
    .cta-section { text-align: center; margin: 40px 0; padding: 40px; background: linear-gradient(135deg, #f8fffe, #f0f9f6); border-radius: 16px; border: 2px solid #2D8B74; }
    .cta-button { display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #2D8B74, #3AA88F); color: white !important; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 8px 24px rgba(45, 139, 116, 0.3); }
    .features { display: grid; gap: 16px; margin: 30px 0; }
    .feature { padding: 16px; background: #f9f9f9; border-radius: 12px; border-left: 4px solid #2D8B74; }
    .feature-title { font-weight: bold; color: #2D8B74; margin-bottom: 4px; }
    .warning-box { background: #fff8e6; border: 1px solid #d4a543; border-radius: 12px; padding: 24px; margin: 30px 0; }
    .warning-title { color: #b8860b; font-weight: bold; font-size: 18px; margin-bottom: 12px; }
    .signature { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .signature-name { font-weight: bold; color: #2D8B74; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">UHS Health OS</div>
      <div class="tagline">Universal Health System — The Operating System for Healthcare</div>
    </div>

    <h1>Dear {{name}},</h1>
    
    <div class="content">
      <p>I'm reaching out to <strong>{{organization}}</strong> because what we're building will fundamentally transform how healthcare knowledge flows across the globe — and I believe you should be among the first to experience it.</p>

      <p><span class="highlight">UHS Health OS</span> is not just another healthcare platform. It's a <strong>Universal Health Operating System</strong> — a comprehensive ecosystem that unifies:</p>

      <div class="features">
        <div class="feature">
          <div class="feature-title">🧠 AI-Powered Clinical Intelligence</div>
          Evidence-based decision support with real-time literature mining from NEJM, Lancet, ACR, EULAR, and global medical sources
        </div>
        <div class="feature">
          <div class="feature-title">⛓️ Blockchain-Verified Integrity</div>
          Every clinical insight, score, and knowledge artifact is anchored on Solana with immutable audit trails — no PHI on-chain, only cryptographic proofs
        </div>
        <div class="feature">
          <div class="feature-title">📊 Universal Risk Value (URV) Scoring</div>
          A revolutionary health value chain that quantifies outcomes, processes, infrastructure, and experience across the entire healthcare continuum
        </div>
        <div class="feature">
          <div class="feature-title">🌍 Multi-Specialty, Multi-Language</div>
          Starting with Rheumatology, expanding to all specialties — built for global healthcare professionals
        </div>
      </div>

      <div class="cta-section">
        <h2 style="margin-top: 0; color: #1a1a1a;">Experience the Future — Free</h2>
        <p style="color: #666; margin-bottom: 24px;">No credit card. No commitment. Just pure innovation.</p>
        <a href="https://rhema-care-flow.lovable.app" class="cta-button">Try UHS Health OS Now →</a>
      </div>

      <div class="warning-box">
        <div class="warning-title">⚠️ A Word of Transparency</div>
        <p style="margin: 0; color: #666;">This platform is <strong>free today</strong>. But this window won't last forever.</p>
        <p style="margin: 12px 0 0 0; color: #666;">The convergence of AI, blockchain, and healthcare is happening whether we're ready or not. The institutions that embrace this transformation early will shape the future of medicine. Those who wait may find themselves adapting to a world they didn't help create.</p>
        <p style="margin: 12px 0 0 0; color: #333; font-weight: 500;"><em>This will happen — with us or without us, by my hands or others. The only question is: will you be part of writing this chapter of medical history?</em></p>
      </div>

      <p>I would be honored to discuss how <strong>{{organization}}</strong> could leverage this platform for research, education, clinical practice, or innovation initiatives.</p>
    </div>

    <div class="signature">
      <p><span class="signature-name">Novus Oriens</span><br>
      Universal Health System Ambassador<br>
      <a href="mailto:orienta@novusoriens.org" style="color: #2D8B74;">orienta@novusoriens.org</a></p>
    </div>

    <div class="footer">
      <p>UHS Health OS — Where Evidence Meets Innovation</p>
      <p>Privacy-First • Blockchain-Verified • Clinically Validated</p>
    </div>
  </div>
</body>
</html>`,
};

export function AIOutreachResearchPanel({ onComplete }: AIOutreachResearchPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['investors', 'academics', 'associations']);
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResearchResult | null>(null);
  const [currentStep, setCurrentStep] = useState('');

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleStartResearch = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Select at least one category');
      return;
    }

    setIsResearching(true);
    setProgress(0);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const totalCategories = selectedCategories.length;
      const allResults: ResearchResult = { found: 0, saved: 0, contacts: [], errors: [] };

      for (let i = 0; i < selectedCategories.length; i++) {
        const category = selectedCategories[i];
        setCurrentStep(`Researching ${RESEARCH_CATEGORIES.find(c => c.id === category)?.label}...`);
        setProgress(((i + 0.5) / totalCategories) * 100);

        const { data, error } = await invokeEdgeFn<any>('ai-research-outreach', { category });

        if (error) {
          console.error(`Error researching ${category}:`, error);
          allResults.errors?.push(`Failed to research ${category}: ${error}`);
        } else if (data) {
          allResults.found += data.found || 0;
          allResults.saved += data.saved || 0;
          allResults.contacts = [...allResults.contacts, ...(data.contacts || [])];
          if (data.errors) {
            allResults.errors = [...(allResults.errors || []), ...data.errors];
          }
        }

        setProgress(((i + 1) / totalCategories) * 100);
      }

      setResults(allResults);
      setCurrentStep('Research complete!');
      toast.success(`Found ${allResults.found} contacts, saved ${allResults.saved} new ones!`);
      onComplete();
    } catch (err: any) {
      console.error('Research error:', err);
      toast.error(err.message || 'Research failed');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AI Global Research Engine</h2>
          <p className="text-sm text-muted-foreground">
            Discover investors, academics, and medical associations worldwide
          </p>
        </div>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Select Research Categories
          </CardTitle>
          <CardDescription>
            Choose which global healthcare stakeholders to research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {RESEARCH_CATEGORIES.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategories.includes(category.id);
            return (
              <div
                key={category.id}
                onClick={() => !isResearching && toggleCategory(category.id)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Checkbox checked={isSelected} disabled={isResearching} />
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", 
                  isSelected ? "bg-primary/10" : "bg-muted")}>
                  <Icon className={cn("h-5 w-5", category.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Progress */}
      {isResearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">{currentStep}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                AI is searching global databases for healthcare stakeholders...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Research Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-primary">{results.found}</p>
                <p className="text-sm text-muted-foreground">Contacts Found</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold text-success">{results.saved}</p>
                <p className="text-sm text-muted-foreground">New Saved</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{results.found - results.saved}</p>
                <p className="text-sm text-muted-foreground">Already Existed</p>
              </div>
            </div>

            {results.contacts.length > 0 && (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {results.contacts.slice(0, 20).map((contact, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{contact.name || contact.organization}</span>
                        <span className="text-muted-foreground ml-2">({contact.country})</span>
                      </div>
                      <Badge variant="outline">{contact.organization_type}</Badge>
                    </div>
                  ))}
                  {results.contacts.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      And {results.contacts.length - 20} more...
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}

            {results.errors && results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Some errors occurred</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {results.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Epic Template Preview */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Epic Call-to-Action Template
          </CardTitle>
          <CardDescription>
            Pre-loaded template ready to send to all discovered contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Subject:</p>
            <p className="text-sm text-muted-foreground">{EPIC_CTA_TEMPLATE.subject}</p>
            <p className="text-sm font-medium mt-4">Preview:</p>
            <p className="text-sm text-muted-foreground italic">
              "The Future of Healthcare is Here... This will happen — with us or without us, by my hands or others. 
              The only question is: will you be part of writing this chapter of medical history?"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleStartResearch}
        disabled={isResearching || selectedCategories.length === 0}
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)]"
      >
        {isResearching ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            AI Researching Global Healthcare Stakeholders...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5" />
            Launch AI Research Engine
          </>
        )}
      </Button>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Powered by Perplexity AI</AlertTitle>
        <AlertDescription>
          The research engine uses AI to search the web and find real contact information for 
          healthcare investors, academic institutions, and medical associations worldwide.
          After research, go to the Campaigns tab to send the epic call-to-action!
        </AlertDescription>
      </Alert>
    </div>
  );
}
