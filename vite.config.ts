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
    // Katalog e2e nalezy do Playwrighta - jego przypadki wymagaja przegladarki
    // i dzialajacego backendu, wiec vitest nie ma ich zbierac.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude || [],
        'src/main.tsx',
        'src/api/client.ts',   // pokryty osobnym zestawem testów
        'src/test/**',         // atrapy i harness testowy
        'src/types/**',        // same deklaracje typów
        'src/i18n/{pl,en,de}.ts', // słowniki tłumaczeń
        'playwright.config.ts', // konfiguracja testów end-to-end
        'e2e/**',              // scenariusze Playwrighta, nie kod aplikacji
      ],
    },
  },
})
