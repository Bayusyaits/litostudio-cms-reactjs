import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@litostudio/templates': path.resolve(__dirname, '../../packages/templates/src/index.ts'),
      '@litostudio/template-system': path.resolve(__dirname, '../../packages/template-system/src/index.ts'),
      // section-schema's package.json now points main/exports at ./dist (so
      // apps/backend can consume it via NodeNext resolution — 2026-07
      // architecture standardization). This alias keeps the CMS resolving
      // straight to source as it already did before that change, with no
      // dependency on dist/ being built.
      '@litostudio/section-schema': path.resolve(__dirname, '../../packages/section-schema/src/index.ts'),
      // Shared CMS UI package (design tokens, components, Gutenberg editor,
      // services/stores/hooks) — consumed as raw TS source, same convention
      // as the aliases above. Mirrors apps/cms-superadmin's existing alias.
      '@litostudio/ui-cms': path.resolve(__dirname, '../../packages/ui-cms/src/index.ts'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('@ckeditor/')) {
            return 'editor-vendor'
          }

          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/') ||
            id.includes('/zod/')
          ) {
            return 'form-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
