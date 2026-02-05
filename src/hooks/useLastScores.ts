 import { useState, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 export interface LastScoreData {
   scoreType: string;
   calculatedScore: number | null;
   dataJson: Record<string, any>;
   createdAt: string;
 }
 
 export function useLastScores(patientId: string | null) {
   const { user } = useAuth();
   const [lastScores, setLastScores] = useState<Record<string, LastScoreData>>({});
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchLastScores = async () => {
       if (!user || !patientId) {
         setLastScores({});
         setLoading(false);
         return;
       }
 
       try {
         // Get the most recent score for each score type
         const { data, error } = await supabase
           .from('score_entries')
           .select('score_type, calculated_score, data_json, created_at')
           .eq('patient_card_id', patientId)
           .eq('user_id', user.id)
           .order('created_at', { ascending: false });
 
         if (error) throw error;
 
         // Group by score_type, keeping only the most recent
         const grouped: Record<string, LastScoreData> = {};
         data?.forEach((score) => {
           if (!grouped[score.score_type]) {
             grouped[score.score_type] = {
               scoreType: score.score_type,
               calculatedScore: score.calculated_score,
               dataJson: score.data_json as Record<string, any>,
               createdAt: score.created_at,
             };
           }
         });
 
         setLastScores(grouped);
       } catch (error) {
         console.error('Error fetching last scores:', error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchLastScores();
   }, [user, patientId]);
 
   const getLastScore = (scoreType: string): LastScoreData | null => {
     return lastScores[scoreType] || null;
   };
 
   return { lastScores, loading, getLastScore };
 }