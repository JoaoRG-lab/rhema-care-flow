/**
 * PrescriptionComposer flow tests
 *
 * Covers the common authoring flow:
 *   1. Renders with the patient code and an initial empty item.
 *   2. Save buttons are disabled until at least one drug name is entered.
 *   3. Adding/removing items keeps the composer in a valid state.
 *   4. "Salvar Rascunho" calls onSaveDraft with the typed items, notes, CID-10.
 *   5. "Salvar e Assinar" calls onSaveAndSign with the same payload.
 *   6. CID-10 is forced to upper-case (regression guard).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionComposer } from '../PrescriptionComposer';

// jsdom doesn't implement scrollIntoView used by some Radix primitives
beforeEach(() => {
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = vi.fn();
});

function setup(overrides: Partial<React.ComponentProps<typeof PrescriptionComposer>> = {}) {
  const onSaveDraft = vi.fn().mockResolvedValue(undefined);
  const onSaveAndSign = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <PrescriptionComposer
      patientCode="PT-0001"
      onSaveDraft={onSaveDraft}
      onSaveAndSign={onSaveAndSign}
      {...overrides}
    />,
  );
  return { onSaveDraft, onSaveAndSign, ...utils };
}

describe('PrescriptionComposer', () => {
  it('renders the patient code in the header', () => {
    setup();
    expect(screen.getByText(/Nova Prescrição — PT-0001/)).toBeInTheDocument();
  });

  it('disables save buttons until a drug is named', async () => {
    const user = userEvent.setup();
    setup();

    const draftBtn = screen.getByRole('button', { name: /Salvar Rascunho/i });
    const signBtn = screen.getByRole('button', { name: /Salvar e Assinar/i });

    expect(draftBtn).toBeDisabled();
    expect(signBtn).toBeDisabled();

    const drugInput = screen.getByPlaceholderText(/Nome do medicamento/i);
    await user.type(drugInput, 'Metotrexato');

    expect(draftBtn).toBeEnabled();
    expect(signBtn).toBeEnabled();
  });

  it('calls onSaveDraft with the composed items, notes and CID-10', async () => {
    const user = userEvent.setup();
    const { onSaveDraft } = setup();

    await user.type(screen.getByPlaceholderText(/Nome do medicamento/i), 'Metotrexato');
    await user.type(screen.getByPlaceholderText(/ex: 7,5 mg/i), '15 mg');
    await user.type(
      screen.getByPlaceholderText(/ex: M05.3/i),
      'm05.3',
    );
    await user.type(
      screen.getByPlaceholderText(/Retorno em 30 dias/i),
      'Monitorar hemograma',
    );

    await user.click(screen.getByRole('button', { name: /Salvar Rascunho/i }));

    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    const [items, notes, cid10] = onSaveDraft.mock.calls[0];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      drug: 'Metotrexato',
      dose: '15 mg',
      route: 'Oral',
      frequency: '1x ao dia',
      duration: '30 dias',
    });
    expect(notes).toBe('Monitorar hemograma');
    // CID-10 is auto-uppercased — regression guard
    expect(cid10).toBe('M05.3');
  });

  it('calls onSaveAndSign when "Salvar e Assinar" is clicked', async () => {
    const user = userEvent.setup();
    const { onSaveAndSign } = setup();

    await user.type(screen.getByPlaceholderText(/Nome do medicamento/i), 'Prednisona');
    await user.click(screen.getByRole('button', { name: /Salvar e Assinar/i }));

    expect(onSaveAndSign).toHaveBeenCalledTimes(1);
    const [items] = onSaveAndSign.mock.calls[0];
    expect(items[0].drug).toBe('Prednisona');
  });

  it('adds and removes prescription items', async () => {
    const user = userEvent.setup();
    setup();

    // Initially one item — placeholder reads "Medicamento 1"
    expect(screen.getAllByPlaceholderText(/Nome do medicamento/i)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Adicionar item/i }));
    expect(screen.getAllByPlaceholderText(/Nome do medicamento/i)).toHaveLength(2);

    // Type into both
    const inputs = screen.getAllByPlaceholderText(/Nome do medicamento/i);
    await user.type(inputs[0], 'Metotrexato');
    await user.type(inputs[1], 'Ácido Fólico');

    // Remove the first via its trash button. The trash button has no
    // accessible name, so we find it by class structure inside its row.
    const trashButtons = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('svg.lucide-trash2'));
    expect(trashButtons.length).toBeGreaterThan(0);
    await user.click(trashButtons[0]);

    const remaining = screen.getAllByPlaceholderText(/Nome do medicamento/i);
    expect(remaining).toHaveLength(1);
    expect((remaining[0] as HTMLInputElement).value).toBe('Ácido Fólico');
  });
});
