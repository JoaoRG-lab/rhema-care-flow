 import { useState, useEffect } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 
 export type AppRole = 'admin' | 'moderator' | 'user';
 
 export function useUserRole() {
   const { user } = useAuth();
   const [roles, setRoles] = useState<AppRole[]>([]);
   const [isAdmin, setIsAdmin] = useState(false);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchRoles = async () => {
       if (!user) {
         setRoles([]);
         setIsAdmin(false);
         setLoading(false);
         return;
       }
 
       try {
         const { data, error } = await supabase
           .from('user_roles')
           .select('role')
           .eq('user_id', user.id);
 
         if (error) throw error;
 
         const userRoles = (data || []).map((r) => r.role as AppRole);
         setRoles(userRoles);
         setIsAdmin(userRoles.includes('admin'));
       } catch (error) {
         console.error('Error fetching user roles:', error);
         setRoles([]);
         setIsAdmin(false);
       } finally {
         setLoading(false);
       }
     };
 
     fetchRoles();
   }, [user]);
 
   return { roles, isAdmin, loading };
 }