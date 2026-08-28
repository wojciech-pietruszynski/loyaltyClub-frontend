import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Backend zyje w osobnym repozytorium — adres nadpisywalny przez env.
      '/api': process.env.VITE_DEV_API_PROXY || 'http://localhost:8089'
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude || [],
        'src/main.tsx',
        'src/api/client.ts', // Partial coverage already
      ],
    },
  },
})
