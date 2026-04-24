import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VISITOR_KEY = 'uhs:visitorId';

function getVisitorId(): string {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

interface ContentVoteButtonsProps {
  contentId: string;
  /** Stop card-link navigation when buttons are inside a clickable card. */
  stopPropagation?: boolean;
  /** Color for the active "useful" thumb (defaults to primary). */
  accentColor?: string;
  className?: string;
}

export function ContentVoteButtons({
  contentId,
  stopPropagation = true,
  accentColor,
  className,
}: ContentVoteButtonsProps) {
  const { user } = useAuth();
  const [helpful, setHelpful] = useState(0);
  const [notHelpful, setNotHelpful] = useState(0);
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const visitorId = user ? null : getVisitorId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('education_content_votes')
        .select('is_helpful, user_id, visitor_id')
        .eq('content_id', contentId);
      if (cancelled || !data) return;
      let up = 0;
      let down = 0;
      let mine: boolean | null = null;
      for (const v of data as Array<{
        is_helpful: boolean;
        user_id: string | null;
        visitor_id: string | null;
      }>) {
        if (v.is_helpful) up += 1;
        else down += 1;
        if (user && v.user_id === user.id) mine = v.is_helpful;
        else if (!user && visitorId && v.visitor_id === visitorId) mine = v.is_helpful;
      }
      setHelpful(up);
      setNotHelpful(down);
      setMyVote(mine);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentId, user, visitorId]);

  const submit = async (e: React.MouseEvent, value: boolean) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (loading) return;
    setLoading(true);

    // Toggle off if clicking the same vote again
    if (myVote === value) {
      const filter = supabase
        .from('education_content_votes')
        .delete()
        .eq('content_id', contentId);
      const { error } = user
        ? await filter.eq('user_id', user.id)
        : await filter.is('user_id', null).eq('visitor_id', visitorId!);
      if (error) {
        toast.error('Could not remove your vote');
      } else {
        if (value) setHelpful((n) => Math.max(0, n - 1));
        else setNotHelpful((n) => Math.max(0, n - 1));
        setMyVote(null);
      }
      setLoading(false);
      return;
    }

    // Upsert: clear any prior vote, insert new one
    if (myVote !== null) {
      const filter = supabase
        .from('education_content_votes')
        .delete()
        .eq('content_id', contentId);
      if (user) await filter.eq('user_id', user.id);
      else await filter.is('user_id', null).eq('visitor_id', visitorId!);
      if (myVote) setHelpful((n) => Math.max(0, n - 1));
      else setNotHelpful((n) => Math.max(0, n - 1));
    }

    const { error } = await supabase.from('education_content_votes').insert({
      content_id: contentId,
      user_id: user?.id ?? null,
      visitor_id: user ? null : visitorId,
      is_helpful: value,
    });

    if (error) {
      toast.error('Could not save your vote');
    } else {
      if (value) setHelpful((n) => n + 1);
      else setNotHelpful((n) => n + 1);
      setMyVote(value);
      toast.success(value ? 'Marked as useful' : 'Marked as not useful');
    }
    setLoading(false);
  };

  const activeStyle = accentColor ? { color: accentColor } : undefined;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Mark as useful"
        aria-pressed={myVote === true}
        onClick={(e) => submit(e, true)}
        disabled={loading}
        className={cn(
          'h-8 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground',
          myVote === true && 'font-semibold',
        )}
        style={myVote === true ? activeStyle : undefined}
      >
        {loading && myVote !== false ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ThumbsUp className={cn('h-3.5 w-3.5', myVote === true && 'fill-current')} />
        )}
        {helpful}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Mark as not useful"
        aria-pressed={myVote === false}
        onClick={(e) => submit(e, false)}
        disabled={loading}
        className={cn(
          'h-8 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground',
          myVote === false && 'font-semibold text-destructive',
        )}
      >
        {loading && myVote === false ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ThumbsDown className={cn('h-3.5 w-3.5', myVote === false && 'fill-current')} />
        )}
        {notHelpful}
      </Button>
    </div>
  );
}
