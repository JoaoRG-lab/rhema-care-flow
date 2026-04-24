 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { RichTextEditor } from '@/components/ui/RichTextEditor';
 import { FileAttachments } from './FileAttachments';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Plus } from 'lucide-react';
 import { toast } from 'sonner';
 import { ACTION_OPTIONS, LAB_OPTIONS, IMAGING_OPTIONS } from '@/config/clinical';
 
 interface AddVisitDialogProps {
   patientId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onVisitAdded: () => void;
 }
 
export function AddVisitDialog({ patientId, open, onOpenChange, onVisitAdded }: AddVisitDialogProps) {
  const { user } = useAuth();
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [actions, setActions] = useState<string[]>([]);
  const [labs, setLabs] = useState<string[]>([]);
  const [imaging, setImaging] = useState<string[]>([]);
  const [nextSteps, setNextSteps] = useState('');
  const [diseaseScore, setDiseaseScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  // Pediatric / vitals (optional — populated when relevant)
  const [pediatric, setPediatric] = useState(false);
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [tempC, setTempC] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respRate, setRespRate] = useState('');
 
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
    const diseaseActivity: Record<string, unknown> = {};
    if (diseaseScore) diseaseActivity.score = diseaseScore;
    if (pediatric) {
      const pedi: Record<string, number> = {};
      if (ageMonths) pedi.ageMonths = Number(ageMonths);
      if (weightKg) pedi.weightKg = Number(weightKg);
      if (heightCm) pedi.heightCm = Number(heightCm);
      if (tempC) pedi.tempC = Number(tempC);
      if (heartRate) pedi.heartRate = Number(heartRate);
      if (respRate) pedi.respRate = Number(respRate);
      if (Object.keys(pedi).length) diseaseActivity.pediatric = pedi;
    }

    const { error } = await supabase.from('visits').insert({
      user_id: user.id,
      patient_card_id: patientId,
      visit_date: visitDate,
      actions,
      labs_ordered: labs,
      imaging,
      next_steps: nextSteps || null,
      disease_activity: Object.keys(diseaseActivity).length ? (diseaseActivity as any) : null,
      attachments,
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
    setAttachments([]);
    setPediatric(false);
    setAgeMonths('');
    setWeightKg('');
    setHeightCm('');
    setTempC('');
    setHeartRate('');
    setRespRate('');
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
 
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Pediatric / vitals</Label>
              <Button
                type="button"
                variant={pediatric ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPediatric((v) => !v)}
              >
                {pediatric ? 'Enabled' : 'Add fields'}
              </Button>
            </div>
            {pediatric && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ageMonths" className="text-xs">Age (months)</Label>
                  <Input id="ageMonths" type="number" min={0} value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="weightKg" className="text-xs">Weight (kg)</Label>
                  <Input id="weightKg" type="number" min={0} step={0.1} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="heightCm" className="text-xs">Height (cm)</Label>
                  <Input id="heightCm" type="number" min={0} step={0.1} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="tempC" className="text-xs">Temp (°C)</Label>
                  <Input id="tempC" type="number" min={0} step={0.1} value={tempC} onChange={(e) => setTempC(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="heartRate" className="text-xs">HR (bpm)</Label>
                  <Input id="heartRate" type="number" min={0} value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="respRate" className="text-xs">RR (rpm)</Label>
                  <Input id="respRate" type="number" min={0} value={respRate} onChange={(e) => setRespRate(e.target.value)} className="mt-1" />
                </div>
              </div>
            )}
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
             {saving ? 'Saving...' : 'Add Visit'}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }