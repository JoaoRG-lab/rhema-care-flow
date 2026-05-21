import { describe, it, expect } from 'vitest';

// Utilitarios puros — sem dependencias externas
function formatCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function age(birthdate: string): number {
  const [y, m, d] = birthdate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

describe('Utilitarios de formatacao', () => {
  it('formata CPF corretamente', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('formata celular com 11 digitos', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formata telefone fixo com 10 digitos', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('calcula idade corretamente', () => {
    const year = new Date().getFullYear() - 30;
    expect(age(`${year}-01-01`)).toBeGreaterThanOrEqual(29);
    expect(age(`${year}-01-01`)).toBeLessThanOrEqual(30);
  });
});
