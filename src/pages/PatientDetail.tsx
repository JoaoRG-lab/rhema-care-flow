 import { useEffect, useState } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { ArrowLeft, Calendar, ClipboardList, TrendingUp, Shield, Pencil, Trash2 } from 'lucide-react';
 import { format } from 'date-fns';
 import { toast } from 'sonner';
 import { VisitHistory } from '@/components/patients/VisitHistory';
 import { ScoreTrends } from '@/components/patients/ScoreTrends';
 import { AddVisitDialog } from '@/components/patients/AddVisitDialog';
 import { PatientMonitoring } from '@/components/patients/PatientMonitoring';
 import { EditPatientDialog } from '@/components/patients/EditPatientDialog';
 import { DeletePatientDialog } from '@/components/patients/DeletePatientDialog';
import { useAuditLog } from '@/hooks/useAuditLog';
 
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
 
 export default function PatientDetail() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
  const { logAccess } = useAuditLog();
   const [patient, setPatient] = useState<PatientCard | null>(null);
   const [loading, setLoading] = useState(true);
   const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
 
   const fetchPatient = async () => {
     if (!user || !id) return;
     const { data, error } = await supabase
       .from('patient_cards')
       .select('*')
       .eq('id', id)
       .eq('user_id', user.id)
       .maybeSingle();
 
     if (error) {
       toast.error('Failed to load patient');
       navigate('/patients');
     } else if (!data) {
       toast.error('Patient not found');
       navigate('/patients');
     } else {
       setPatient(data);
      // Log patient card access for audit trail
      logAccess({
        action: 'view',
        resourceType: 'patient_card',
        resourceId: data.id,
        metadata: { patient_code: data.patient_code }
      });
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchPatient();
   }, [user, id]);
 
   const handleVisitAdded = () => {
     setRefreshKey(prev => prev + 1);
     setIsAddVisitOpen(false);
     fetchPatient(); // Refresh patient data to update last_visit_date
   };
   
   const handlePatientUpdated = () => {
     fetchPatient();
   };
 
   const handlePatientDeleted = () => {
     navigate('/patients');
   };
 
   if (loading) {
     return (
       <AppLayout>
         <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
           <p className="text-muted-foreground">Loading patient...</p>
         </div>
       </AppLayout>
     );
   }
 
   if (!patient) return null;
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         {/* Header */}
         <div className="mb-6">
           <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="mb-4 -ml-2">
             <ArrowLeft className="h-4 w-4 mr-2" />
             Back to Patients
           </Button>
           <div className="flex items-start justify-between">
             <div>
               <h1 className="text-2xl font-bold flex items-center gap-3">
                 {patient.patient_code}
                 {patient.mrn_last4 && (
                   <span className="text-base font-normal text-muted-foreground">...{patient.mrn_last4}</span>
                 )}
               </h1>
               <div className="flex flex-wrap gap-1.5 mt-2">
                 {patient.diagnosis_tags?.map((tag) => (
                   <DiagnosisTag key={tag} tag={tag} size="md" />
                 ))}
                 {patient.therapy_tags?.map((tag) => (
                   <DiagnosisTag key={tag} tag={tag} size="md" />
                 ))}
                 {patient.risk_flags?.map((tag) => (
                   <DiagnosisTag key={tag} tag={tag} size="md" />
                 ))}
               </div>
             </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <AddVisitDialog 
                  patientId={patient.id} 
                  open={isAddVisitOpen} 
                  onOpenChange={setIsAddVisitOpen}
                  onVisitAdded={handleVisitAdded}
                />
              </div>
           </div>
         </div>
 
         {/* Info Cards */}
         <div className="grid md:grid-cols-3 gap-4 mb-6">
           <Card>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-primary/10">
                   <Calendar className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Last Visit</p>
                   <p className="font-medium">
                     {patient.last_visit_date 
                       ? format(new Date(patient.last_visit_date), 'MMM d, yyyy')
                       : 'No visits yet'}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-info/10">
                   <Calendar className="h-5 w-5 text-info" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Next Follow-up</p>
                   <p className="font-medium">
                     {patient.next_followup_date 
                       ? format(new Date(patient.next_followup_date), 'MMM d, yyyy')
                       : 'Not scheduled'}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-success/10">
                   <ClipboardList className="h-5 w-5 text-success" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">Created</p>
                   <p className="font-medium">
                     {format(new Date(patient.created_at), 'MMM d, yyyy')}
                   </p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Notes */}
         {patient.notes && (
           <Card className="mb-6">
             <CardHeader className="pb-2">
               <CardTitle className="text-base">Notes</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground whitespace-pre-wrap">{patient.notes}</p>
             </CardContent>
           </Card>
         )}
 
         {/* Tabs for Visits and Scores */}
         <Tabs defaultValue="visits" className="space-y-4">
           <TabsList>
             <TabsTrigger value="visits" className="gap-2">
               <ClipboardList className="h-4 w-4" />
               Visit History
             </TabsTrigger>
             <TabsTrigger value="scores" className="gap-2">
               <TrendingUp className="h-4 w-4" />
               Score Trends
             </TabsTrigger>
             <TabsTrigger value="monitoring" className="gap-2">
               <Shield className="h-4 w-4" />
               Monitoring
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="visits">
            <VisitHistory 
              patientId={patient.id} 
              refreshKey={refreshKey} 
              patientCode={patient.patient_code}
              diagnosisTags={patient.diagnosis_tags}
            />
           </TabsContent>
 
           <TabsContent value="scores">
             <ScoreTrends 
               patientId={patient.id} 
               refreshKey={refreshKey} 
               patientCode={patient.patient_code}
               diagnosisTags={patient.diagnosis_tags}
             />
           </TabsContent>
 
           <TabsContent value="monitoring">
             <PatientMonitoring patientId={patient.id} refreshKey={refreshKey} />
           </TabsContent>
         </Tabs>
           
           <EditPatientDialog 
             patient={patient} 
             open={isEditOpen} 
             onOpenChange={setIsEditOpen}
             onPatientUpdated={handlePatientUpdated}
           />
           
           <DeletePatientDialog
             patientId={patient.id}
             patientCode={patient.patient_code}
             open={isDeleteOpen}
             onOpenChange={setIsDeleteOpen}
             onDeleted={handlePatientDeleted}
           />
       </div>
     </AppLayout>
   );
 }