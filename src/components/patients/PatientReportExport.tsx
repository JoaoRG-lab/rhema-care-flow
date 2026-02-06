import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, ClipboardList, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  exportVisitHistoryPDF,
  exportFullPatientReportPDF,
  generateVisitHistoryPDFBase64,
  generateFullPatientReportPDFBase64,
  type VisitHistoryExportData,
  type FullPatientReportData,
} from '@/lib/pdfExport';
import { SendReportDialog } from './SendReportDialog';
import type { PatientCard, Visit, ScoreEntry, MonitoringEvent } from '@/types/clinical';

interface PatientReportExportProps {
  patient: PatientCard;
}

export function PatientReportExport({ patient }: PatientReportExportProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'visits' | 'full' | null>(null);
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; type: 'visits' | 'full' } | null>(null);

  const fetchVisits = async (): Promise<Visit[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('visits_secure')
      .select('*')
      .eq('patient_card_id', patient.id)
      .eq('user_id', user.id)
      .order('visit_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching visits:', error);
      return [];
    }
    
    return (data || []) as Visit[];
  };

  const fetchScores = async (): Promise<ScoreEntry[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('score_entries_secure')
      .select('*')
      .eq('patient_card_id', patient.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching scores:', error);
      return [];
    }
    
    return (data || []) as ScoreEntry[];
  };

  const fetchMonitoringEvents = async (): Promise<MonitoringEvent[]> => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('monitoring_events_secure')
      .select('*')
      .eq('patient_card_id', patient.id)
      .eq('user_id', user.id)
      .order('due_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching monitoring events:', error);
      return [];
    }
    
    return (data || []) as MonitoringEvent[];
  };

  const handleExportVisitHistory = async () => {
    setLoading('visits');
    try {
      const visits = await fetchVisits();
      
      const exportData: VisitHistoryExportData = {
        patientCode: patient.patient_code,
        diagnosisTags: patient.diagnosis_tags || [],
        therapyTags: patient.therapy_tags || [],
        visits,
      };
      
      exportVisitHistoryPDF(exportData);
      toast.success('Visit history exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export visit history');
    } finally {
      setLoading(null);
    }
  };

  const handleExportFullReport = async () => {
    setLoading('full');
    try {
      const [visits, scores, monitoringEvents] = await Promise.all([
        fetchVisits(),
        fetchScores(),
        fetchMonitoringEvents(),
      ]);
      
      const exportData: FullPatientReportData = {
        patient,
        visits,
        scores,
        monitoringEvents,
      };
      
      exportFullPatientReportPDF(exportData);
      toast.success('Full patient report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export patient report');
    } finally {
      setLoading(null);
    }
  };

  const generateVisitsPdfBase64 = async (): Promise<string> => {
    const visits = await fetchVisits();
    
    const exportData: VisitHistoryExportData = {
      patientCode: patient.patient_code,
      diagnosisTags: patient.diagnosis_tags || [],
      therapyTags: patient.therapy_tags || [],
      visits,
    };
    
    return generateVisitHistoryPDFBase64(exportData);
  };

  const generateFullReportPdfBase64 = async (): Promise<string> => {
    const [visits, scores, monitoringEvents] = await Promise.all([
      fetchVisits(),
      fetchScores(),
      fetchMonitoringEvents(),
    ]);
    
    const exportData: FullPatientReportData = {
      patient,
      visits,
      scores,
      monitoringEvents,
    };
    
    return generateFullPatientReportPDFBase64(exportData);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading !== null}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Download PDF</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleExportVisitHistory} disabled={loading !== null}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Visit History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportFullReport} disabled={loading !== null}>
            <FileText className="h-4 w-4 mr-2" />
            Full Patient Report
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Send via Email</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEmailDialog({ open: true, type: 'visits' })}>
            <Mail className="h-4 w-4 mr-2" />
            Email Visit History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialog({ open: true, type: 'full' })}>
            <Mail className="h-4 w-4 mr-2" />
            Email Full Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {emailDialog && (
        <SendReportDialog
          open={emailDialog.open}
          onOpenChange={(open) => !open && setEmailDialog(null)}
          patientName={patient.patient_code}
          reportType={emailDialog.type === 'visits' ? 'Visit History' : 'Full Patient Report'}
          generatePdfBase64={emailDialog.type === 'visits' ? generateVisitsPdfBase64 : generateFullReportPdfBase64}
        />
      )}
    </>
  );
}
