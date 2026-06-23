import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/biblia/',   // ← cambiá 'biblia' por el nombre exacto del repo en GitHub
  server: {
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'El Libro del Pueblo de Dios',
        short_name: 'Biblia',
        description: 'Lectura de la Biblia — El Libro del Pueblo de Dios',
        theme_color: '#5b4636',
        background_color: '#fdf6e3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/biblia/',
        scope: '/biblia/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 6_000_000,
        runtimeCaching: [
          {
            urlPattern: /\/book\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-data',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
});
