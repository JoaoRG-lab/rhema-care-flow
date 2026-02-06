import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bot,
  Search,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Shield,
  BookOpen,
  Loader2,
  Play,
  Eye,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAIResearch } from '@/hooks/useAIResearch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PipelineItem {
  id: string;
  topic: string;
  status: string;
  disease_area?: string;
  generated_title?: string;
  generated_summary?: string;
  generated_content?: string;
  generated_tags?: string[];
  ai_verification_score?: number;
  ai_factcheck_passed?: boolean;
  created_at: string;
}

interface QueueItem {
  id: string;
  topic: string;
  category: string;
  disease_area?: string;
  priority: number;
  status: string;
  articles_generated: number;
}

export function AIResearchDashboard() {
  const [searchTopic, setSearchTopic] = useState('');
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, inQueue: 0 });
  const { isLoading, performResearch, generateArticle, verifyContent, batchProcess } = useAIResearch();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch pipeline items
    const { data: pipeline } = await supabase
      .from('ai_research_pipeline')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (pipeline) {
      setPipelineItems(pipeline as PipelineItem[]);
      setStats(prev => ({
        ...prev,
        total: pipeline.length,
        pending: pipeline.filter(p => p.status === 'pending_review').length,
        approved: pipeline.filter(p => p.status === 'approved' || p.status === 'published').length,
      }));
    }

    // Fetch queue items
    const { data: queue } = await supabase
      .from('research_topic_queue')
      .select('*')
      .order('priority', { ascending: false })
      .limit(50);

    if (queue) {
      setQueueItems(queue as QueueItem[]);
      setStats(prev => ({
        ...prev,
        inQueue: queue.filter(q => q.status === 'queued').length,
      }));
    }
  };

  const handleSingleResearch = async () => {
    if (!searchTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      toast.info('Starting research...', { duration: 2000 });
      
      // Generate article
      const article = await generateArticle(searchTopic);
      
      if (article.content) {
        // Verify content
        toast.info('Verifying content...', { duration: 2000 });
        const verification = await verifyContent(article.content);
        
        // Save to pipeline
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase.from('ai_research_pipeline').insert({
            user_id: user.user.id,
            topic: searchTopic,
            generated_title: article.title,
            generated_summary: article.summary,
            generated_content: article.content,
            generated_tags: article.tags || [],
            status: verification.passed ? 'pending_review' : 'ai_reviewing',
            ai_verification_score: verification.overall_score,
            ai_verification_notes: verification.verification_notes,
            ai_factcheck_passed: verification.passed,
          });
          
          toast.success(`Article generated! Score: ${verification.overall_score}/100`);
          setSearchTopic('');
          fetchData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchProcess = async () => {
    try {
      toast.info('Starting batch processing...', { duration: 3000 });
      const result = await batchProcess();
      
      toast.success(`Processed ${result.processed} topics!`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (item: PipelineItem) => {
    // Update status to approved
    await supabase
      .from('ai_research_pipeline')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', item.id);
    
    toast.success('Article approved!');
    fetchData();
  };

  const handlePublish = async (item: PipelineItem) => {
    // Publish to education_content
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const slug = item.generated_title
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 100);

    const { error } = await supabase.from('education_content').insert({
      author_id: user.user.id,
      title: item.generated_title,
      summary: item.generated_summary,
      content: item.generated_content,
      slug: slug || `article-${Date.now()}`,
      category: 'Clinical Knowledge',
      content_type: 'article',
      is_published: true,
      published_at: new Date().toISOString(),
      diagnosis_tags: item.generated_tags || [],
    });

    if (!error) {
      await supabase
        .from('ai_research_pipeline')
        .update({ status: 'published' })
        .eq('id', item.id);
      
      toast.success('Article published to library!');
      fetchData();
    } else {
      toast.error('Failed to publish');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ElementType }> = {
      researching: { color: 'bg-blue-500/10 text-blue-500', icon: Search },
      drafting: { color: 'bg-purple-500/10 text-purple-500', icon: FileText },
      ai_reviewing: { color: 'bg-yellow-500/10 text-yellow-500', icon: Bot },
      pending_review: { color: 'bg-orange-500/10 text-orange-500', icon: Clock },
      approved: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
      rejected: { color: 'bg-red-500/10 text-red-500', icon: XCircle },
      published: { color: 'bg-primary/10 text-primary', icon: BookOpen },
    };
    
    const { color, icon: Icon } = config[status] || { color: 'bg-muted', icon: Clock };
    
    return (
      <Badge className={cn('gap-1', color)}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Research Engine
          </h1>
          <p className="text-muted-foreground">
            Exponentially grow your knowledge library with AI-powered research and verification
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleBatchProcess} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Batch Process Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inQueue}</p>
                <p className="text-sm text-muted-foreground">In Queue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate New Article
          </CardTitle>
          <CardDescription>
            Enter a rheumatology topic to research and generate a verified article
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="e.g., JAK Inhibitors in Rheumatoid Arthritis, Lupus Nephritis Treatment..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSingleResearch()}
            />
            <Button onClick={handleSingleResearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Research & Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Content Pipeline</TabsTrigger>
          <TabsTrigger value="queue">Research Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Generated Articles</CardTitle>
              <CardDescription>
                Review and publish AI-generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {pipelineItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No articles generated yet. Start by entering a topic above!</p>
                    </div>
                  ) : (
                    pipelineItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(item.status)}
                              {item.disease_area && (
                                <Badge variant="outline">{item.disease_area}</Badge>
                              )}
                              {item.ai_verification_score && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    item.ai_verification_score >= 80 
                                      ? 'border-green-500 text-green-500' 
                                      : item.ai_verification_score >= 60 
                                        ? 'border-yellow-500 text-yellow-500'
                                        : 'border-red-500 text-red-500'
                                  )}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  {item.ai_verification_score}%
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold truncate">
                              {item.generated_title || item.topic}
                            </h3>
                            {item.generated_summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.generated_summary}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {item.status === 'pending_review' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApprove(item)}>
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </>
                            )}
                            {item.status === 'approved' && (
                              <Button size="sm" onClick={() => handlePublish(item)}>
                                <BookOpen className="h-4 w-4 mr-1" />
                                Publish
                              </Button>
                            )}
                            {item.status === 'ai_reviewing' && (
                              <Badge variant="outline" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Needs Review
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Research Topic Queue</CardTitle>
              <CardDescription>
                Topics waiting to be processed by the AI engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                          item.priority >= 8 ? "bg-red-500/10 text-red-500" :
                          item.priority >= 5 ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {item.priority}
                        </div>
                        <div>
                          <p className="font-medium">{item.topic}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.category}</span>
                            {item.disease_area && (
                              <>
                                <span>•</span>
                                <span>{item.disease_area}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={
                        item.status === 'completed' ? 'default' :
                        item.status === 'processing' ? 'secondary' :
                        'outline'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Verification System</AlertTitle>
        <AlertDescription>
          All AI-generated content goes through a multi-step verification process:
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>AI researches topic using medical sources (PubMed, Guidelines, etc.)</li>
            <li>Content is generated following evidence-based standards</li>
            <li>AI fact-checker verifies accuracy, evidence, and safety</li>
            <li>Human expert reviews and approves content</li>
            <li>Only verified content gets published to the library</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}
