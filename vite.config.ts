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
  base: '/',
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'recharts'],
          router:   ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: [],
  },
  server: {
    port: 5173,
    open: true,
  },
  esbuild: {
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
  },
});
