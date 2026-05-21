import { describe, it, expect } from 'vitest';
import { ScoreService } from '../services/ScoreService';

describe('ScoreService — calculos clinicos', () => {

  describe('DAS28-CRP', () => {
    it('classifica remissao (valor < 2.6)', () => {
      const { value, interpretation } = ScoreService.calcDAS28({ tj: 0, ts: 0, crp: 0.1, vas: 0 });
      expect(value).toBeLessThan(2.6);
      expect(interpretation).toBe('Remissao');
    });

    it('classifica alta atividade (valor >= 5.1)', () => {
      const { value, interpretation } = ScoreService.calcDAS28({ tj: 20, ts: 20, crp: 50, vas: 90 });
      expect(value).toBeGreaterThanOrEqual(5.1);
      expect(interpretation).toBe('Alta atividade');
    });

    it('retorna numero com 2 casas decimais', () => {
      const { value } = ScoreService.calcDAS28({ tj: 5, ts: 4, crp: 10, vas: 40 });
      expect(Number.isFinite(value)).toBe(true);
      expect(value.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
    });
  });

  describe('SDAI', () => {
    it('classifica remissao (valor <= 3.3)', () => {
      const { value, interpretation } = ScoreService.calcSDAI({ tj: 0, ts: 0, aglobal: 1, pglobal: 1, pcrm: 0.5 });
      expect(value).toBeLessThanOrEqual(3.3);
      expect(interpretation).toBe('Remissao');
    });

    it('classifica alta atividade (valor > 26)', () => {
      const { interpretation } = ScoreService.calcSDAI({ tj: 10, ts: 10, aglobal: 8, pglobal: 8, pcrm: 5 });
      expect(interpretation).toBe('Alta atividade');
    });
  });

  describe('Wells DVT', () => {
    it('baixa probabilidade (score <= 0)', () => {
      const { interpretation } = ScoreService.calcWells({ a: 0, b: 0 });
      expect(interpretation).toContain('Baixa');
    });

    it('alta probabilidade (score > 2)', () => {
      const { interpretation } = ScoreService.calcWells({ a: 2, b: 1 });
      expect(interpretation).toContain('Alta');
    });
  });

  describe('BASFI', () => {
    it('funcionalidade preservada (media < 3)', () => {
      const { interpretation } = ScoreService.calcBASFI([1, 2, 1, 2, 1, 2, 1, 2, 1, 2]);
      expect(interpretation).toBe('Funcionalidade preservada');
    });

    it('incapacidade grave (media >= 6)', () => {
      const { interpretation } = ScoreService.calcBASFI([8, 9, 7, 8, 9, 7, 8, 9, 7, 8]);
      expect(interpretation).toBe('Incapacidade grave');
    });

    it('calcula media correta de 10 itens', () => {
      const inputs = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      const { value } = ScoreService.calcBASFI(inputs);
      expect(value).toBe(5.0);
    });
  });
});
