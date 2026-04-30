/**
 * prescriptionPdfExport regression tests
 *
 * The PDF generator validates the prescription up-front. Malformed rows
 * (missing items, blank required fields, bad CID-10, signed-but-unsigned
 * etc.) must throw a `PrescriptionValidationError` BEFORE jsPDF is touched,
 * so we never produce a half-baked document. Valid rows must still save.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePrescriptionPdf } from '../prescriptionPdfExport';
import { PrescriptionValidationError } from '../prescriptionValidation';
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

  it('rejects (does not save) when items is null', () => {
    const broken = { ...baseRx, items: null as unknown as Prescription['items'] };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).toThrow(PrescriptionValidationError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejects when items is an empty array', () => {
    const broken = { ...baseRx, items: [] };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).toThrow(PrescriptionValidationError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejects when a required item field is missing', () => {
    const broken: Prescription = {
      ...baseRx,
      items: [{ ...baseRx.items[0], drug: '' }],
    };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).toThrow(PrescriptionValidationError);
  });

  it('rejects when CID-10 is malformed', () => {
    const broken: Prescription = { ...baseRx, cid10: 'not-a-cid' };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).toThrow(PrescriptionValidationError);
  });

  it('rejects when patientCode is empty', () => {
    expect(() => generatePrescriptionPdf(baseRx, '')).toThrow(PrescriptionValidationError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('rejects signed prescription without signature payload', () => {
    const broken: Prescription = { ...baseRx, status: 'signed' };
    expect(() => generatePrescriptionPdf(broken, 'PT-0001')).toThrow(PrescriptionValidationError);
  });

  it('exposes structured issues on the thrown error', () => {
    const broken = { ...baseRx, items: [] };
    try {
      generatePrescriptionPdf(broken, 'PT-0001');
    } catch (e) {
      expect(e).toBeInstanceOf(PrescriptionValidationError);
      const issues = (e as PrescriptionValidationError).issues;
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty('path');
      expect(issues[0]).toHaveProperty('message');
    }
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
