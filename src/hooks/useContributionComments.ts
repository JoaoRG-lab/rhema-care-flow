import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ContributionComment {
  id: string;
  contribution_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  // Enriched fields
  author_name?: string;
  author_tier?: string;
  replies?: ContributionComment[];
}

export function useContributionComments(contributionId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ContributionComment[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch comments for a contribution
  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('contribution_comments')
      .select('*')
      .eq('contribution_id', contributionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Enrich with author info
      const userIds = [...new Set(data.map(c => c.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const { data: verifications } = await supabase
        .from('verification_requests')
        .select('user_id, tier, status')
        .in('user_id', userIds)
        .eq('status', 'approved');

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
      const tierMap = Object.fromEntries((verifications || []).map(v => [v.user_id, v.tier]));

      // Build threaded structure
      const enrichedComments = data.map(comment => ({
        ...comment,
        author_name: profileMap[comment.user_id] || 'Anonymous',
        author_tier: tierMap[comment.user_id] || null,
        replies: [] as ContributionComment[],
      }));

      // Organize into tree structure
      const commentMap = new Map<string, ContributionComment>();
      const rootComments: ContributionComment[] = [];

      enrichedComments.forEach(comment => {
        commentMap.set(comment.id, comment);
      });

      enrichedComments.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)!;
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } else {
      setComments([]);
    }

    setLoading(false);
  }, [contributionId]);

  // Add a new comment
  const addComment = useCallback(async (content: string, parentId?: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to comment');
      return false;
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return false;
    }

    const { error } = await supabase
      .from('contribution_comments')
      .insert({
        contribution_id: contributionId,
        user_id: user.id,
        parent_id: parentId || null,
        content: content.trim(),
      });

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return false;
    }

    await fetchComments();
    return true;
  }, [user, contributionId, fetchComments]);

  // Edit a comment
  const editComment = useCallback(async (commentId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('contribution_comments')
      .update({ 
        content: content.trim(),
        is_edited: true,
      })
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to edit comment');
      return false;
    }

    await fetchComments();
    return true;
  }, [user, fetchComments]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('contribution_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete comment');
      return false;
    }

    toast.success('Comment deleted');
    await fetchComments();
    return true;
  }, [user, fetchComments]);

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
  };
}
