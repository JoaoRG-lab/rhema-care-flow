/**
 * prescriptionPdfExport regression tests
 *
 * The PDF generator iterates over `rx.items`. If `items` is ever null/undefined
 * (legacy rows from the DB, or a draft saved before items were added) the
 * previous implementation crashed with "Cannot read properties of null
 * (reading 'forEach')". The `?? []` guard in generatePrescriptionPdf must keep
 * the export working in that case — this test locks that contract.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePrescriptionPdf } from '../prescriptionPdfExport';
import type { Prescription } from '@/hooks/usePrescriptions';

const saveSpy = vi.fn();
const addImageSpy = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
    };
    setFillColor = vi.fn();
    setDrawColor = vi.fn();
    setTextColor = vi.fn();
    setFontSize = vi.fn();
    setFont = vi.fn();
    setLineWidth = vi.fn();
    rect = vi.fn();
    roundedRect = vi.fn();
    line = vi.fn();
    text = vi.fn();
    addPage = vi.fn();
    addImage = (...args: unknown[]) => addImageSpy(...args);
    save = (name: string) => saveSpy(name);
  }
  return { default: MockJsPDF };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

beforeEach(() => {
  saveSpy.mockClear();
  addImageSpy.mockClear();
});

const baseRx: Prescription = {
  id: 'rx-1',
  patient_id: 'pt-1',
  user_id: 'u-1',
  status: 'draft',
  items: [
    {
      drug: 'Metotrexato',
      dose: '15 mg',
      route: 'Oral',
      frequency: '1x por semana',
      duration: 'Uso contínuo',
      instructions: 'Após o café',
    },
  ],
  notes: 'Retorno em 30 dias',
  cid10: 'M05.3',
  signature_data_url: null,
  signature_hash: null,
  signed_at: null,
  signed_by_name: null,
  signed_by_crm: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('generatePrescriptionPdf', () => {
  it('saves a PDF with the expected filename pattern', () => {
    generatePrescriptionPdf(baseRx, 'PT-0001');
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy.mock.calls[0][0]).toMatch(/^prescricao_PT-0001_\d{8}_\d{4}\.pdf$/);
  });

  it('does not crash when items is null (regression: legacy/draft rows)', () => {
    const broken = { ...baseRx, items: null as unknown as Prescription['items'] };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).not.toThrow();
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('does not crash when items is undefined', () => {
    const broken = { ...baseRx, items: undefined as unknown as Prescription['items'] };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).not.toThrow();
  });

  it('embeds the signature image when status is signed', () => {
    const signed: Prescription = {
      ...baseRx,
      status: 'signed',
      signature_data_url: 'data:image/png;base64,AAAA',
      signature_hash: 'abc123',
      signed_at: new Date().toISOString(),
      signed_by_name: 'Dr. House',
      signed_by_crm: 'SP/12345',
    };
    generatePrescriptionPdf(signed, 'PT-0001');
    expect(addImageSpy).toHaveBeenCalledTimes(1);
    expect(addImageSpy.mock.calls[0][0]).toBe('data:image/png;base64,AAAA');
  });

  it('skips the signature image for drafts', () => {
    generatePrescriptionPdf(baseRx, 'PT-0001');
    expect(addImageSpy).not.toHaveBeenCalled();
  });
});
