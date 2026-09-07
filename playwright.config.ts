import { defineConfig, devices } from '@playwright/test';

/**
 * Testy end-to-end panelu administracyjnego.
 *
 * Scenariusze przechodzą przez przeglądarkę do **działającej** warstwy serwerowej,
 * a nie do atrapy. Testy jednostkowe warstwy klienckiej podmieniają klienta HTTP,
 * więc sprawdzają zachowanie komponentów wobec kontraktu *odtworzonego* z kodu
 * serwera — rozjazd kontraktu jest dla nich niewidoczny. Te testy zamykają tę lukę.
 *
 * Uruchomienie:
 *   docker compose up -d                     (w repozytorium backendu)
 *   set E2E_ADMIN_PASSWORD=...
 *   npm run test:e2e
 *
 * Serwer deweloperski Vite podnosi Playwright samodzielnie (`webServer`), a jego
 * pośrednik `/api` kieruje żądania do backendu wskazanego przez VITE_DEV_API_PROXY.
 */
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8089';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e',
  // Scenariusze dzielą jedną bazę danych, więc równoległość dawałaby wyniki
  // zależne od kolejności — a test, którego wynik zależy od kolejności, nie jest
  // twierdzeniem o systemie.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pl-PL',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_DEV_API_PROXY: API_URL,
    },
  },
});
