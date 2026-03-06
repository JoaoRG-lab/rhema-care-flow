import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  Crown,
  FileCheck,
  MessageSquare,
  Loader2,
  CheckCircle,
  BookOpen,
  Sparkles,
  Copy,
  Download,
} from 'lucide-react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Standards {
  identity: {
    email: string;
    name: string;
    title: string;
    verification_tier: string;
    role: string;
  };
  mission: {
    platform: string;
    vision: string;
    tagline: string;
    principles: string[];
  };
  authority: {
    capabilities: string[];
    restrictions: string[];
  };
  outreach_standards: {
    sender_name: string;
    sender_email: string;
    tone: string;
    target_audiences: string[];
    messaging_pillars: string[];
  };
  technical_standards: {
    urv_scoring: string;
    blockchain: string;
    ai_pipeline: string;
    evidence_levels: string;
  };
}

interface Confirmation {
  confirmation_id: string;
  confirmation: string;
  issued_by: string;
  issued_at: string;
  authority_level: string;
}

export function AIGuardianPanel() {
  const [standards, setStandards] = useState<Standards | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [confirmationRequest, setConfirmationRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('standards');

  const fetchStandards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-guardian-agent', {
        body: { action: 'get_standards' },
      });

      if (error) throw error;
      setStandards(data.standards);
      toast.success('Standards retrieved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch standards');
    } finally {
      setIsLoading(false);
    }
  };

  const generateConfirmation = async () => {
    if (!confirmationRequest.trim()) {
      toast.error('Please describe what you need confirmed');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-guardian-agent', {
        body: {
          action: 'generate_confirmation',
          message: confirmationRequest,
          context: { timestamp: new Date().toISOString() },
        },
      });

      if (error) throw error;
      setConfirmations(prev => [data, ...prev]);
      setConfirmationRequest('');
      toast.success(`Confirmation ${data.confirmation_id} generated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-guardian-agent', {
        body: { action: 'chat', message: userMessage },
      });

      if (error) throw error;
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not process request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
          <Crown className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Guardian Agent
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
              Ultimate Access
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Identity standards & confirmation system for Novus Oriens
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="standards" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Standards
          </TabsTrigger>
          <TabsTrigger value="confirmations" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Confirmations
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Standards Tab */}
        <TabsContent value="standards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ultimate User Standards</CardTitle>
                  <CardDescription>
                    Identity, mission, and operational standards for orienta@novusoriens.org
                  </CardDescription>
                </div>
                <Button onClick={fetchStandards} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Load Standards
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {standards ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {/* Identity */}
                    <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-500/5 to-yellow-500/5">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Identity
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> {standards.identity.name}</div>
                        <div><span className="text-muted-foreground">Email:</span> {standards.identity.email}</div>
                        <div><span className="text-muted-foreground">Title:</span> {standards.identity.title}</div>
                        <div><span className="text-muted-foreground">Tier:</span> 
                          <Badge className="ml-1" variant="outline">{standards.identity.verification_tier}</Badge>
                        </div>
                        <div className="col-span-2"><span className="text-muted-foreground">Role:</span> {standards.identity.role}</div>
                      </div>
                    </div>

                    {/* Mission */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-primary" />
                        Mission
                      </h3>
                      <p className="font-medium text-primary">{standards.mission.platform}</p>
                      <p className="text-sm text-muted-foreground mt-1">{standards.mission.vision}</p>
                      <p className="text-sm italic mt-2">"{standards.mission.tagline}"</p>
                      <div className="mt-3 space-y-1">
                        {standards.mission.principles.map((p, i) => (
                          <div key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Authority */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-success/30 bg-success/5">
                        <h3 className="font-semibold text-success mb-2">Capabilities</h3>
                        <ul className="text-sm space-y-1">
                          {standards.authority.capabilities.map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                        <h3 className="font-semibold text-destructive mb-2">Restrictions</h3>
                        <ul className="text-sm space-y-1">
                          {standards.authority.restrictions.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Outreach */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Outreach Standards</h3>
                      <div className="text-sm space-y-2">
                        <p><span className="text-muted-foreground">Sender:</span> {standards.outreach_standards.sender_name} &lt;{standards.outreach_standards.sender_email}&gt;</p>
                        <p><span className="text-muted-foreground">Tone:</span> {standards.outreach_standards.tone}</p>
                        <p><span className="text-muted-foreground">Targets:</span> {standards.outreach_standards.target_audiences.join(', ')}</p>
                        <div className="mt-2">
                          <span className="text-muted-foreground">Messaging Pillars:</span>
                          <ul className="mt-1">
                            {standards.outreach_standards.messaging_pillars.map((m, i) => (
                              <li key={i}>• {m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Technical */}
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3">Technical Standards</h3>
                      <div className="text-sm space-y-2">
                        <p><span className="text-muted-foreground">URV:</span> {standards.technical_standards.urv_scoring}</p>
                        <p><span className="text-muted-foreground">Blockchain:</span> {standards.technical_standards.blockchain}</p>
                        <p><span className="text-muted-foreground">AI Pipeline:</span> {standards.technical_standards.ai_pipeline}</p>
                        <p><span className="text-muted-foreground">Evidence:</span> {standards.technical_standards.evidence_levels}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Load Standards" to view Ultimate User standards</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirmations Tab */}
        <TabsContent value="confirmations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Confirmation</CardTitle>
              <CardDescription>
                Request formal confirmations for actions, decisions, or authorizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe what you need confirmed (e.g., 'Confirm authorization to launch outreach campaign to European medical associations')"
                value={confirmationRequest}
                onChange={(e) => setConfirmationRequest(e.target.value)}
                rows={3}
              />
              <Button onClick={generateConfirmation} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileCheck className="h-4 w-4 mr-2" />
                )}
                Generate Confirmation
              </Button>
            </CardContent>
          </Card>

          {confirmations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issued Confirmations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {confirmations.map((conf, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-mono">
                            {conf.confirmation_id}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(conf.confirmation)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{conf.confirmation}</ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <span>Issued by: {conf.issued_by}</span>
                          <span>Authority: {conf.authority_level}</span>
                          <span>{new Date(conf.issued_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Guardian Chat
              </CardTitle>
              <CardDescription>
                Ask questions about standards, get guidance, or discuss decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4 mb-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with your AI Guardian</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg max-w-[85%]',
                          msg.role === 'user'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Guardian is thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask the Guardian..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={sendChatMessage} disabled={isLoading}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
