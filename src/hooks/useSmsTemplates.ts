 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export interface CustomSMSTemplate {
   id: string;
   user_id: string;
   name: string;
   category: 'appointment' | 'medication' | 'lab' | 'general';
   message: string;
   variables: string[];
   is_active: boolean;
   created_at: string;
   updated_at: string;
 }
 
 export type CreateTemplateInput = Pick<CustomSMSTemplate, 'name' | 'category' | 'message' | 'variables'>;
 export type UpdateTemplateInput = Partial<CreateTemplateInput> & { is_active?: boolean };
 
 export function useSmsTemplates() {
   const { user } = useAuth();
   const [templates, setTemplates] = useState<CustomSMSTemplate[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchTemplates = useCallback(async () => {
     if (!user) {
       setTemplates([]);
       setLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from('sms_templates')
         .select('*')
         .eq('user_id', user.id)
         .eq('is_active', true)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setTemplates(data as CustomSMSTemplate[]);
     } catch (error) {
       console.error('Error fetching SMS templates:', error);
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchTemplates();
   }, [fetchTemplates]);
 
   const createTemplate = async (input: CreateTemplateInput): Promise<CustomSMSTemplate | null> => {
     if (!user) return null;
 
     try {
       const { data, error } = await supabase
         .from('sms_templates')
         .insert({
           user_id: user.id,
           name: input.name,
           category: input.category,
           message: input.message,
           variables: input.variables,
         })
         .select()
         .single();
 
       if (error) throw error;
 
       const newTemplate = data as CustomSMSTemplate;
       setTemplates(prev => [newTemplate, ...prev]);
       toast.success('Template saved');
       return newTemplate;
     } catch (error) {
       console.error('Error creating template:', error);
       toast.error('Failed to save template');
       return null;
     }
   };
 
   const updateTemplate = async (id: string, input: UpdateTemplateInput): Promise<boolean> => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('sms_templates')
         .update(input)
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setTemplates(prev => prev.map(t => 
         t.id === id ? { ...t, ...input, updated_at: new Date().toISOString() } : t
       ));
       toast.success('Template updated');
       return true;
     } catch (error) {
       console.error('Error updating template:', error);
       toast.error('Failed to update template');
       return false;
     }
   };
 
   const deleteTemplate = async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('sms_templates')
         .delete()
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setTemplates(prev => prev.filter(t => t.id !== id));
       toast.success('Template deleted');
       return true;
     } catch (error) {
       console.error('Error deleting template:', error);
       toast.error('Failed to delete template');
       return false;
     }
   };
 
   const getTemplatesByCategory = (category: CustomSMSTemplate['category']) => {
     return templates.filter(t => t.category === category);
   };
 
   return {
     templates,
     loading,
     createTemplate,
     updateTemplate,
     deleteTemplate,
     getTemplatesByCategory,
     refetch: fetchTemplates,
   };
 }
 
 // Helper to extract variables from message
 export function extractVariables(message: string): string[] {
   const matches = message.match(/\{\{(\w+)\}\}/g);
   if (!matches) return [];
   return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
 }