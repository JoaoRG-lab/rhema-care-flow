import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar, ClipboardList, TrendingUp, Shield, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeftRight, MessageSquare, ClipboardPlus, Video, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { VisitHistory } from '@/components/patients/VisitHistory';
import { ScoreTrends } from '@/components/patients/ScoreTrends';
import { AddVisitDialog } from '@/components/patients/AddVisitDialog';
import { PatientMonitoring } from '@/components/patients/PatientMonitoring';
import { TreatmentResponseTimeline } from '@/components/patients/TreatmentResponseTimeline';
import { PatientSmsHistory } from '@/components/patients/PatientSmsHistory';
import { PatientChainAnchorPanel } from '@/components/patients/PatientChainAnchorPanel';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { TeleconsultaLobby } from '@/components/teleconsulta/TeleconsultaLobby';
import { SharePatientCodeDialog } from '@/components/prontuario/SharePatientCodeDialog';

import { EditPatientDialog } from '@/components/patients/EditPatientDialog';
import { DeletePatientDialog } from '@/components/patients/DeletePatientDialog';
import { QuickScoreEntry } from '@/components/patients/QuickScoreEntry';
import { PatientReportExport } from '@/components/patients/PatientReportExport';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';
import type { PatientCard } from '@/types/clinical';
 
 export default function PatientDetail() {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
  const { logAccess } = useAuditLog();
   const isMobile = useIsMobile();
   const [patient, setPatient] = useState<PatientCard | null>(null);
   const [loading, setLoading] = useState(true);
   const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [adjacentPatients, setAdjacentPatients] = useState<{ prev: string | null; next: string | null }>({
     prev: null,
     next: null,
   });
   const [swipeHint, setSwipeHint] = useState<'left' | 'right' | null>(null);
 
   const fetchPatient = async () => {
     if (!user || !id) return;
     const { data, error } = await supabase
        .from('patient_cards_secure')
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
        setPatient(data as PatientCard);
      // Log patient card access for audit trail
      logAccess({
        action: 'view',
        resourceType: 'patient_card',
        resourceId: data.id,
        metadata: { patient_code: data.patient_code }
      });
      
       // Fetch adjacent patients for navigation
       fetchAdjacentPatients(data.patient_code);
     }
     setLoading(false);
   };
 
   const fetchAdjacentPatients = async (currentCode: string) => {
     if (!user) return;
     
     // Get all patients sorted by code to determine prev/next
     const { data: allPatients } = await supabase
       .from('patient_cards_secure')
       .select('id, patient_code')
       .eq('user_id', user.id)
       .order('patient_code', { ascending: true });
     
     if (!allPatients || allPatients.length <= 1) return;
     
     const currentIndex = allPatients.findIndex((p) => p.patient_code === currentCode);
     if (currentIndex === -1) return;
     
     setAdjacentPatients({
       prev: currentIndex > 0 ? allPatients[currentIndex - 1].id : null,
       next: currentIndex < allPatients.length - 1 ? allPatients[currentIndex + 1].id : null,
     });
   };
 
   const navigateToPrev = () => {
     if (adjacentPatients.prev) {
       setSwipeHint('right');
       setTimeout(() => {
         navigate(`/patients/${adjacentPatients.prev}`);
         setSwipeHint(null);
       }, 150);
     }
   };
 
   const navigateToNext = () => {
     if (adjacentPatients.next) {
       setSwipeHint('left');
       setTimeout(() => {
         navigate(`/patients/${adjacentPatients.next}`);
         setSwipeHint(null);
       }, 150);
     }
   };
 
   const swipeRef = useSwipeGesture<HTMLDivElement>({
     onSwipeLeft: navigateToNext,
     onSwipeRight: navigateToPrev,
     threshold: 75,
     enabled: isMobile,
   });
 
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
       <div
         ref={swipeRef}
         className={`p-4 md:p-6 lg:p-8 transition-transform duration-150 ${
           swipeHint === 'left' ? '-translate-x-4 opacity-80' : 
           swipeHint === 'right' ? 'translate-x-4 opacity-80' : ''
         }`}
       >
         {/* Header */}
         <div className="mb-6">
           <div className="flex items-center justify-between mb-4">
             <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="-ml-2">
               <ArrowLeft className="h-4 w-4 mr-2" />
               <span className="hidden sm:inline">Back to Patients</span>
               <span className="sm:hidden">Back</span>
             </Button>
             
             {/* Patient Navigation (visible on mobile) */}
             {isMobile && (adjacentPatients.prev || adjacentPatients.next) && (
               <div className="flex items-center gap-1">
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={navigateToPrev}
                   disabled={!adjacentPatients.prev}
                   className="h-8 w-8"
                 >
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <span className="text-xs text-muted-foreground">Swipe</span>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={navigateToNext}
                   disabled={!adjacentPatients.next}
                   className="h-8 w-8"
                 >
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
             )}
           </div>
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
              <div className="flex flex-wrap gap-2">
                <QuickScoreEntry
                  patientId={patient.id}
                  patientCode={patient.patient_code}
                  diagnosisTags={patient.diagnosis_tags}
                  onScoreSaved={() => setRefreshKey(prev => prev + 1)}
                />
                <PatientReportExport patient={patient} />
                <SharePatientCodeDialog patientCode={patient.patient_code}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                    <Share2 className="h-4 w-4" />
                    Prontuário
                  </Button>
                </SharePatientCodeDialog>
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
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
              <TabsTrigger value="timeline" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Response
              </TabsTrigger>
               <TabsTrigger value="sms" className="gap-2">
                 <MessageSquare className="h-4 w-4" />
                 SMS
               </TabsTrigger>
               <TabsTrigger value="chain" className="gap-2">
                 <Shield className="h-4 w-4" />
                 Chain
               </TabsTrigger>
               <TabsTrigger value="teleconsulta" className="gap-2">
                <Video className="h-4 w-4" />
                Teleconsulta
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-2">
                 <ClipboardPlus className="h-4 w-4" />
                 Prescrições
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
 
            <TabsContent value="timeline">
              <TreatmentResponseTimeline 
                patientId={patient.id} 
                refreshKey={refreshKey}
                patientCode={patient.patient_code}
              />
            </TabsContent>

             <TabsContent value="sms">
               <PatientSmsHistory 
                 patientId={patient.id} 
                 patientCode={patient.patient_code}
                 refreshKey={refreshKey}
               />
             </TabsContent>

             <TabsContent value="teleconsulta" className="mt-0">
               <TeleconsultaLobby
                 patientCardId={patient?.id}
                 patientCode={patient?.patient_code}
                 onEnterRoom={() => {
                   navigate('/teleconsulta');
                 }}
               />
             </TabsContent>
             <TabsContent value="prescriptions">
               {patient && (
                 <PrescriptionList
                   patientId={patient.id}
                   patientCode={patient.patient_code}
                 />
               )}
             </TabsContent>

             <TabsContent value="chain">
               <PatientChainAnchorPanel
                 patientCardId={patient.id}
                 patientCode={patient.patient_code}
               />
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