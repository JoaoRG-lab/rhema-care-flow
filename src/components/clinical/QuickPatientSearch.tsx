 import { useState, useEffect, useRef } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Search, Clock, User } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent } from '@/components/ui/card';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { cn } from '@/lib/utils';
 import type { PatientCard } from '@/types/clinical';
 
 export function QuickPatientSearch() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [query, setQuery] = useState('');
   const [results, setResults] = useState<PatientCard[]>([]);
   const [recentPatients, setRecentPatients] = useState<PatientCard[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [selectedIndex, setSelectedIndex] = useState(-1);
   const inputRef = useRef<HTMLInputElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
 
   // Fetch recent patients on mount
   useEffect(() => {
     if (!user) return;
     const fetchRecent = async () => {
       const { data } = await supabase
         .from('patient_cards_secure')
         .select('*')
         .eq('user_id', user.id)
         .order('updated_at', { ascending: false })
         .limit(5);
       if (data) setRecentPatients(data);
     };
     fetchRecent();
   }, [user]);
 
   // Search patients
   useEffect(() => {
     if (!user || query.length < 2) {
       setResults([]);
       return;
     }
 
     const search = async () => {
       const { data } = await supabase
         .from('patient_cards_secure')
         .select('*')
         .eq('user_id', user.id)
         .or(`patient_code.ilike.%${query}%,mrn_last4.ilike.%${query}%`)
         .limit(10);
       if (data) setResults(data);
     };
 
     const debounce = setTimeout(search, 200);
     return () => clearTimeout(debounce);
   }, [query, user]);
 
   // Keyboard navigation
   const handleKeyDown = (e: React.KeyboardEvent) => {
     const items = query.length >= 2 ? results : recentPatients;
     if (e.key === 'ArrowDown') {
       e.preventDefault();
       setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
     } else if (e.key === 'ArrowUp') {
       e.preventDefault();
       setSelectedIndex((i) => Math.max(i - 1, 0));
     } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
       navigate(`/patients/${items[selectedIndex].id}`);
       setIsOpen(false);
     } else if (e.key === 'Escape') {
       setIsOpen(false);
     }
   };
 
   // Click outside handler
   useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
       if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
         setIsOpen(false);
       }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);
 
   const displayItems = query.length >= 2 ? results : recentPatients;
 
   return (
     <div ref={containerRef} className="relative w-full max-w-md">
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
           ref={inputRef}
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           onFocus={() => setIsOpen(true)}
           onKeyDown={handleKeyDown}
           placeholder="Quick search patients... (⌘K)"
           className="pl-9 pr-4"
         />
       </div>
 
       {isOpen && (
         <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
           <CardContent className="p-2">
             {query.length < 2 && recentPatients.length > 0 && (
               <p className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
                 <Clock className="h-3 w-3" /> Recent patients
               </p>
             )}
             {displayItems.length === 0 ? (
               <p className="text-sm text-muted-foreground py-4 text-center">
                 {query.length >= 2 ? 'No patients found' : 'Start typing to search...'}
               </p>
             ) : (
               <ul className="space-y-1">
                 {displayItems.map((patient, index) => (
                   <li key={patient.id}>
                     <button
                       onClick={() => {
                         navigate(`/patients/${patient.id}`);
                         setIsOpen(false);
                       }}
                       className={cn(
                         'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                         selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                       )}
                     >
                       <User className="h-4 w-4 text-muted-foreground" />
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm truncate">{patient.patient_code}</p>
                         <div className="flex gap-1 mt-0.5">
                           {patient.diagnosis_tags?.slice(0, 2).map((tag) => (
                             <DiagnosisTag key={tag} tag={tag} size="sm" />
                           ))}
                         </div>
                       </div>
                       {patient.mrn_last4 && (
                         <span className="text-xs text-muted-foreground">MRN: ...{patient.mrn_last4}</span>
                       )}
                     </button>
                   </li>
                 ))}
               </ul>
             )}
           </CardContent>
         </Card>
       )}
     </div>
   );
 }