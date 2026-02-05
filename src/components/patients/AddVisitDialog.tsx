 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Plus } from 'lucide-react';
 import { toast } from 'sonner';
 
 interface AddVisitDialogProps {
   patientId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onVisitAdded: () => void;
 }
 
 const ACTION_OPTIONS = ['Medication started', 'Medication adjusted', 'Medication stopped', 'Injection given', 'Referral made', 'Imaging ordered', 'Labs ordered'];
 const LAB_OPTIONS = ['CBC', 'CMP', 'LFTs', 'ESR', 'CRP', 'RF', 'Anti-CCP', 'ANA', 'dsDNA', 'Complement', 'Lipids', 'HbA1c'];
 const IMAGING_OPTIONS = ['X-ray hands', 'X-ray feet', 'X-ray spine', 'MRI', 'Ultrasound', 'CT', 'DXA'];
 
 export function AddVisitDialog({ patientId, open, onOpenChange, onVisitAdded }: AddVisitDialogProps) {
   const { user } = useAuth();
   const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
   const [actions, setActions] = useState<string[]>([]);
   const [labs, setLabs] = useState<string[]>([]);
   const [imaging, setImaging] = useState<string[]>([]);
   const [nextSteps, setNextSteps] = useState('');
   const [diseaseScore, setDiseaseScore] = useState('');
   const [saving, setSaving] = useState(false);
 
   const toggleItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
     if (arr.includes(item)) {
       setter(arr.filter(i => i !== item));
     } else {
       setter([...arr, item]);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     setSaving(true);
     const diseaseActivity = diseaseScore ? { score: diseaseScore } : null;
 
     const { error } = await supabase.from('visits').insert({
       user_id: user.id,
       patient_card_id: patientId,
       visit_date: visitDate,
       actions,
       labs_ordered: labs,
       imaging,
       next_steps: nextSteps || null,
       disease_activity: diseaseActivity as any,
     });
 
     // Also update the patient card's last_visit_date
     if (!error) {
       await supabase
         .from('patient_cards')
         .update({ last_visit_date: visitDate })
         .eq('id', patientId);
     }
 
     setSaving(false);
 
     if (error) {
       toast.error('Failed to add visit');
     } else {
       toast.success('Visit added');
       resetForm();
       onVisitAdded();
     }
   };
 
   const resetForm = () => {
     setVisitDate(new Date().toISOString().split('T')[0]);
     setActions([]);
     setLabs([]);
     setImaging([]);
     setNextSteps('');
     setDiseaseScore('');
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogTrigger asChild>
         <Button className="gap-2">
           <Plus className="h-4 w-4" />
           Add Visit
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Add Visit</DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 mt-4">
           <div>
             <Label htmlFor="visitDate">Visit Date</Label>
             <Input
               id="visitDate"
               type="date"
               value={visitDate}
               onChange={(e) => setVisitDate(e.target.value)}
               required
               className="mt-1"
             />
           </div>
 
           <div>
             <Label htmlFor="diseaseScore">Disease Activity Score (optional)</Label>
             <Input
               id="diseaseScore"
               value={diseaseScore}
               onChange={(e) => setDiseaseScore(e.target.value)}
               placeholder="e.g., DAS28: 3.2"
               className="mt-1"
             />
           </div>
 
           <div>
             <Label>Actions</Label>
             <div className="flex flex-wrap gap-2 mt-2">
               {ACTION_OPTIONS.map((action) => (
                 <Button
                   key={action}
                   type="button"
                   variant={actions.includes(action) ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => toggleItem(actions, action, setActions)}
                 >
                   {action}
                 </Button>
               ))}
             </div>
           </div>
 
           <div>
             <Label>Labs Ordered</Label>
             <div className="flex flex-wrap gap-2 mt-2">
               {LAB_OPTIONS.map((lab) => (
                 <Button
                   key={lab}
                   type="button"
                   variant={labs.includes(lab) ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => toggleItem(labs, lab, setLabs)}
                 >
                   {lab}
                 </Button>
               ))}
             </div>
           </div>
 
           <div>
             <Label>Imaging</Label>
             <div className="flex flex-wrap gap-2 mt-2">
               {IMAGING_OPTIONS.map((img) => (
                 <Button
                   key={img}
                   type="button"
                   variant={imaging.includes(img) ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => toggleItem(imaging, img, setImaging)}
                 >
                   {img}
                 </Button>
               ))}
             </div>
           </div>
 
           <div>
             <Label htmlFor="nextSteps">Next Steps</Label>
             <Textarea
               id="nextSteps"
               value={nextSteps}
               onChange={(e) => setNextSteps(e.target.value)}
               placeholder="Follow-up plan, pending items..."
               className="mt-1"
               rows={3}
             />
           </div>
 
           <Button type="submit" className="w-full" disabled={saving}>
             {saving ? 'Saving...' : 'Add Visit'}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }