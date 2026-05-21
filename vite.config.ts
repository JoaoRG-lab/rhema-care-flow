import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rhema Care Flow',
        short_name: 'RhemaCare',
        description: 'Plataforma de gest\u00e3o de sa\u00fade Rhema Care',
        theme_color: '#0d9488',
        background_color: '#f7f6f2',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Agenda',    short_name: 'Agenda',    url: '/schedule',    icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
          { name: 'Pacientes', short_name: 'Pacientes', url: '/patients',    icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
        ],
        screenshots: [
          { src: '/screenshots/desktop.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide',   label: 'Dashboard' },
          { src: '/screenshots/mobile.png',  sizes: '390x844',  type: 'image/png', form_factor: 'narrow', label: 'Agenda'    },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(api\.fontshare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    // Resolve o warning "CJS build of Vite's Node API is deprecated"
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendors est\u00e1ticos
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          // Charts: lazy chunk separado — s\u00f3 carrega em ReportsPage
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }
        },
      },
    },
  },
});
