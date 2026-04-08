import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, XCircle, Users, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PeerReview {
  id: string;
  content_type: string;
  content_id: string;
  reviewer_id: string;
  reviewer_specialty: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  checklist: Record<string, boolean>;
  reviewed_at: string | null;
  created_at: string;
}

interface PeerReviewPanelProps {
  contentId: string;
  contentType: 'education' | 'knowledge_contribution';
}

const REVIEW_CHECKLIST = [
  { key: 'factual_accuracy', label: 'Factual accuracy verified' },
  { key: 'evidence_based', label: 'Evidence-based with proper citations' },
  { key: 'clinical_relevance', label: 'Clinically relevant and applicable' },
  { key: 'no_bias', label: 'Free from commercial bias' },
  { key: 'up_to_date', label: 'Reflects current guidelines' },
  { key: 'clear_language', label: 'Clear and appropriate language' },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', label: 'Pending' },
  in_progress: { icon: Clock, color: 'text-blue-500', label: 'In Progress' },
  approved: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Approved' },
  revision_requested: { icon: AlertTriangle, color: 'text-orange-500', label: 'Revision Requested' },
  rejected: { icon: XCircle, color: 'text-destructive', label: 'Rejected' },
};

export function PeerReviewPanel({ contentId, contentType }: PeerReviewPanelProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<PeerReview | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [contentId]);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from('peer_reviews')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (data) {
      setReviews(data as unknown as PeerReview[]);
      const mine = data.find((r: any) => r.reviewer_id === user?.id);
      if (mine) {
        setMyReview(mine as unknown as PeerReview);
        setFeedback((mine as any).feedback || '');
        setScore((mine as any).score?.toString() || '');
        setChecklist((mine as any).checklist || {});
      }
    }
    setLoading(false);
  }

  const approvedCount = reviews.filter(r => r.status === 'approved').length;
  const isFullyReviewed = approvedCount >= 2;

  async function submitReview(status: 'approved' | 'revision_requested' | 'rejected') {
    if (!myReview) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('peer_reviews')
      .update({
        status,
        feedback,
        score: score ? parseInt(score) : null,
        checklist,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq('id', myReview.id);

    if (error) {
      toast.error('Failed to submit review');
    } else {
      toast.success(`Review ${status === 'approved' ? 'approved' : 'submitted'}`);
      loadReviews();
    }
    setSubmitting(false);
  }

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Peer Review Status
          {isFullyReviewed && (
            <Badge variant="default" className="ml-auto bg-emerald-600">
              <ShieldCheck className="h-3 w-3 mr-1" /> Fully Reviewed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{approvedCount}/2 expert approvals</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, (approvedCount / 2) * 100)}%` }}
            />
          </div>
        </div>

        {reviews.map((review) => {
          const cfg = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending;
          const Icon = cfg.icon;
          return (
            <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Icon className={`h-5 w-5 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cfg.label}</span>
                  {review.reviewer_specialty && (
                    <Badge variant="outline" className="text-xs">{review.reviewer_specialty}</Badge>
                  )}
                  {review.score && (
                    <span className="text-xs text-muted-foreground ml-auto">{review.score}/10</span>
                  )}
                </div>
                {review.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.feedback}</p>
                )}
              </div>
            </div>
          );
        })}

        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No peer reviews assigned yet. At least 2 independent expert reviews are required.
          </p>
        )}

        {myReview && myReview.status === 'pending' && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Your Review</h4>

              <div className="space-y-2">
                {REVIEW_CHECKLIST.map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist[item.key] || false}
                      onChange={(e) => setChecklist(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="rounded border-border"
                    />
                    {item.label}
                  </label>
                ))}
              </div>

              <Select value={score} onValueChange={setScore}>
                <SelectTrigger>
                  <SelectValue placeholder="Quality Score (1-10)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}/10</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Detailed feedback for the author..."
                rows={4}
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => submitReview('approved')}
                  disabled={submitting || !score}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => submitReview('revision_requested')}
                  disabled={submitting || !feedback}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> Request Revision
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => submitReview('rejected')}
                  disabled={submitting || !feedback}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
