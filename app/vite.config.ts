import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/konkani-meal-planner/ on GitHub Pages.
const base = '/konkani-meal-planner/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Konkani Meal Planner',
        short_name: 'Meal Planner',
        description: 'What to cook each day, from the cookbook you already own.',
        theme_color: '#115e59',
        background_color: '#e2e8f0',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,json}'] },
    }),
  ],
  // The corpus lives in ../extraction until Pass 2 moves it into the app.
  server: { fs: { allow: ['..'] } },
  test: { environment: 'node' },
});
