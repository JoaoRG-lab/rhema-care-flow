 import { useEffect, useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Plus, Search, Calendar, User } from 'lucide-react';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
 
 interface PatientCard {
   id: string;
   patient_code: string;
   mrn_last4: string | null;
   diagnosis_tags: string[];
   therapy_tags: string[];
   risk_flags: string[];
   last_visit_date: string | null;
   next_followup_date: string | null;
   notes: string | null;
   created_at: string;
 }
 
 const DIAGNOSIS_OPTIONS = ['RA', 'SLE', 'SpA', 'PsA', 'Vasculitis', 'FM'];
 const THERAPY_OPTIONS = ['biologic', 'infusion', 'MTX', 'LEF', 'HCQ', 'JAK-i'];
 const RISK_OPTIONS = ['pregnancy', 'infection', 'TB+', 'HBV+'];
 
 export default function Patients() {
   const { user } = useAuth();
   const [patients, setPatients] = useState<PatientCard[]>([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [loading, setLoading] = useState(true);
 
   // Form state
   const [patientCode, setPatientCode] = useState('');
   const [mrnLast4, setMrnLast4] = useState('');
   const [diagnosisTags, setDiagnosisTags] = useState<string[]>([]);
   const [therapyTags, setTherapyTags] = useState<string[]>([]);
   const [riskFlags, setRiskFlags] = useState<string[]>([]);
   const [notes, setNotes] = useState('');
   const [nextFollowup, setNextFollowup] = useState('');
 
   const fetchPatients = async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('patient_cards')
       .select('*')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false });
 
     if (data) setPatients(data);
     if (error) toast.error('Failed to load patients');
     setLoading(false);
   };
 
   useEffect(() => {
     fetchPatients();
   }, [user]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     const { error } = await supabase.from('patient_cards').insert({
       user_id: user.id,
       patient_code: patientCode,
       mrn_last4: mrnLast4 || null,
       diagnosis_tags: diagnosisTags,
       therapy_tags: therapyTags,
       risk_flags: riskFlags,
       notes: notes || null,
       next_followup_date: nextFollowup || null,
     });
 
     if (error) {
       toast.error('Failed to create patient card');
     } else {
       toast.success('Patient card created');
       setIsOpen(false);
       resetForm();
       fetchPatients();
     }
   };
 
   const resetForm = () => {
     setPatientCode('');
     setMrnLast4('');
     setDiagnosisTags([]);
     setTherapyTags([]);
     setRiskFlags([]);
     setNotes('');
     setNextFollowup('');
   };
 
   const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
     if (arr.includes(item)) {
       setter(arr.filter(i => i !== item));
     } else {
       setter([...arr, item]);
     }
   };
 
   const filteredPatients = patients.filter(p => {
     const matchesSearch = p.patient_code.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesFilters = selectedFilters.length === 0 || 
       selectedFilters.some(f => 
         p.diagnosis_tags.includes(f) || 
         p.therapy_tags.includes(f) || 
         p.risk_flags.includes(f)
       );
     return matchesSearch && matchesFilters;
   });
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-bold">Patient Cards</h1>
             <p className="text-muted-foreground">De-identified patient tracking</p>
           </div>
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogTrigger asChild>
               <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                 New Patient
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>New Patient Card</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="patientCode">Patient Code *</Label>
                     <Input
                       id="patientCode"
                       value={patientCode}
                       onChange={(e) => setPatientCode(e.target.value)}
                       placeholder="e.g., RA-001"
                       required
                       className="mt-1"
                     />
                   </div>
                   <div>
                     <Label htmlFor="mrnLast4">MRN Last 4</Label>
                     <Input
                       id="mrnLast4"
                       value={mrnLast4}
                       onChange={(e) => setMrnLast4(e.target.value)}
                       placeholder="e.g., 1234"
                       maxLength={4}
                       className="mt-1"
                     />
                   </div>
                 </div>
 
                 <div>
                   <Label>Diagnosis</Label>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {DIAGNOSIS_OPTIONS.map((dx) => (
                       <DiagnosisTag
                         key={dx}
                         tag={dx}
                         size="md"
                         onClick={() => toggleArrayItem(diagnosisTags, dx, setDiagnosisTags)}
                         selected={diagnosisTags.includes(dx)}
                       />
                     ))}
                   </div>
                 </div>
 
                 <div>
                   <Label>Therapy</Label>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {THERAPY_OPTIONS.map((tx) => (
                       <DiagnosisTag
                         key={tx}
                         tag={tx}
                         size="md"
                         onClick={() => toggleArrayItem(therapyTags, tx, setTherapyTags)}
                         selected={therapyTags.includes(tx)}
                       />
                     ))}
                   </div>
                 </div>
 
                 <div>
                   <Label>Risk Flags</Label>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {RISK_OPTIONS.map((risk) => (
                       <DiagnosisTag
                         key={risk}
                         tag={risk}
                         size="md"
                         onClick={() => toggleArrayItem(riskFlags, risk, setRiskFlags)}
                         selected={riskFlags.includes(risk)}
                       />
                     ))}
                   </div>
                 </div>
 
                 <div>
                   <Label htmlFor="nextFollowup">Next Follow-up</Label>
                   <Input
                     id="nextFollowup"
                     type="date"
                     value={nextFollowup}
                     onChange={(e) => setNextFollowup(e.target.value)}
                     className="mt-1"
                   />
                 </div>
 
                 <div>
                   <Label htmlFor="notes">Notes (non-identifying)</Label>
                   <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Clinical notes without identifiers..."
                     className="mt-1"
                     rows={3}
                   />
                 </div>
 
                 <Button type="submit" className="w-full">Create Patient Card</Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Search & Filters */}
         <div className="mb-6 space-y-4">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search by patient code..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
           </div>
           <div className="flex flex-wrap gap-2">
             {[...DIAGNOSIS_OPTIONS, 'biologic', 'infusion', 'pregnancy', 'infection'].map((filter) => (
               <DiagnosisTag
                 key={filter}
                 tag={filter}
                 size="md"
                 onClick={() => toggleArrayItem(selectedFilters, filter, setSelectedFilters)}
                 selected={selectedFilters.includes(filter)}
               />
             ))}
           </div>
         </div>
 
         {/* Patient Grid */}
         {loading ? (
           <div className="text-center py-12 text-muted-foreground">Loading...</div>
         ) : filteredPatients.length === 0 ? (
           <div className="text-center py-12">
             <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
             <p className="text-muted-foreground">No patient cards found</p>
             <p className="text-sm text-muted-foreground mt-1">Create your first patient card to get started</p>
           </div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredPatients.map((patient) => (
               <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
                 <CardHeader className="pb-2">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-base">{patient.patient_code}</CardTitle>
                     {patient.mrn_last4 && (
                       <span className="text-xs text-muted-foreground">...{patient.mrn_last4}</span>
                     )}
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="flex flex-wrap gap-1 mb-3">
                     {patient.diagnosis_tags.map((tag) => (
                       <DiagnosisTag key={tag} tag={tag} />
                     ))}
                     {patient.therapy_tags.map((tag) => (
                       <DiagnosisTag key={tag} tag={tag} />
                     ))}
                     {patient.risk_flags.map((tag) => (
                       <DiagnosisTag key={tag} tag={tag} />
                     ))}
                   </div>
                   {patient.next_followup_date && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Calendar className="h-4 w-4" />
                       Next: {format(new Date(patient.next_followup_date), 'MMM d, yyyy')}
                     </div>
                   )}
                   {patient.notes && (
                     <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                       {patient.notes}
                     </p>
                   )}
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </div>
     </AppLayout>
   );
 }