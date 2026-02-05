 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
 import { DIAGNOSIS_OPTIONS, THERAPY_OPTIONS, RISK_OPTIONS } from '@/config/clinical';
 import type { PatientCard } from '@/types/clinical';
 
 interface EditPatientDialogProps {
   patient: PatientCard;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onPatientUpdated: () => void;
 }
 
 export function EditPatientDialog({ patient, open, onOpenChange, onPatientUpdated }: EditPatientDialogProps) {
  const { logAccess } = useAuditLog();
   const [patientCode, setPatientCode] = useState(patient.patient_code);
   const [mrnLast4, setMrnLast4] = useState(patient.mrn_last4 || '');
   const [diagnosisTags, setDiagnosisTags] = useState<string[]>(patient.diagnosis_tags || []);
   const [therapyTags, setTherapyTags] = useState<string[]>(patient.therapy_tags || []);
   const [riskFlags, setRiskFlags] = useState<string[]>(patient.risk_flags || []);
   const [notes, setNotes] = useState(patient.notes || '');
   const [nextFollowup, setNextFollowup] = useState(patient.next_followup_date || '');
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     setPatientCode(patient.patient_code);
     setMrnLast4(patient.mrn_last4 || '');
     setDiagnosisTags(patient.diagnosis_tags || []);
     setTherapyTags(patient.therapy_tags || []);
     setRiskFlags(patient.risk_flags || []);
     setNotes(patient.notes || '');
     setNextFollowup(patient.next_followup_date || '');
   }, [patient]);
 
   const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
     if (arr.includes(item)) {
       setter(arr.filter(i => i !== item));
     } else {
       setter([...arr, item]);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setSaving(true);
 
     const { error } = await supabase
       .from('patient_cards')
       .update({
         patient_code: patientCode,
         mrn_last4: mrnLast4 || null,
         diagnosis_tags: diagnosisTags,
         therapy_tags: therapyTags,
         risk_flags: riskFlags,
         notes: notes || null,
         next_followup_date: nextFollowup || null,
       })
       .eq('id', patient.id);
 
     setSaving(false);
 
     if (error) {
       toast.error('Failed to update patient');
     } else {
       toast.success('Patient updated');
        logAccess({
          action: 'update',
          resourceType: 'patient_card',
          resourceId: patient.id,
          metadata: { patient_code: patientCode }
        });
       onPatientUpdated();
       onOpenChange(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Patient Card</DialogTitle>
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
 
           <Button type="submit" className="w-full" disabled={saving}>
             {saving ? 'Saving...' : 'Save Changes'}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }