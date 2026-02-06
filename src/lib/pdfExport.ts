import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { PatientCard, Visit, ScoreEntry, MonitoringEvent } from '@/types/clinical';

// ============================================
// SHARED TYPES & UTILITIES
// ============================================

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

// Colors
const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
const successColor: [number, number, number] = [34, 197, 94]; // Green
const destructiveColor: [number, number, number] = [239, 68, 68]; // Red
const mutedColor: [number, number, number] = [100, 116, 139]; // Gray
const warningColor: [number, number, number] = [245, 158, 11]; // Amber

function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle || `Generated: ${format(new Date(), 'MMMM d, yyyy • h:mm a')}`, 14, 25);
  
  return 50; // Return starting Y position after header
}

function addFooter(doc: jsPDF, yPos: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('This report is for clinical reference only. Always correlate with clinical findings.', 14, yPos);
  doc.text('RheumaFlow Clinical Workflow System', pageWidth - 14, yPos, { align: 'right' });
}

function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
}

// ============================================
// SCORE COMPARISON PDF
// ============================================

function generateScoreComparisonDoc(data: ScoreComparisonData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = addHeader(doc, 'Score Comparison Report');
  
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
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, summaryBoxWidth, summaryBoxHeight, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 19, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(summaryLines, 19, yPos + 16);
  
  yPos += summaryBoxHeight + 20;
  
  addFooter(doc, yPos);
  
  return doc;
}

export function exportScoreComparisonPDF(data: ScoreComparisonData): void {
  const doc = generateScoreComparisonDoc(data);
  const filename = `Score_Comparison_${data.patientCode}_${data.scoreType}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

export function generateScoreComparisonPDFBase64(data: ScoreComparisonData): string {
  const doc = generateScoreComparisonDoc(data);
  const pdfOutput = doc.output('datauristring');
  const base64 = pdfOutput.split(',')[1];
  return base64;
}

// ============================================
// VISIT HISTORY PDF
// ============================================

export interface VisitHistoryExportData {
  patientCode: string;
  diagnosisTags?: string[];
  therapyTags?: string[];
  visits: Visit[];
}

function generateVisitHistoryDoc(data: VisitHistoryExportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = addHeader(doc, 'Visit History Report', `Patient: ${data.patientCode}`);
  
  // Patient Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Summary', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`Patient Code: ${data.patientCode}`, 14, yPos);
  doc.text(`Total Visits: ${data.visits.length}`, 100, yPos);
  
  if (data.diagnosisTags && data.diagnosisTags.length > 0) {
    yPos += 6;
    doc.text(`Diagnoses: ${data.diagnosisTags.join(', ')}`, 14, yPos);
  }
  
  if (data.therapyTags && data.therapyTags.length > 0) {
    yPos += 6;
    doc.text(`Therapies: ${data.therapyTags.join(', ')}`, 14, yPos);
  }
  
  yPos += 15;
  
  // Visit Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Visit Details', 14, yPos);
  
  yPos += 5;
  
  const visitTableData = data.visits.map(visit => {
    const actions = Array.isArray(visit.actions) ? visit.actions.join(', ') : '';
    const labs = Array.isArray(visit.labs_ordered) ? visit.labs_ordered.join(', ') : '';
    const imaging = Array.isArray(visit.imaging) ? visit.imaging.join(', ') : '';
    
    // Strip HTML from next_steps
    const nextSteps = visit.next_steps 
      ? visit.next_steps.replace(/<[^>]*>/g, '').substring(0, 100) + (visit.next_steps.length > 100 ? '...' : '')
      : '';
    
    return [
      format(new Date(visit.visit_date), 'MMM d, yyyy'),
      actions || '-',
      labs || '-',
      imaging || '-',
      nextSteps || '-',
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Actions', 'Labs', 'Imaging', 'Next Steps']],
    body: visitTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 55 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      // Add header on new pages
      if (doc.getNumberOfPages() > 1) {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Visit History - ${data.patientCode} (continued)`, 14, 13);
      }
    },
  });
  
  addPageNumbers(doc);
  
  return doc;
}

export function exportVisitHistoryPDF(data: VisitHistoryExportData): void {
  const doc = generateVisitHistoryDoc(data);
  const filename = `Visit_History_${data.patientCode}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

export function generateVisitHistoryPDFBase64(data: VisitHistoryExportData): string {
  const doc = generateVisitHistoryDoc(data);
  const pdfOutput = doc.output('datauristring');
  const base64 = pdfOutput.split(',')[1];
  return base64;
}

// ============================================
// FULL PATIENT REPORT PDF
// ============================================

export interface FullPatientReportData {
  patient: PatientCard;
  visits: Visit[];
  scores: ScoreEntry[];
  monitoringEvents?: MonitoringEvent[];
}

function generateFullPatientReportDoc(data: FullPatientReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let yPos = addHeader(doc, 'Comprehensive Patient Report', `Patient: ${data.patient.patient_code}`);
  
  // -------- PATIENT DEMOGRAPHICS --------
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 14, yPos);
  
  yPos += 10;
  
  // Info grid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoRows = [
    ['Patient Code:', data.patient.patient_code],
    ['MRN (last 4):', data.patient.mrn_last4 || 'N/A'],
    ['Last Visit:', data.patient.last_visit_date ? format(new Date(data.patient.last_visit_date), 'MMMM d, yyyy') : 'No visits'],
    ['Next Follow-up:', data.patient.next_followup_date ? format(new Date(data.patient.next_followup_date), 'MMMM d, yyyy') : 'Not scheduled'],
    ['Created:', format(new Date(data.patient.created_at), 'MMMM d, yyyy')],
  ];
  
  infoRows.forEach(([label, value], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, 14, yPos + (idx * 6));
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(value, 50, yPos + (idx * 6));
  });
  
  yPos += infoRows.length * 6 + 10;
  
  // Diagnosis Tags
  if (data.patient.diagnosis_tags && data.patient.diagnosis_tags.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Diagnoses:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(data.patient.diagnosis_tags.join(', '), 50, yPos);
    yPos += 8;
  }
  
  // Therapy Tags
  if (data.patient.therapy_tags && data.patient.therapy_tags.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Therapies:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(data.patient.therapy_tags.join(', '), 50, yPos);
    yPos += 8;
  }
  
  // Risk Flags
  if (data.patient.risk_flags && data.patient.risk_flags.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...warningColor);
    doc.text('Risk Flags:', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.patient.risk_flags.join(', '), 50, yPos);
    yPos += 8;
  }
  
  // Notes
  if (data.patient.notes) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Clinical Notes:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const noteLines = doc.splitTextToSize(data.patient.notes, pageWidth - 28);
    doc.text(noteLines.slice(0, 5), 14, yPos);
    yPos += Math.min(noteLines.length, 5) * 5 + 5;
  }
  
  // -------- VISIT SUMMARY --------
  yPos += 10;
  
  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 30;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Visit History', 14, yPos);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`(${data.visits.length} visits)`, 55, yPos);
  
  yPos += 8;
  
  if (data.visits.length > 0) {
    const recentVisits = data.visits.slice(0, 10); // Show up to 10 recent visits
    
    const visitTableData = recentVisits.map(visit => {
      const actions = Array.isArray(visit.actions) ? visit.actions.slice(0, 3).join(', ') : '';
      const labs = Array.isArray(visit.labs_ordered) ? visit.labs_ordered.slice(0, 3).join(', ') : '';
      
      return [
        format(new Date(visit.visit_date), 'MMM d, yyyy'),
        actions || '-',
        labs || '-',
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Actions Taken', 'Labs Ordered']],
      body: visitTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 70 },
      },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setTextColor(...mutedColor);
    doc.text('No visits recorded.', 14, yPos);
    yPos += 10;
  }
  
  // -------- SCORE HISTORY --------
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 30;
  }
  
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Disease Activity Scores', 14, yPos);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(`(${data.scores.length} scores)`, 75, yPos);
  
  yPos += 8;
  
  if (data.scores.length > 0) {
    const recentScores = data.scores.slice(0, 15);
    
    const scoreTableData = recentScores.map(score => [
      format(new Date(score.created_at), 'MMM d, yyyy'),
      score.score_type,
      score.calculated_score?.toFixed(1) || '-',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Score Type', 'Value']],
      body: scoreTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setTextColor(...mutedColor);
    doc.text('No scores recorded.', 14, yPos);
    yPos += 10;
  }
  
  // -------- MONITORING EVENTS --------
  if (data.monitoringEvents && data.monitoringEvents.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 30;
    }
    
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Monitoring Events', 14, yPos);
    
    yPos += 8;
    
    const monitoringTableData = data.monitoringEvents.slice(0, 10).map(event => [
      format(new Date(event.due_date), 'MMM d, yyyy'),
      event.event_type,
      event.status,
      event.completed_at ? format(new Date(event.completed_at), 'MMM d') : '-',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Due Date', 'Event Type', 'Status', 'Completed']],
      body: monitoringTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
  }
  
  addPageNumbers(doc);
  
  return doc;
}

export function exportFullPatientReportPDF(data: FullPatientReportData): void {
  const doc = generateFullPatientReportDoc(data);
  const filename = `Patient_Report_${data.patient.patient_code}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

export function generateFullPatientReportPDFBase64(data: FullPatientReportData): string {
  const doc = generateFullPatientReportDoc(data);
  const pdfOutput = doc.output('datauristring');
  const base64 = pdfOutput.split(',')[1];
  return base64;
}