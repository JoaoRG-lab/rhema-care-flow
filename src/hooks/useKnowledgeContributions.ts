import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ContributionCategory = 'clinical_pearl' | 'guideline_summary' | 'case_insight' | 'resource';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface KnowledgeContribution {
  id: string;
  user_id: string;
  category: ContributionCategory;
  title: string;
  content: string;
  disease_area: string | null;
  resource_url: string | null;
  status: ContributionStatus;
  is_featured: boolean;
  helpful_count: number;
  view_count: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author_name?: string;
  author_tier?: string;
  user_has_voted?: boolean;
}

export interface CreateContributionInput {
  category: ContributionCategory;
  title: string;
  content: string;
  disease_area?: string;
  resource_url?: string;
}

export function useKnowledgeContributions() {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<KnowledgeContribution[]>([]);
  const [myContributions, setMyContributions] = useState<KnowledgeContribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch approved contributions (community feed)
  const fetchApprovedContributions = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('knowledge_contributions')
      .select('*')
      .eq('status', 'approved')
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching contributions:', error);
      toast.error('Failed to load contributions');
    } else if (data) {
      // Fetch author info and user votes
      const enrichedContributions = await enrichContributions(data);
      setContributions(enrichedContributions);
    }
    
    setLoading(false);
  }, [user]);

  // Fetch user's own contributions
  const fetchMyContributions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('knowledge_contributions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my contributions:', error);
    } else if (data) {
      setMyContributions(data as KnowledgeContribution[]);
    }
  }, [user]);

  // Enrich contributions with author info and vote status
  const enrichContributions = async (data: any[]): Promise<KnowledgeContribution[]> => {
    if (!data.length) return [];

    // Get unique user IDs
    const userIds = [...new Set(data.map(c => c.user_id))];
    
    // Fetch profiles for authors
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    // Fetch verification status for authors
    const { data: verifications } = await supabase
      .from('verification_requests')
      .select('user_id, tier, status')
      .in('user_id', userIds)
      .eq('status', 'approved');

    // Fetch user's votes if logged in
    let userVotes: Record<string, boolean> = {};
    if (user) {
      const { data: votes } = await supabase
        .from('contribution_votes')
        .select('contribution_id')
        .eq('user_id', user.id);
      
      if (votes) {
        userVotes = Object.fromEntries(votes.map(v => [v.contribution_id, true]));
      }
    }

    // Create lookup maps
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name]));
    const tierMap = Object.fromEntries((verifications || []).map(v => [v.user_id, v.tier]));

    return data.map(contribution => ({
      ...contribution,
      author_name: profileMap[contribution.user_id] || 'Anonymous',
      author_tier: tierMap[contribution.user_id] || null,
      user_has_voted: userVotes[contribution.id] || false,
    }));
  };

  // Create a new contribution
  const createContribution = useCallback(async (input: CreateContributionInput): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to contribute');
      return false;
    }

    const { error } = await supabase
      .from('knowledge_contributions')
      .insert({
        user_id: user.id,
        category: input.category,
        title: input.title,
        content: input.content,
        disease_area: input.disease_area || null,
        resource_url: input.resource_url || null,
      });

    if (error) {
      console.error('Error creating contribution:', error);
      toast.error('Failed to submit contribution');
      return false;
    }

    toast.success('Contribution submitted for review');
    await fetchMyContributions();
    return true;
  }, [user, fetchMyContributions]);

  // Vote on a contribution
  const voteOnContribution = useCallback(async (contributionId: string, isHelpful: boolean = true): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to vote');
      return false;
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('contribution_votes')
      .select('id')
      .eq('contribution_id', contributionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      // Remove vote (toggle off)
      const { error } = await supabase
        .from('contribution_votes')
        .delete()
        .eq('id', existingVote.id);

      if (error) {
        toast.error('Failed to remove vote');
        return false;
      }

      // Update local state
      setContributions(prev => prev.map(c => 
        c.id === contributionId 
          ? { ...c, helpful_count: c.helpful_count - 1, user_has_voted: false }
          : c
      ));
      return true;
    }

    // Add new vote
    const { error } = await supabase
      .from('contribution_votes')
      .insert({
        contribution_id: contributionId,
        user_id: user.id,
        is_helpful: isHelpful,
      });

    if (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote');
      return false;
    }

    // Update local state
    setContributions(prev => prev.map(c => 
      c.id === contributionId 
        ? { ...c, helpful_count: c.helpful_count + 1, user_has_voted: true }
        : c
    ));

    return true;
  }, [user]);

  // Delete own contribution
  const deleteContribution = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('knowledge_contributions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete contribution');
      return false;
    }

    toast.success('Contribution deleted');
    await fetchMyContributions();
    return true;
  }, [user, fetchMyContributions]);

  // Initial fetch
  useEffect(() => {
    fetchApprovedContributions();
    if (user) {
      fetchMyContributions();
    }
  }, [fetchApprovedContributions, fetchMyContributions, user]);

  return {
    contributions,
    myContributions,
    loading,
    createContribution,
    voteOnContribution,
    deleteContribution,
    refreshContributions: fetchApprovedContributions,
    refreshMyContributions: fetchMyContributions,
  };
}
