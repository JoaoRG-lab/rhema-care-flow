import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * ADR-002: manualChunks para reduzir bundles >500kb
 * Blockchain (Solana) e PDF são lazy — carregados sob demanda.
 * Ver docs/adr/ADR-002-bundle-split-vite.md
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '::',
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Blockchain — lazy, carregado só no módulo URV Privacy
          if (
            id.includes('@solana/web3.js') ||
            id.includes('@coral-xyz/anchor') ||
            id.includes('@project-serum')
          ) {
            return 'vendor-blockchain';
          }

          // PDF — lazy, carregado só ao exportar
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake')) {
            return 'vendor-pdf';
          }

          // Motor matemático — eager, core clínico
          if (
            id.includes('src/lib/calculators') ||
            id.includes('src/lib/clinicalScores') ||
            id.includes('src/lib/qualityTestEngine')
          ) {
            return 'calculators';
          }

          // Supabase — eager
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // TanStack Query — eager
          if (id.includes('@tanstack')) {
            return 'vendor-query';
          }

          // Radix UI / shadcn — eager
          if (
            id.includes('@radix-ui') ||
            id.includes('class-variance-authority') ||
            id.includes('cmdk') ||
            id.includes('lucide-react')
          ) {
            return 'vendor-ui';
          }

          // React core — eager
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('react-router-dom')
          ) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
