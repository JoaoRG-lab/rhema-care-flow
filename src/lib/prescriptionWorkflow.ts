import {
  formatPrescription,
  type PrescriptionAlert,
  type PrescriptionDraftItem,
} from './prescriptionEngine';

export type PrescriptionStatus =
  | 'draft'
  | 'validated'
  | 'issued'
  | 'printed'
  | 'sent'
  | 'cancelled';

export type PrescriptionChannel = 'print' | 'pdf' | 'email' | 'sms' | 'whatsapp' | 'internal';

export interface PrescriberProfile {
  id: string;
  fullName: string;
  council: string;
  councilNumber: string;
  councilState: string;
  specialty?: string;
  workplace?: PrescriptionWorkplace;
}

export interface PrescriptionWorkplace {
  name?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
}

export interface PrescriptionPatientSnapshot {
  id: string;
  fullName: string;
  document?: string;
  birthDate?: string;
  sex?: 'Masculino' | 'Feminino' | 'Outro' | 'Não informado';
  phone?: string;
  email?: string;
  weightKg?: number;
  heightM?: number;
  allergies?: string[];
  conditions?: string[];
}

export interface PrescriptionPrintSettings {
  primaryColor?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showManufacturer?: boolean;
  fontScale?: 'compact' | 'normal' | 'large';
  includeSafetyNotes?: boolean;
}

export interface PrescriptionDocument {
  id: string;
  externalId: string;
  status: PrescriptionStatus;
  patient: PrescriptionPatientSnapshot;
  prescriber: PrescriberProfile;
  items: PrescriptionDraftItem[];
  alerts: PrescriptionAlert[];
  text: string;
  canFinalize: boolean;
  printSettings: PrescriptionPrintSettings;
  signed: boolean;
  channels: PrescriptionChannel[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionWorkflowEvent {
  id: string;
  prescriptionId: string;
  type:
    | 'created'
    | 'validated'
    | 'issued'
    | 'printed'
    | 'sent'
    | 'cancelled'
    | 'safety-alert';
  payload?: Record<string, unknown>;
  createdAt: string;
}

export function createPrescriptionDocument(params: {
  patient: PrescriptionPatientSnapshot;
  prescriber: PrescriberProfile;
  items?: PrescriptionDraftItem[];
  printSettings?: PrescriptionPrintSettings;
}) : PrescriptionDocument {
  const now = new Date().toISOString();
  const items = params.items ?? [];
  const formatted = formatPrescription(items);

  return {
    id: crypto.randomUUID(),
    externalId: crypto.randomUUID(),
    status: formatted.canFinalize ? 'validated' : 'draft',
    patient: params.patient,
    prescriber: params.prescriber,
    items,
    alerts: formatted.alerts,
    text: formatted.text,
    canFinalize: formatted.canFinalize,
    printSettings: {
      primaryColor: '#0d9488',
      showHeader: true,
      showFooter: true,
      showManufacturer: false,
      fontScale: 'normal',
      includeSafetyNotes: true,
      ...params.printSettings,
    },
    signed: false,
    channels: ['internal'],
    createdAt: now,
    updatedAt: now,
  };
}

export function updatePrescriptionItems(document: PrescriptionDocument, items: PrescriptionDraftItem[]) {
  const formatted = formatPrescription(items);
  return {
    ...document,
    items,
    alerts: formatted.alerts,
    text: formatted.text,
    canFinalize: formatted.canFinalize,
    status: formatted.canFinalize ? 'validated' as const : 'draft' as const,
    updatedAt: new Date().toISOString(),
  };
}

export function issuePrescription(document: PrescriptionDocument) {
  if (!document.canFinalize) {
    return {
      document,
      event: createPrescriptionEvent(document.id, 'safety-alert', {
        reason: 'critical-alerts',
        alerts: document.alerts,
      }),
      error: 'Prescrição contém alerta crítico ou campos mínimos pendentes.',
    };
  }

  const issued = {
    ...document,
    status: 'issued' as const,
    updatedAt: new Date().toISOString(),
  };

  return {
    document: issued,
    event: createPrescriptionEvent(document.id, 'issued', { signed: issued.signed }),
    error: null,
  };
}

export function markPrescriptionPrinted(document: PrescriptionDocument, signed = false) {
  const printed = {
    ...document,
    status: 'printed' as const,
    signed,
    channels: Array.from(new Set([...document.channels, 'print' as const, 'pdf' as const])),
    updatedAt: new Date().toISOString(),
  };

  return {
    document: printed,
    event: createPrescriptionEvent(document.id, 'printed', { signed }),
  };
}

export function markPrescriptionSent(document: PrescriptionDocument, channel: Exclude<PrescriptionChannel, 'internal' | 'print' | 'pdf'>) {
  const sent = {
    ...document,
    status: 'sent' as const,
    channels: Array.from(new Set([...document.channels, channel])),
    updatedAt: new Date().toISOString(),
  };

  return {
    document: sent,
    event: createPrescriptionEvent(document.id, 'sent', { channel }),
  };
}

export function cancelPrescription(document: PrescriptionDocument, reason: string) {
  const cancelled = {
    ...document,
    status: 'cancelled' as const,
    updatedAt: new Date().toISOString(),
  };

  return {
    document: cancelled,
    event: createPrescriptionEvent(document.id, 'cancelled', { reason }),
  };
}

function createPrescriptionEvent(
  prescriptionId: string,
  type: PrescriptionWorkflowEvent['type'],
  payload?: Record<string, unknown>,
): PrescriptionWorkflowEvent {
  return {
    id: crypto.randomUUID(),
    prescriptionId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export function serializePrescriptionForProntuario(document: PrescriptionDocument) {
  const patient = [
    `Paciente: ${document.patient.fullName}`,
    document.patient.document ? `Documento: ${document.patient.document}` : null,
    document.patient.birthDate ? `Nascimento: ${document.patient.birthDate}` : null,
    document.patient.weightKg ? `Peso: ${document.patient.weightKg} kg` : null,
  ].filter(Boolean).join('\n');

  const prescriber = [
    `Prescritor: ${document.prescriber.fullName}`,
    `${document.prescriber.council}/${document.prescriber.councilState}: ${document.prescriber.councilNumber}`,
    document.prescriber.specialty ? `Especialidade: ${document.prescriber.specialty}` : null,
  ].filter(Boolean).join('\n');

  const signature = document.signed
    ? 'Assinatura: documento marcado como assinado/validado no fluxo interno.'
    : 'Assinatura: pendente ou não informada.';

  return [
    'DOCUMENTO DE PRESCRIÇÃO — RHEMAFLOW',
    patient,
    prescriber,
    document.text,
    signature,
    `Status: ${document.status}`,
    `ID externo: ${document.externalId}`,
  ].join('\n\n');
}
