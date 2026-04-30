/**
 * prescriptionValidation
 * Zod-based validation for prescription PDF export.
 *
 * Goal: prevent generating PDFs from malformed or incomplete prescriptions.
 * Returns a structured result with field-level errors instead of throwing,
 * so callers can display them in the UI banner.
 */
import { z } from 'zod';
import type { Prescription, PrescriptionItem } from '@/hooks/usePrescriptions';

// CID-10 codes are typically 1 letter + 2 digits, optionally + ".N" or ".NN"
// e.g. "M05.3", "I10", "M79.10". Be lenient (allow lowercase normalised upstream).
const CID10_PATTERN = /^[A-Z][0-9]{2}(\.[0-9]{1,2})?$/;

// Each prescription item must at minimum have a drug + dose + frequency.
const itemSchema = z.object({
  drug: z
    .string()
    .trim()
    .nonempty({ message: 'Medicamento é obrigatório' })
    .max(200, { message: 'Nome do medicamento muito longo (máx. 200)' }),
  dose: z
    .string()
    .trim()
    .nonempty({ message: 'Dose é obrigatória' })
    .max(80, { message: 'Dose muito longa (máx. 80)' }),
  route: z.string().trim().max(40, { message: 'Via muito longa (máx. 40)' }).optional().or(z.literal('')),
  frequency: z
    .string()
    .trim()
    .nonempty({ message: 'Frequência é obrigatória' })
    .max(80, { message: 'Frequência muito longa (máx. 80)' }),
  duration: z.string().trim().max(80, { message: 'Duração muito longa (máx. 80)' }).optional().or(z.literal('')),
  instructions: z
    .string()
    .trim()
    .max(500, { message: 'Instruções muito longas (máx. 500)' })
    .optional()
    .or(z.literal('')),
});

const prescriptionSchema = z.object({
  id: z.string().trim().nonempty({ message: 'ID da prescrição ausente' }),
  patient_id: z.string().trim().nonempty({ message: 'Paciente ausente' }),
  status: z.enum(['draft', 'signed', 'dispensed', 'cancelled'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  items: z
    .array(itemSchema)
    .min(1, { message: 'A prescrição precisa de pelo menos 1 medicamento' })
    .max(30, { message: 'Limite de 30 medicamentos por prescrição' }),
  cid10: z
    .string()
    .trim()
    .max(10)
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || CID10_PATTERN.test(v),
      { message: 'CID-10 inválido (ex.: M05.3, I10)' },
    ),
  notes: z.string().max(2000, { message: 'Observações muito longas (máx. 2000)' }).optional().nullable(),
});

const patientCodeSchema = z
  .string()
  .trim()
  .nonempty({ message: 'Código do paciente ausente' })
  .max(64, { message: 'Código do paciente muito longo' });

export interface PrescriptionValidationIssue {
  path: string;     // e.g. "items[0].dose" or "cid10"
  message: string;
}

export type PrescriptionValidationResult =
  | { ok: true }
  | { ok: false; issues: PrescriptionValidationIssue[] };

/**
 * Additional semantic checks not easily expressed in Zod. Run after schema
 * validation passes. Currently:
 *   - signed prescriptions must include the signature payload
 *   - signed prescriptions must include signer name + CRM
 */
function semanticChecks(rx: Prescription): PrescriptionValidationIssue[] {
  const issues: PrescriptionValidationIssue[] = [];

  if (rx.status === 'signed') {
    if (!rx.signature_data_url) {
      issues.push({ path: 'signature_data_url', message: 'Assinatura digital ausente' });
    }
    if (!rx.signed_by_name?.trim()) {
      issues.push({ path: 'signed_by_name', message: 'Nome do profissional ausente' });
    }
    if (!rx.signed_by_crm?.trim()) {
      issues.push({ path: 'signed_by_crm', message: 'CRM do profissional ausente' });
    }
  }

  return issues;
}

export function validatePrescriptionForExport(
  rx: Prescription | null | undefined,
  patientCode: string | null | undefined,
): PrescriptionValidationResult {
  const issues: PrescriptionValidationIssue[] = [];

  if (!rx) {
    return { ok: false, issues: [{ path: 'rx', message: 'Prescrição ausente' }] };
  }

  const codeParse = patientCodeSchema.safeParse(patientCode);
  if (!codeParse.success) {
    for (const e of codeParse.error.issues) {
      issues.push({ path: 'patientCode', message: e.message });
    }
  }

  const rxParse = prescriptionSchema.safeParse({
    id: rx.id,
    patient_id: rx.patient_id,
    status: rx.status,
    items: rx.items,
    cid10: rx.cid10,
    notes: rx.notes,
  });

  if (!rxParse.success) {
    for (const e of rxParse.error.issues) {
      issues.push({
        path: e.path
          .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`))
          .join(''),
        message: e.message,
      });
    }
  } else {
    issues.push(...semanticChecks(rx));
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

/**
 * Custom error thrown when validation fails so callers (and the error banner
 * in PrescriptionList) can distinguish validation failures from runtime
 * jsPDF / browser errors.
 */
export class PrescriptionValidationError extends Error {
  readonly issues: PrescriptionValidationIssue[];
  constructor(issues: PrescriptionValidationIssue[]) {
    super(
      issues.length === 1
        ? issues[0].message
        : `Prescrição inválida: ${issues.map((i) => i.message).join('; ')}`,
    );
    this.name = 'PrescriptionValidationError';
    this.issues = issues;
  }
}
