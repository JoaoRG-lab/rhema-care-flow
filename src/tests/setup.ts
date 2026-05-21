import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Silencia warnings de act() desnecessarios
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock matchMedia (jsdom nao implementa)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = vi.fn(cb => { cb(0); return 0; });
globalThis.cancelAnimationFrame  = vi.fn();
