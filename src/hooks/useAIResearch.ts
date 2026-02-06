import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResearchResult {
  key_findings?: string[];
  sources?: Array<{ title: string; type: string; year?: string; organization?: string }>;
  related_topics?: string[];
  clinical_pearls?: string[];
}

interface ArticleResult {
  title?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  reading_time_minutes?: number;
  references?: string[];
}

interface VerificationResult {
  overall_score: number;
  accuracy_score?: number;
  evidence_score?: number;
  completeness_score?: number;
  clarity_score?: number;
  safety_score?: number;
  passed: boolean;
  critical_issues?: string[];
  suggestions?: string[];
  verification_notes?: string;
}

interface TopicSuggestions {
  subtopics?: Array<{ topic: string; priority: number; category?: string }>;
  related_conditions?: Array<{ topic: string; priority: number }>;
  treatment_topics?: Array<{ topic: string; priority: number }>;
  safety_topics?: Array<{ topic: string; priority: number }>;
  research_frontiers?: Array<{ topic: string; priority: number }>;
}

interface BatchResult {
  processed: number;
  results?: Array<{
    topic: string;
    status: string;
    pipelineId?: string;
    verificationScore?: number;
    newTopicsSuggested?: number;
    error?: string;
  }>;
  message?: string;
}

export function useAIResearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callResearchEngine = async (
    action: 'research' | 'generate' | 'verify' | 'suggest_topics' | 'batch_process',
    params: {
      topic?: string;
      content?: string;
      diseaseArea?: string;
      pipelineId?: string;
    } = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-research-engine', {
        body: { action, ...params },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || 'Unknown error');

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to call AI research engine';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const performResearch = async (topic: string, diseaseArea?: string): Promise<ResearchResult> => {
    return callResearchEngine('research', { topic, diseaseArea });
  };

  const generateArticle = async (topic: string, diseaseArea?: string): Promise<ArticleResult> => {
    return callResearchEngine('generate', { topic, diseaseArea });
  };

  const verifyContent = async (content: string): Promise<VerificationResult> => {
    return callResearchEngine('verify', { content });
  };

  const suggestTopics = async (topic: string, diseaseArea?: string): Promise<TopicSuggestions> => {
    return callResearchEngine('suggest_topics', { topic, diseaseArea });
  };

  const batchProcess = async (): Promise<BatchResult> => {
    return callResearchEngine('batch_process');
  };

  return {
    isLoading,
    error,
    performResearch,
    generateArticle,
    verifyContent,
    suggestTopics,
    batchProcess,
  };
}
