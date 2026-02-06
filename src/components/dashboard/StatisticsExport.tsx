import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface StatsData {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalVisitsThisMonth: number;
  totalScoresRecorded: number;
  averageVisitsPerPatient: number;
  diagnosisBreakdown: { diagnosis: string; count: number }[];
  recentScores: { scoreType: string; avgScore: number; count: number }[];
  therapyBreakdown: { therapy: string; count: number }[];
}

interface StatisticsExportProps {
  stats: StatsData;
}

export function StatisticsExport({ stats }: StatisticsExportProps) {
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'MMMM yyyy');

  const exportToCSV = () => {
    try {
      const lines: string[] = [];
      
      // Header
      lines.push(`Patient Statistics Report - ${currentMonth}`);
      lines.push(`Generated on: ${format(new Date(), 'PPpp')}`);
      lines.push('');
      
      // Summary metrics
      lines.push('SUMMARY METRICS');
      lines.push('Metric,Value');
      lines.push(`Total Patients,${stats.totalPatients}`);
      lines.push(`New Patients This Month,${stats.newPatientsThisMonth}`);
      lines.push(`Visits This Month,${stats.totalVisitsThisMonth}`);
      lines.push(`Avg Visits per Patient,${stats.averageVisitsPerPatient}`);
      lines.push(`Scores Recorded (30 days),${stats.totalScoresRecorded}`);
      lines.push('');
      
      // Diagnosis breakdown
      if (stats.diagnosisBreakdown.length > 0) {
        lines.push('DIAGNOSIS DISTRIBUTION');
        lines.push('Diagnosis,Patient Count');
        stats.diagnosisBreakdown.forEach(({ diagnosis, count }) => {
          lines.push(`${diagnosis},${count}`);
        });
        lines.push('');
      }
      
      // Therapy breakdown
      if (stats.therapyBreakdown.length > 0) {
        lines.push('THERAPY DISTRIBUTION');
        lines.push('Therapy,Patient Count');
        stats.therapyBreakdown.forEach(({ therapy, count }) => {
          lines.push(`${therapy},${count}`);
        });
        lines.push('');
      }
      
      // Score averages
      if (stats.recentScores.length > 0) {
        lines.push('RECENT SCORE AVERAGES (Last 30 Days)');
        lines.push('Score Type,Average,Count');
        stats.recentScores.forEach(({ scoreType, avgScore, count }) => {
          lines.push(`${scoreType},${avgScore},${count}`);
        });
      }
      
      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-statistics-${currentDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Patient Statistics Report', pageWidth / 2, 20, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(currentMonth, pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 34, { align: 'center' });
      
      let yPos = 45;
      
      // Summary metrics table
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Summary Metrics', 14, yPos);
      yPos += 5;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Patients', stats.totalPatients.toString()],
          ['New Patients This Month', stats.newPatientsThisMonth.toString()],
          ['Visits This Month', stats.totalVisitsThisMonth.toString()],
          ['Avg Visits per Patient', stats.averageVisitsPerPatient.toString()],
          ['Scores Recorded (30 days)', stats.totalScoresRecorded.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Diagnosis breakdown
      if (stats.diagnosisBreakdown.length > 0) {
        doc.setFontSize(14);
        doc.text('Diagnosis Distribution', 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Diagnosis', 'Patient Count']],
          body: stats.diagnosisBreakdown.map(({ diagnosis, count }) => [diagnosis, count.toString()]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 14, right: 14 },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Therapy breakdown
      if (stats.therapyBreakdown.length > 0) {
        // Check if we need a new page
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Therapy Distribution', 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Therapy', 'Patient Count']],
          body: stats.therapyBreakdown.map(({ therapy, count }) => [therapy, count.toString()]),
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
          margin: { left: 14, right: 14 },
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Score averages
      if (stats.recentScores.length > 0) {
        // Check if we need a new page
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Recent Score Averages (Last 30 Days)', 14, yPos);
        yPos += 5;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Score Type', 'Average', 'Count']],
          body: stats.recentScores.map(({ scoreType, avgScore, count }) => [
            scoreType,
            avgScore.toString(),
            count.toString(),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 14, right: 14 },
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} | RheumaFlow Patient Statistics`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`patient-statistics-${currentDate}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
