/**
 * prescriptionPdfExport
 * Generates a prescription PDF with digital signature block.
 * Follows the same visual pattern as pdfExport.ts.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Prescription, PrescriptionItem } from '@/hooks/usePrescriptions';
import { rxLog, describeError } from '@/lib/prescriptionLogger';

const PRIMARY: [number, number, number] = [15, 118, 110];  // teal-700
const WHITE:   [number, number, number] = [255, 255, 255];
const GRAY:    [number, number, number] = [71, 85, 105];
const LIGHT:   [number, number, number] = [241, 245, 249];
const BLACK:   [number, number, number] = [15, 23, 42];
const RED:     [number, number, number] = [220, 38, 38];

function drawHeader(doc: jsPDF, patientCode: string, clinicianName: string, crm: string): number {
  const w = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, w, 38, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIÇÃO MÉDICA', 14, 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Clínico: ${clinicianName}  |  CRM: ${crm}`, 14, 22);
  doc.text(`Paciente: ${patientCode}  |  Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 14, 30);

  // Right — UHS logo text
  doc.setFontSize(8);
  doc.text('UHS Health OS', w - 14, 22, { align: 'right' });
  doc.text('Sistema Clínico', w - 14, 29, { align: 'right' });

  return 46;
}

function drawItem(doc: jsPDF, item: PrescriptionItem, index: number, y: number): number {
  const w = doc.internal.pageSize.getWidth();

  // Item number background
  doc.setFillColor(...LIGHT);
  doc.roundedRect(14, y, w - 28, 8, 1.5, 1.5, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(`${index + 1}. ${item.drug}`, 18, y + 5.5);

  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BLACK);
  doc.setFontSize(8.5);

  const doseLine = [
    item.dose && `Dose: ${item.dose}`,
    item.route && `Via: ${item.route}`,
    item.frequency && `Frequência: ${item.frequency}`,
    item.duration && `Duração: ${item.duration}`,
  ].filter(Boolean).join('   ');

  doc.text(doseLine, 18, y);
  y += 6;

  if (item.instructions) {
    doc.setTextColor(...GRAY);
    doc.text(`↳ ${item.instructions}`, 18, y);
    y += 6;
  }

  return y + 3;
}

function drawSignatureBlock(doc: jsPDF, rx: Prescription, y: number): void {
  const w = doc.internal.pageSize.getWidth();

  if (y > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    y = 20;
  }

  y += 8;
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.3);
  doc.line(14, y, w - 14, y);
  y += 8;

  if (rx.status === 'signed' && rx.signature_data_url) {
    // Signature image
    try {
      doc.addImage(rx.signature_data_url, 'PNG', 14, y, 70, 25);
    } catch { /* no-op */ }

    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`Assinado digitalmente por: ${rx.signed_by_name ?? ''}`, 14, y + 30);
    doc.text(`CRM: ${rx.signed_by_crm ?? ''}  |  ${rx.signed_at ? format(new Date(rx.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}`, 14, y + 35);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Hash SHA-256: ${rx.signature_hash ?? ''}`, 14, y + 41);

    // Signed stamp
    doc.setDrawColor(...PRIMARY);
    doc.setTextColor(...PRIMARY);
    doc.setLineWidth(0.8);
    doc.rect(w - 55, y, 41, 14, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSINADO', w - 34.5, y + 6, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('DIGITALMENTE', w - 34.5, y + 11, { align: 'center' });
  } else {
    // Blank signature area
    doc.setFillColor(...LIGHT);
    doc.rect(14, y, 80, 28, 'F');
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.text('Assinatura do responsável', 16, y + 10);

    doc.setFontSize(7.5);
    doc.text(`CRM: ______________________`, 16, y + 18);
    doc.text(`Data: _____ / _____ / _______`, 16, y + 24);

    // Draft watermark
    doc.setFontSize(28);
    doc.setTextColor(...RED);
    doc.setFont('helvetica', 'bold');
    doc.text('RASCUNHO', w / 2, y + 16, { align: 'center', angle: 15 });
  }

  // Footer disclaimer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Este documento foi gerado pelo UHS Health OS. É uma ferramenta organizacional para uso de profissionais de saúde. Não substitui o prontuário eletrônico oficial.',
    14, pageH - 8, { maxWidth: w - 28 }
  );
}

export function generatePrescriptionPdf(
  rx: Prescription,
  patientCode: string,
): void {
  rxLog.info('pdf:start', {
    rxId: rx?.id,
    status: rx?.status,
    itemCount: Array.isArray(rx?.items) ? rx.items.length : 0,
    patientCode,
  });
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const clinicianName = rx.signed_by_name ?? 'Profissional de Saúde';
    const crm = rx.signed_by_crm ?? '';

    let y = drawHeader(doc, patientCode, clinicianName, crm);

    // CID-10 if present
    if (rx.cid10) {
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'italic');
      doc.text(`Diagnóstico (CID-10): ${rx.cid10}`, 14, y);
      y += 8;
    }

    // Items
    doc.setFont('helvetica', 'normal');
    (rx.items ?? []).forEach((item, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      y = drawItem(doc, item, i, y);
    });

    // Notes
    if (rx.notes?.trim()) {
      y += 4;
      doc.setFillColor(...LIGHT);
      const w = doc.internal.pageSize.getWidth();
      doc.roundedRect(14, y, w - 28, 16, 1.5, 1.5, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 18, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(rx.notes, 18, y + 11, { maxWidth: w - 40 });
      y += 22;
    }

    drawSignatureBlock(doc, rx, y);

    const filename = `prescricao_${patientCode}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(filename);
    rxLog.info('pdf:success', { rxId: rx?.id, filename });
  } catch (e) {
    rxLog.error('pdf:failed', { rxId: rx?.id, patientCode, error: describeError(e) });
    throw e;
  }
}
