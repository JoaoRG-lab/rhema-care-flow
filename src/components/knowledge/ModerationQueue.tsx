import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Lightbulb, BookOpen, Stethoscope, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useKnowledgeContributions, KnowledgeContribution, ContributionStatus, ContributionCategory } from '@/hooks/useKnowledgeContributions';

const CATEGORY_ICONS: Record<ContributionCategory, typeof Lightbulb> = {
  clinical_pearl: Lightbulb,
  guideline_summary: BookOpen,
  case_insight: Stethoscope,
  resource: FileText,
};

const CATEGORY_LABELS: Record<ContributionCategory, string> = {
  clinical_pearl: 'Clinical Pearl',
  guideline_summary: 'Guideline Summary',
  case_insight: 'Case Insight',
  resource: 'Resource',
};

export function ModerationQueue() {
  const { user } = useAuth();
  const { moderateContribution } = useKnowledgeContributions();
  const [items, setItems] = useState<KnowledgeContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ContributionStatus>('pending');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_contributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Failed to load moderation queue');
      setItems([]);
    } else {
      setItems((data || []) as KnowledgeContribution[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const counts = useMemo(() => ({
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  }), [items]);

  const filtered = useMemo(
    () => items.filter(i => i.status === tab),
    [items, tab],
  );

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setActingId(id);
    const ok = await moderateContribution(id, decision, notesById[id]);
    if (ok) {
      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notesById[id]?.trim() || null,
      } : i));
      setNotesById(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setActingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Moderation Queue
        </CardTitle>
        <CardDescription>
          Review community contributions before they appear in the public Knowledge Library.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as ContributionStatus)}>
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary" className="ml-1">{counts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
              <Badge variant="secondary" className="ml-1">{counts.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
              <Badge variant="secondary" className="ml-1">{counts.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No {tab} contributions.
              </div>
            ) : (
              filtered.map((c) => {
                const Icon = CATEGORY_ICONS[c.category];
                return (
                  <div key={c.id} className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold">{c.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[c.category]}</Badge>
                            {c.disease_area && (
                              <Badge variant="outline" className="text-xs">{c.disease_area}</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {format(new Date(c.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{c.content}</p>
                        {c.resource_url && (
                          <a
                            href={c.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {c.resource_url}
                          </a>
                        )}
                        {c.reviewer_notes && (
                          <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
                            <span className="font-medium">Reviewer notes:</span> {c.reviewer_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {tab === 'pending' && (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea
                          placeholder="Optional notes for the contributor..."
                          value={notesById[c.id] || ''}
                          onChange={(e) => setNotesById(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="min-h-[60px] text-sm"
                          maxLength={500}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actingId === c.id}
                            onClick={() => handleDecision(c.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={actingId === c.id}
                            onClick={() => handleDecision(c.id, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
