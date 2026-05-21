import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./src/tests/setup.ts'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'html'],
      include:    ['src/**/*.{ts,tsx}'],
      exclude:    ['src/tests/**', 'src/types/**', 'src/lib/**'],
      thresholds: { lines: 60, branches: 55, functions: 60, statements: 60 },
    },
  },
});
