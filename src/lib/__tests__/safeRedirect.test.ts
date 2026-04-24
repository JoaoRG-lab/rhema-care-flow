import { describe, it, expect } from 'vitest';
import { isSafeInternalPath, safeRedirect, buildRedirectQuery } from '../safeRedirect';

describe('isSafeInternalPath', () => {
  it('accepts plain root-relative paths', () => {
    expect(isSafeInternalPath('/dashboard')).toBe(true);
    expect(isSafeInternalPath('/pediatria')).toBe(true);
    expect(isSafeInternalPath('/specialty/obstetrics')).toBe(true);
    expect(isSafeInternalPath('/scores?calc=bishop')).toBe(true);
    expect(isSafeInternalPath('/path?a=1&b=2#frag')).toBe(true);
  });

  it.each([
    'https://evil.com',
    'http://evil.com',
    'HTTPS://EVIL.COM',
    'ftp://evil.com',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'mailto:x@evil.com',
    'vbscript:msgbox(1)',
    '//evil.com',
    '//evil.com/path',
    '\\\\evil.com',
    '\\evil.com',
    '/\\evil.com',
    '/\\\\evil.com',
    '%2F%2Fevil.com',
    '%2f%2fevil.com',
    '%5C%5Cevil.com',
    '/path@evil.com',
    'evil.com',
    'dashboard',
    '',
    ' /dashboard',
    '/dashboard\n',
    '/path with space',
    '/\u0000injected',
    '/path?next=https://evil.com://x',
  ])('rejects unsafe value %j', (input) => {
    expect(isSafeInternalPath(input)).toBe(false);
  });

  it.each([null, undefined, 0, false, {}, [], 123])(
    'rejects non-string value %j',
    (input) => {
      expect(isSafeInternalPath(input as unknown)).toBe(false);
    },
  );

  it('rejects malformed percent-encoding', () => {
    expect(isSafeInternalPath('/%E0%A4%A')).toBe(false);
  });

  it('rejects excessively long input', () => {
    expect(isSafeInternalPath('/' + 'a'.repeat(600))).toBe(false);
  });
});

describe('safeRedirect', () => {
  it('returns the validated value when safe', () => {
    expect(safeRedirect('/pediatria')).toBe('/pediatria');
  });

  it('falls back to /dashboard for unsafe input', () => {
    expect(safeRedirect('https://evil.com')).toBe('/dashboard');
    expect(safeRedirect('//evil.com')).toBe('/dashboard');
    expect(safeRedirect(null)).toBe('/dashboard');
    expect(safeRedirect(undefined)).toBe('/dashboard');
  });

  it('honors a custom fallback', () => {
    expect(safeRedirect('javascript:alert(1)', '/home')).toBe('/home');
  });
});

describe('buildRedirectQuery', () => {
  it('returns an empty string when target equals fallback', () => {
    expect(buildRedirectQuery('/dashboard')).toBe('');
  });

  it('encodes safe targets into a query fragment', () => {
    expect(buildRedirectQuery('/pediatria')).toBe('?redirect=%2Fpediatria');
    expect(buildRedirectQuery('/scores?calc=bishop')).toBe(
      '?redirect=%2Fscores%3Fcalc%3Dbishop',
    );
  });

  it('drops unsafe targets and returns empty', () => {
    expect(buildRedirectQuery('https://evil.com')).toBe('');
  });
});
