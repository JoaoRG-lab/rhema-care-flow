 import { useState, useEffect } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { RichTextEditor } from '@/components/ui/RichTextEditor';
 import { FileAttachments } from './FileAttachments';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { ACTION_OPTIONS, LAB_OPTIONS, IMAGING_OPTIONS } from '@/config/clinical';
 import type { Visit } from '@/types/clinical';
 
 interface EditVisitDialogProps {
   visit: Visit;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onVisitUpdated: () => void;
 }
 
 export function EditVisitDialog({ visit, open, onOpenChange, onVisitUpdated }: EditVisitDialogProps) {
   const [visitDate, setVisitDate] = useState(visit.visit_date);
   const [actions, setActions] = useState<string[]>(visit.actions || []);
   const [labs, setLabs] = useState<string[]>(visit.labs_ordered || []);
   const [imaging, setImaging] = useState<string[]>(visit.imaging || []);
   const [nextSteps, setNextSteps] = useState(visit.next_steps || '');
  const [diseaseScore, setDiseaseScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>(visit.attachments || []);
  // Preserve every other key in disease_activity (pediatric, vitals, custom fields, etc.)
  // so editing the visit never silently drops information entered elsewhere.
  const [extraActivity, setExtraActivity] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setVisitDate(visit.visit_date);
    setActions(visit.actions || []);
    setLabs(visit.labs_ordered || []);
    setImaging(visit.imaging || []);
    setNextSteps(visit.next_steps || '');
    setAttachments(visit.attachments || []);

    // Split disease_activity into the editable "score" field and everything else
    if (visit.disease_activity && typeof visit.disease_activity === 'object' && !Array.isArray(visit.disease_activity)) {
      const { score, ...rest } = visit.disease_activity as Record<string, unknown>;
      setDiseaseScore(score ? String(score) : '');
      setExtraActivity(rest);
    } else {
      setDiseaseScore('');
      setExtraActivity({});
    }
  }, [visit]);
 
   const toggleItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
     if (arr.includes(item)) {
       setter(arr.filter(i => i !== item));
     } else {
       setter([...arr, item]);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setSaving(true);
 
    // Merge: keep all preserved keys (pediatric, vitals, etc.) and overlay the edited score
    const merged: Record<string, unknown> = { ...extraActivity };
    if (diseaseScore) merged.score = diseaseScore;
    const diseaseActivity = Object.keys(merged).length > 0 ? merged : null;
 
     const { error } = await supabase
       .from('visits')
       .update({
         visit_date: visitDate,
         actions,
         labs_ordered: labs,
         imaging,
         next_steps: nextSteps || null,
         disease_activity: diseaseActivity as any,
         attachments,
       })
       .eq('id', visit.id);
 
     setSaving(false);
 
     if (error) {
       toast.error('Failed to update visit');
     } else {
       toast.success('Visit updated');
       onVisitUpdated();
       onOpenChange(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Edit Visit</DialogTitle>
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
             <RichTextEditor
               content={nextSteps}
               onChange={setNextSteps}
               placeholder="Follow-up plan, pending items..."
               className="mt-1 min-h-[100px]"
             />
           </div>
 
           <div>
             <Label>Attachments</Label>
             <div className="mt-2">
               <FileAttachments
                 attachments={attachments}
                 onChange={setAttachments}
                 disabled={saving}
               />
             </div>
           </div>
 
           <Button type="submit" className="w-full" disabled={saving}>
             {saving ? 'Saving...' : 'Save Changes'}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }