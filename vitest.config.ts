// apps/cms/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/hooks/**', 'src/lib/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@litostudio/templates':        path.resolve(__dirname, '../../packages/templates/src/index.ts'),
      '@litostudio/template-system':  path.resolve(__dirname, '../../packages/template-system/src/index.ts'),
    },
  },
})
