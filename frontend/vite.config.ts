import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/]
      },
      manifest: {
        name: 'Zakat Management App',
        short_name: 'ZakatApp',
        description: 'Aplikasi Manajemen Zakat untuk mempermudah pencatatan penerimaan dan penyaluran dana zakat.',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
