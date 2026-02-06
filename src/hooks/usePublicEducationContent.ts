import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EducationContent } from '@/types/education';

export function usePublicEducationContent() {
  const [content, setContent] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_content')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;

      setContent((data || []) as EducationContent[]);
    } catch (error) {
      console.error('Error fetching public education content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    refetch: fetchContent,
  };
}
