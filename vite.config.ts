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
        description: 'Plataforma de gestão de saúde Rhema Care',
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
            // Cache fontes do Fontshare/Google
            urlPattern: /^https:\/\/(api\.fontshare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache assets estáticos do Supabase Storage
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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts':   ['recharts'],
        },
      },
    },
  },
});
