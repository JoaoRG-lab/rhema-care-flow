import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, ClipboardList, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  exportVisitHistoryPDF,
  exportFullPatientReportPDF,
  type VisitHistoryExportData,
  type FullPatientReportData,
} from '@/lib/pdfExport';
import type { PatientCard, Visit, ScoreEntry, MonitoringEvent } from '@/types/clinical';

interface BatchExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: PatientCard[];
  onComplete?: () => void;
}

type ExportType = 'visits' | 'full';

interface ExportProgress {
  current: number;
  total: number;
  currentPatient: string;
  status: 'pending' | 'exporting' | 'complete' | 'error';
  errors: string[];
}

export function BatchExportDialog({ 
  open, 
  onOpenChange, 
  patients,
  onComplete,
}: BatchExportDialogProps) {
  const { user } = useAuth();
  const [exportType, setExportType] = useState<ExportType>('full');
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const fetchPatientData = async (patientId: string) => {
    if (!user) return null;

    const [visitsResult, scoresResult, monitoringResult] = await Promise.all([
      supabase
        .from('visits_secure')
        .select('*')
        .eq('patient_card_id', patientId)
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false }),
      supabase
        .from('score_entries_secure')
        .select('*')
        .eq('patient_card_id', patientId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('monitoring_events_secure')
        .select('*')
        .eq('patient_card_id', patientId)
        .eq('user_id', user.id)
        .order('due_date', { ascending: false }),
    ]);

    return {
      visits: (visitsResult.data || []) as Visit[],
      scores: (scoresResult.data || []) as ScoreEntry[],
      monitoringEvents: (monitoringResult.data || []) as MonitoringEvent[],
    };
  };

  const handleExport = async () => {
    if (patients.length === 0) return;

    const errors: string[] = [];
    
    setProgress({
      current: 0,
      total: patients.length,
      currentPatient: patients[0].patient_code,
      status: 'exporting',
      errors: [],
    });

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      
      setProgress(prev => ({
        ...prev!,
        current: i,
        currentPatient: patient.patient_code,
      }));

      try {
        const data = await fetchPatientData(patient.id);
        
        if (!data) {
          errors.push(`${patient.patient_code}: Failed to fetch data`);
          continue;
        }

        if (exportType === 'visits') {
          const exportData: VisitHistoryExportData = {
            patientCode: patient.patient_code,
            diagnosisTags: patient.diagnosis_tags || [],
            therapyTags: patient.therapy_tags || [],
            visits: data.visits,
          };
          exportVisitHistoryPDF(exportData);
        } else {
          const exportData: FullPatientReportData = {
            patient,
            visits: data.visits,
            scores: data.scores,
            monitoringEvents: data.monitoringEvents,
          };
          exportFullPatientReportPDF(exportData);
        }

        // Small delay to prevent browser from blocking downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Export error for ${patient.patient_code}:`, error);
        errors.push(`${patient.patient_code}: Export failed`);
      }
    }

    setProgress(prev => ({
      ...prev!,
      current: patients.length,
      status: errors.length > 0 ? 'error' : 'complete',
      errors,
    }));

    if (errors.length === 0) {
      toast.success(`Successfully exported ${patients.length} patient reports`);
    } else {
      toast.warning(`Exported ${patients.length - errors.length} of ${patients.length} reports`);
    }

    onComplete?.();
  };

  const handleClose = () => {
    if (progress?.status !== 'exporting') {
      setProgress(null);
      onOpenChange(false);
    }
  };

  const progressPercentage = progress 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Batch Export
          </DialogTitle>
          <DialogDescription>
            Export PDF reports for {patients.length} selected patient{patients.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {!progress ? (
          <div className="space-y-6 py-4">
            {/* Export Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Report Type</Label>
              
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportType === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setExportType('full')}
              >
                <Checkbox 
                  checked={exportType === 'full'} 
                  onCheckedChange={() => setExportType('full')}
                />
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Full Patient Report</p>
                  <p className="text-xs text-muted-foreground">
                    Demographics, visits, scores, monitoring
                  </p>
                </div>
              </div>

              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportType === 'visits' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setExportType('visits')}
              >
                <Checkbox 
                  checked={exportType === 'visits'} 
                  onCheckedChange={() => setExportType('visits')}
                />
                <ClipboardList className="h-5 w-5 text-info" />
                <div>
                  <p className="font-medium text-sm">Visit History Only</p>
                  <p className="text-xs text-muted-foreground">
                    Compact visit summary
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Patients Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Patients</Label>
              <ScrollArea className="h-32 rounded-md border p-2">
                <div className="space-y-1">
                  {patients.map(p => (
                    <div key={p.id} className="text-sm flex items-center gap-2">
                      <span className="font-medium">{p.patient_code}</span>
                      {p.diagnosis_tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export {patients.length} Report{patients.length !== 1 ? 's' : ''}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Progress Display */}
            {progress.status === 'exporting' ? (
              <>
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Exporting...</p>
                    <p className="text-xs text-muted-foreground">
                      {progress.currentPatient} ({progress.current + 1} of {progress.total})
                    </p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </>
            ) : progress.status === 'complete' ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="font-medium">Export Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {progress.total} PDF{progress.total !== 1 ? 's' : ''} downloaded
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Export completed with errors</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {progress.total - progress.errors.length} of {progress.total} exported successfully
                </p>
                {progress.errors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1 p-2 rounded bg-destructive/10">
                    {progress.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {progress.status !== 'exporting' && (
              <Button onClick={handleClose} variant="outline" className="w-full">
                Close
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
