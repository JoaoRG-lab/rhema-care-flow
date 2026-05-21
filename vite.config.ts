import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Rhema Care Flow',
        short_name: 'RhemaCare',
        description: 'Sistema de gestão em saúde — prontuários, scores e teleconsulta',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Novo Paciente',   short_name: 'Paciente',   url: '/patients/new', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
          { name: 'Teleconsulta',   short_name: 'Telecons.',   url: '/teleconsulta', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
          { name: 'Relatórios',     short_name: 'Relatórios', url: '/reports',       icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
        ],
        screenshots: [
          { src: '/screenshots/desktop.png', sizes: '1280x800',  type: 'image/png', form_factor: 'wide' },
          { src: '/screenshots/mobile.png',  sizes: '390x844',   type: 'image/png', form_factor: 'narrow' },
        ],
      },
      workbox: {
        // Cache de assets estáticos por 1 ano
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Supabase API — network-first, fallback cache 5min
            urlPattern: /https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Fontes — cache-first
            urlPattern: /https:\/\/(fonts\.googleapis\.com|api\.fontshare\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: { alias: { '@': '/src' } },
  build: {
    target:    'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:    ['react', 'react-dom'],
          supabase:  ['@supabase/supabase-js'],
          router:    ['react-router-dom'],
        },
      },
    },
  },
});
