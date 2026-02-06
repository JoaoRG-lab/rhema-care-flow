import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ScoreComparisonData {
  patientCode: string;
  scoreType: string;
  baseline: {
    score: number;
    date: string;
    state: string;
  };
  followup: {
    score: number;
    date: string;
    state: string;
  };
  delta: number;
  percentChange: number;
  mcidAchieved: boolean;
  mcidThreshold: number;
  daysBetween: number;
  eularResponse?: {
    label: string;
    description: string;
  };
  clinicalSummary: string;
}

function generateScoreComparisonDoc(data: ScoreComparisonData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const destructiveColor: [number, number, number] = [239, 68, 68]; // Red
  const mutedColor: [number, number, number] = [100, 116, 139]; // Gray
  
  let yPos = 20;
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Score Comparison Report', 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy • h:mm a')}`, 14, 25);
  
  yPos = 50;
  
  // Patient & Score Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`Patient Code: ${data.patientCode}`, 14, yPos);
  doc.text(`Score Type: ${data.scoreType}`, 100, yPos);
  
  yPos += 15;
  
  // Score Comparison Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Score Comparison', 14, yPos);
  
  yPos += 5;
  
  autoTable(doc, {
    startY: yPos,
    head: [['', 'Baseline', 'Follow-up', 'Change']],
    body: [
      ['Date', data.baseline.date, data.followup.date, `${data.daysBetween} days`],
      ['Score', data.baseline.score.toString(), data.followup.score.toString(), 
       `${data.delta > 0 ? '+' : ''}${data.delta.toFixed(1)} (${data.percentChange > 0 ? '+' : ''}${data.percentChange.toFixed(0)}%)`],
      ['Disease State', data.baseline.state, data.followup.state, 
       data.baseline.state !== data.followup.state ? 'Changed' : 'Unchanged'],
    ],
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Clinical Interpretation
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Clinical Interpretation', 14, yPos);
  
  yPos += 10;
  
  // MCID Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  if (data.mcidAchieved) {
    doc.setTextColor(...(data.delta < 0 ? successColor : destructiveColor));
    doc.text('✓ MCID Achieved', 14, yPos);
  } else {
    doc.setTextColor(...mutedColor);
    doc.text('○ MCID Not Met', 14, yPos);
  }
  
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`(Threshold: ≥${data.mcidThreshold} change)`, 55, yPos);
  
  yPos += 10;
  
  // EULAR Response (if applicable)
  if (data.eularResponse) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`EULAR Response: ${data.eularResponse.label}`, 14, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(data.eularResponse.description, 14, yPos);
    
    yPos += 10;
  }
  
  // Clinical Summary Box
  yPos += 5;
  const summaryBoxWidth = pageWidth - 28;
  const summaryLines = doc.splitTextToSize(data.clinicalSummary, summaryBoxWidth - 10);
  const summaryBoxHeight = summaryLines.length * 6 + 14;
  
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.setDrawColor(226, 232, 240); // Border
  doc.roundedRect(14, yPos, summaryBoxWidth, summaryBoxHeight, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 19, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(summaryLines, 19, yPos + 16);
  
  yPos += summaryBoxHeight + 20;
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('This report is for clinical reference only. Always correlate with clinical findings.', 14, yPos);
  doc.text('RheumaFlow Clinical Workflow System', pageWidth - 14, yPos, { align: 'right' });
  
  return doc;
}

export function exportScoreComparisonPDF(data: ScoreComparisonData): void {
  const doc = generateScoreComparisonDoc(data);
  
  // Save the PDF
  const filename = `Score_Comparison_${data.patientCode}_${data.scoreType}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

export function generateScoreComparisonPDFBase64(data: ScoreComparisonData): string {
  const doc = generateScoreComparisonDoc(data);
  
  // Return as base64 string (without data URL prefix)
  const pdfOutput = doc.output('datauristring');
  // Extract just the base64 part after the data URL prefix
  const base64 = pdfOutput.split(',')[1];
  return base64;
}