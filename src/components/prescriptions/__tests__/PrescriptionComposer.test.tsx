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

  it('blocks save with inline errors when drug, dose or frequency are missing', async () => {
    const user = userEvent.setup();
    const { onSaveDraft } = setup();

    const draftBtn = screen.getByRole('button', { name: /Salvar Rascunho/i });
    const signBtn = screen.getByRole('button', { name: /Salvar e Assinar/i });

    // Buttons stay enabled, but clicking with empty fields must NOT save
    // and must surface inline error messages.
    await user.click(draftBtn);
    expect(onSaveDraft).not.toHaveBeenCalled();
    expect(screen.getByText(/Informe o medicamento\./i)).toBeInTheDocument();
    expect(screen.getByText(/Informe a dose\./i)).toBeInTheDocument();

    // Fill only the drug — dose error must remain
    const drugInput = screen.getByPlaceholderText(/Nome do medicamento/i);
    await user.type(drugInput, 'Metotrexato');
    await user.click(draftBtn);
    expect(onSaveDraft).not.toHaveBeenCalled();
    expect(screen.queryByText(/Informe o medicamento\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/Informe a dose\./i)).toBeInTheDocument();

    // Fill the dose — now save proceeds (default frequency is preset)
    await user.type(screen.getByPlaceholderText(/ex: 7,5 mg/i), '15 mg');
    await user.click(signBtn);
    // signBtn calls onSaveAndSign, not onSaveDraft — but draft remains uncalled
    expect(onSaveDraft).not.toHaveBeenCalled();
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

  // ── Helpers for the rapid-edit scenarios ────────────────────────────────
  const getDrugInputs = () =>
    screen.getAllByPlaceholderText(/Nome do medicamento/i) as HTMLInputElement[];
  const getDoseInputs = () =>
    screen.getAllByPlaceholderText(/ex: 7,5 mg/i) as HTMLInputElement[];
  const getInstructionInputs = () =>
    screen.getAllByPlaceholderText(/tomar em jejum/i) as HTMLInputElement[];
  const getTrashButtons = () =>
    screen.getAllByRole('button').filter((b) => b.querySelector('svg.lucide-trash2'));
  const clickAdd = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: /Adicionar item/i }));

  it('keeps each field attached to the right row across rapid add/remove', async () => {
    const user = userEvent.setup();
    setup();

    // Build three rows: A, B, C
    await clickAdd(user);
    await clickAdd(user);

    let drugs = getDrugInputs();
    expect(drugs).toHaveLength(3);

    await user.type(drugs[0], 'A-drug');
    await user.type(drugs[1], 'B-drug');
    await user.type(drugs[2], 'C-drug');

    // Per-row dose values prove fields stay paired with their owner row
    let doses = getDoseInputs();
    expect(doses).toHaveLength(3);
    await user.type(doses[0], '5 mg');
    await user.type(doses[1], '10 mg');
    await user.type(doses[2], '15 mg');

    // Sanity check: still aligned before any removal
    drugs = getDrugInputs();
    doses = getDoseInputs();
    expect(drugs.map((i) => i.value)).toEqual(['A-drug', 'B-drug', 'C-drug']);
    expect(doses.map((i) => i.value)).toEqual(['5 mg', '10 mg', '15 mg']);

    // Remove the MIDDLE row (B). Index pre-fix this used to recycle the
    // wrong child and corrupt C's fields. With stable `_id` keys, A and C
    // must remain intact and unduplicated.
    const trashes = getTrashButtons();
    expect(trashes).toHaveLength(3); // not shown when isOnly
    await user.click(trashes[1]);

    drugs = getDrugInputs();
    doses = getDoseInputs();
    expect(drugs).toHaveLength(2);
    expect(doses).toHaveLength(2);
    expect(drugs.map((i) => i.value)).toEqual(['A-drug', 'C-drug']);
    expect(doses.map((i) => i.value)).toEqual(['5 mg', '15 mg']);

    // No row should appear twice (no duplication regression)
    const allDrugValues = drugs.map((i) => i.value);
    expect(new Set(allDrugValues).size).toBe(allDrugValues.length);
  });

  it('preserves field-to-row pairing through 5 rapid add/remove cycles', async () => {
    const user = userEvent.setup();
    setup();

    // Cycle: add → type unique value → remove last → assert head still intact
    const headDrug = getDrugInputs()[0];
    await user.type(headDrug, 'HEAD');
    await user.type(getDoseInputs()[0], 'HEAD-DOSE');

    for (let i = 0; i < 5; i++) {
      await clickAdd(user);
      const drugs = getDrugInputs();
      expect(drugs).toHaveLength(2);
      await user.type(drugs[1], `tmp-${i}`);
      await user.type(getDoseInputs()[1], `tmp-dose-${i}`);

      // Remove the just-added row
      const trashes = getTrashButtons();
      // 1 item visible? trash hidden — we have 2, so 1 trash per non-only row
      expect(trashes.length).toBeGreaterThanOrEqual(1);
      await user.click(trashes[trashes.length - 1]);

      // HEAD must never revert, duplicate, or lose its dose
      const remainingDrugs = getDrugInputs();
      const remainingDoses = getDoseInputs();
      expect(remainingDrugs).toHaveLength(1);
      expect(remainingDrugs[0].value).toBe('HEAD');
      expect(remainingDoses).toHaveLength(1);
      expect(remainingDoses[0].value).toBe('HEAD-DOSE');
    }
  });

  it('does not show a trash button when only one item remains (no accidental delete)', async () => {
    const user = userEvent.setup();
    setup();

    expect(getTrashButtons()).toHaveLength(0);

    await clickAdd(user);
    expect(getTrashButtons()).toHaveLength(2);

    await user.click(getTrashButtons()[1]);
    // Back to one row → trash hidden again
    expect(getTrashButtons()).toHaveLength(0);
  });

  it('resets to a clean single empty row after a successful save (reopen scenario)', async () => {
    const user = userEvent.setup();
    const { onSaveDraft } = setup();

    // Build two rows of data
    await clickAdd(user);
    const drugs = getDrugInputs();
    await user.type(drugs[0], 'Metotrexato');
    await user.type(drugs[1], 'Ácido Fólico');
    await user.type(getDoseInputs()[0], '15 mg');
    await user.type(getDoseInputs()[1], '5 mg');
    await user.type(screen.getByPlaceholderText(/ex: M05.3/i), 'M05.3');
    await user.type(
      screen.getByPlaceholderText(/Retorno em 30 dias/i),
      'Monitorar hemograma',
    );

    // Save as draft
    await user.click(screen.getByRole('button', { name: /Salvar Rascunho/i }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);

    // After save the form must reset — simulating "reopen" without remount.
    // Exactly ONE empty row, no carryover values, CID-10 + notes cleared.
    const drugsAfter = getDrugInputs();
    expect(drugsAfter).toHaveLength(1);
    expect(drugsAfter[0].value).toBe('');

    const dosesAfter = getDoseInputs();
    expect(dosesAfter).toHaveLength(1);
    expect(dosesAfter[0].value).toBe('');

    expect(
      (screen.getByPlaceholderText(/ex: M05.3/i) as HTMLInputElement).value,
    ).toBe('');
    expect(
      (screen.getByPlaceholderText(/Retorno em 30 dias/i) as HTMLTextAreaElement).value,
    ).toBe('');

    // And the second save must NOT include any of the previous values
    await user.type(getDrugInputs()[0], 'Prednisona');
    await user.click(screen.getByRole('button', { name: /Salvar Rascunho/i }));

    expect(onSaveDraft).toHaveBeenCalledTimes(2);
    const [items2] = onSaveDraft.mock.calls[1];
    expect(items2).toHaveLength(1);
    expect(items2[0].drug).toBe('Prednisona');
    // Make sure stale values from the first submission did not leak through
    expect(items2[0].dose).toBe('');
    expect(items2.some((it: { drug: string }) => it.drug === 'Metotrexato')).toBe(false);
    expect(items2.some((it: { drug: string }) => it.drug === 'Ácido Fólico')).toBe(false);
  });

  it('keeps per-row instructions independent (no field bleed across rows)', async () => {
    const user = userEvent.setup();
    const { onSaveDraft } = setup();

    await clickAdd(user);
    await clickAdd(user);

    const drugs = getDrugInputs();
    await user.type(drugs[0], 'Drug-A');
    await user.type(drugs[1], 'Drug-B');
    await user.type(drugs[2], 'Drug-C');

    const instructions = getInstructionInputs();
    expect(instructions).toHaveLength(3);
    await user.type(instructions[0], 'after-meal-A');
    await user.type(instructions[1], 'fasting-B');
    await user.type(instructions[2], 'bedtime-C');

    // Remove row B
    await user.click(getTrashButtons()[1]);

    await user.click(screen.getByRole('button', { name: /Salvar Rascunho/i }));
    const [items] = onSaveDraft.mock.calls[0];

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ drug: 'Drug-A', instructions: 'after-meal-A' });
    expect(items[1]).toMatchObject({ drug: 'Drug-C', instructions: 'bedtime-C' });
    // No row inherited B's instructions
    expect(items.some((it: { instructions: string }) => it.instructions === 'fasting-B')).toBe(false);
  });
});
