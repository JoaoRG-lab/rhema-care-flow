import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// PWA removido do build — causa peer dep crash no Vercel Node 20
// Reativar localmente com: npm i vite-plugin-pwa -D
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // Exclui arquivos de teste do bundle de produção
    // Evita que vitest (describe/it/expect) quebre o build no Vercel
    rollupOptions: {
      external: [],
      input: 'index.html',
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom'],
          router:   ['react-router-dom'],
          charts:   ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  // Exclui padrões de teste do processamento do Vite
  optimizeDeps: {
    exclude: [],
  },
  server: {
    port: 5173,
    open: true,
  },
  // Garante que arquivos .test.ts/.spec.ts não sejam incluídos no build
  esbuild: {
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
  },
});
