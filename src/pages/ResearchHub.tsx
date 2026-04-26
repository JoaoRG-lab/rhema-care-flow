import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Notebook,
  Sparkles,
  Database,
  Github,
  ExternalLink,
  Copy,
  Save,
  RefreshCw,
  Link2,
  BookOpen,
} from 'lucide-react';

const STORAGE_KEY = 'uhs.research-hub.context';

interface HubContext {
  topic: string;
  notes: string;
  notebookUrl: string;
  repoUrl: string;
  updatedAt: string;
}

const DEFAULT_CONTEXT: HubContext = {
  topic: '',
  notes: '',
  notebookUrl: '',
  repoUrl: '',
  updatedAt: new Date().toISOString(),
};

export default function ResearchHub() {
  const [ctx, setCtx] = useState<HubContext>(DEFAULT_CONTEXT);
  const [activeTab, setActiveTab] = useState('notebooklm');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCtx({ ...DEFAULT_CONTEXT, ...JSON.parse(raw) });
    } catch {
      /* no-op */
    }
  }, []);

  const persist = (next: HubContext) => {
    setCtx(next);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...next, updatedAt: new Date().toISOString() })
    );
  };

  const update = <K extends keyof HubContext>(key: K, value: HubContext[K]) => {
    persist({ ...ctx, [key]: value });
  };

  const copyContext = async () => {
    const payload = `Topic: ${ctx.topic || '(none)'}\n\nNotes:\n${ctx.notes || '(empty)'}`;
    await navigator.clipboard.writeText(payload);
    toast.success('Context copied — paste into NotebookLM, Perplexity, or GitHub');
  };

  const perplexityUrl = ctx.topic
    ? `https://www.perplexity.ai/search?q=${encodeURIComponent(ctx.topic)}`
    : 'https://www.perplexity.ai/';

  const notebookEmbed =
    ctx.notebookUrl?.startsWith('https://notebooklm.google.com/')
      ? ctx.notebookUrl
      : '';

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Research Hub</h1>
              <Badge variant="secondary" className="gap-1">
                <Link2 className="h-3 w-3" /> Unified Workspace
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              NotebookLM, Perplexity, Lovable Cloud, and GitHub in one place. Shared
              context flows across every tool — change the topic or notes here and they
              propagate to the panels below.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyContext} className="gap-2">
              <Copy className="h-4 w-4" /> Copy context
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => persist(DEFAULT_CONTEXT)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        {/* Shared context */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Shared research context
            </CardTitle>
            <CardDescription>
              Saved locally. Used to deep-link Perplexity, label NotebookLM, and seed
              GitHub references.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Research topic / query</label>
              <Input
                value={ctx.topic}
                onChange={(e) => update('topic', e.target.value)}
                placeholder="e.g. JAK inhibitors in early RA — 2024 evidence"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">NotebookLM notebook URL</label>
              <Input
                value={ctx.notebookUrl}
                onChange={(e) => update('notebookUrl', e.target.value)}
                placeholder="https://notebooklm.google.com/notebook/..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">GitHub repo / issue URL</label>
              <Input
                value={ctx.repoUrl}
                onChange={(e) => update('repoUrl', e.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Shared notes <Save className="h-3 w-3 text-muted-foreground" />
              </label>
              <Textarea
                value={ctx.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Drop summaries, citations, code snippets — auto-saved."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Last saved: {new Date(ctx.updatedAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tool tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="notebooklm" className="gap-2">
              <Notebook className="h-4 w-4" /> NotebookLM
            </TabsTrigger>
            <TabsTrigger value="perplexity" className="gap-2">
              <Sparkles className="h-4 w-4" /> Perplexity
            </TabsTrigger>
            <TabsTrigger value="cloud" className="gap-2">
              <Database className="h-4 w-4" /> Cloud
            </TabsTrigger>
            <TabsTrigger value="github" className="gap-2">
              <Github className="h-4 w-4" /> GitHub
            </TabsTrigger>
          </TabsList>

          {/* NotebookLM */}
          <TabsContent value="notebooklm" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">NotebookLM workspace</CardTitle>
                  <CardDescription>
                    Paste a notebook URL above to embed. Google blocks framing for some
                    notebooks — use “Open in new tab” if the embed stays blank.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={notebookEmbed || 'https://notebooklm.google.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in new tab <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                {notebookEmbed ? (
                  <iframe
                    src={notebookEmbed}
                    title="NotebookLM"
                    className="w-full h-[600px] rounded-lg border bg-background"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center p-6">
                    <Notebook className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground max-w-md">
                      Paste your NotebookLM notebook URL in the shared context above to
                      embed it here. Most notebooks open best in a new tab.
                    </p>
                    <Button asChild variant="default" className="gap-2">
                      <a
                        href="https://notebooklm.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open NotebookLM <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perplexity */}
          <TabsContent value="perplexity" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Perplexity search</CardTitle>
                  <CardDescription>
                    Auto-deep-links to your current topic. Findings can be pasted back
                    into shared notes to feed NotebookLM and GitHub.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <a href={perplexityUrl} target="_blank" rel="noopener noreferrer">
                    Open in new tab <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <iframe
                  src={perplexityUrl}
                  title="Perplexity"
                  className="w-full h-[600px] rounded-lg border bg-background"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cloud (Supabase) */}
          <TabsContent value="cloud" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lovable Cloud backend</CardTitle>
                <CardDescription>
                  Quick links to the data, functions, and AI gateway powering this app.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    label: 'AI Research Pipeline',
                    desc: 'Pipeline rows, judge decisions, sentinel flags',
                    to: '/ai-research',
                  },
                  {
                    label: 'AI Assistant',
                    desc: 'Conversational AI on the Lovable AI Gateway',
                    to: '/ai-assistant',
                  },
                  {
                    label: 'Knowledge Library',
                    desc: 'Editorial-reviewed clinical content',
                    to: '/knowledge',
                  },
                  {
                    label: 'Site Analytics',
                    desc: 'Real-time backend + traffic metrics',
                    to: '/site-analytics',
                  },
                ].map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    className="block p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </a>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GitHub */}
          <TabsContent value="github" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">GitHub repository</CardTitle>
                  <CardDescription>
                    Link a repo above to deep-link issues and PRs. Uses the bidirectional
                    Lovable ↔ GitHub sync.
                  </CardDescription>
                </div>
                {ctx.repoUrl && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={ctx.repoUrl} target="_blank" rel="noopener noreferrer">
                      Open repo <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {ctx.repoUrl ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { label: 'Issues', path: '/issues' },
                      { label: 'Pull requests', path: '/pulls' },
                      { label: 'Actions', path: '/actions' },
                    ].map((item) => (
                      <a
                        key={item.path}
                        href={`${ctx.repoUrl.replace(/\/$/, '')}${item.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                      >
                        <p className="font-medium text-sm flex items-center gap-2">
                          <Github className="h-4 w-4" /> {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {ctx.repoUrl}
                          {item.path}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center p-6">
                    <Github className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground max-w-md">
                      Add a GitHub repo URL in the shared context above to deep-link
                      issues, PRs, and Actions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
