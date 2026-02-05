 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import type { EducationContent, CreateEducationContentInput, UpdateEducationContentInput } from '@/types/education';
 
 // Generate slug from title
 function generateSlug(title: string): string {
   return title
     .toLowerCase()
     .replace(/[^a-z0-9\s-]/g, '')
     .replace(/\s+/g, '-')
     .replace(/-+/g, '-')
     .trim();
 }
 
 export function useEducationContent() {
   const { user } = useAuth();
   const [content, setContent] = useState<EducationContent[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchContent = useCallback(async (publishedOnly = false) => {
     if (!user) return;
     
     setLoading(true);
     try {
       let query = supabase
         .from('education_content')
         .select('*')
         .order('created_at', { ascending: false });
       
       if (publishedOnly) {
         query = query.eq('is_published', true);
       }
       
       const { data, error } = await query;
       
       if (error) throw error;
       setContent((data || []) as EducationContent[]);
     } catch (error) {
       console.error('Error fetching education content:', error);
       toast.error('Failed to load education content');
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   const createContent = async (input: CreateEducationContentInput): Promise<EducationContent | null> => {
     if (!user) return null;
     
     try {
       const slug = generateSlug(input.title) + '-' + Date.now().toString(36);
       
       const { data, error } = await supabase
         .from('education_content')
         .insert({
           ...input,
           slug,
           author_id: user.id,
           published_at: input.is_published ? new Date().toISOString() : null,
         })
         .select()
         .single();
       
       if (error) throw error;
       
       toast.success('Content created successfully');
       await fetchContent();
       return data as EducationContent;
     } catch (error: any) {
       console.error('Error creating content:', error);
       toast.error(error.message || 'Failed to create content');
       return null;
     }
   };
 
   const updateContent = async (input: UpdateEducationContentInput): Promise<boolean> => {
     if (!user) return false;
     
     try {
       const { id, ...updates } = input;
       
       // If publishing for the first time, set published_at
       if (updates.is_published) {
         const existing = content.find(c => c.id === id);
         if (existing && !existing.published_at) {
           (updates as any).published_at = new Date().toISOString();
         }
       }
       
       const { error } = await supabase
         .from('education_content')
         .update(updates)
         .eq('id', id);
       
       if (error) throw error;
       
       toast.success('Content updated successfully');
       await fetchContent();
       return true;
     } catch (error: any) {
       console.error('Error updating content:', error);
       toast.error(error.message || 'Failed to update content');
       return false;
     }
   };
 
   const deleteContent = async (id: string): Promise<boolean> => {
     if (!user) return false;
     
     try {
       const { error } = await supabase
         .from('education_content')
         .delete()
         .eq('id', id);
       
       if (error) throw error;
       
       toast.success('Content deleted successfully');
       await fetchContent();
       return true;
     } catch (error: any) {
       console.error('Error deleting content:', error);
       toast.error(error.message || 'Failed to delete content');
       return false;
     }
   };
 
   const togglePublish = async (id: string, publish: boolean): Promise<boolean> => {
     return updateContent({
       id,
       is_published: publish,
     });
   };
 
   useEffect(() => {
     fetchContent();
   }, [fetchContent]);
 
   return {
     content,
     loading,
     fetchContent,
     createContent,
     updateContent,
     deleteContent,
     togglePublish,
   };
 }