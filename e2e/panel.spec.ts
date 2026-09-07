import { expect, test, type Page } from '@playwright/test';

/**
 * Ścieżki operatora przez przeglądarkę do **działającej** warstwy serwerowej.
 *
 * Testy jednostkowe warstwy klienckiej podmieniają klienta HTTP, więc sprawdzają
 * zachowanie komponentów wobec kontraktu *odtworzonego* z kodu serwera. Kształt
 * ładunków żądań i rygor predykatów odpowiedzi pozostają w nich założeniem —
 * rozjazd kontraktu ujawniłby się dopiero u użytkownika. Poniższe scenariusze
 * zamykają tę lukę: każdy przechodzi pełną drogę przez przeglądarkę, pośrednik
 * `/api` i backend do bazy danych.
 */

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8089';
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error(
    'Ustaw E2E_ADMIN_PASSWORD — konto administratora nie ma hasła domyślnego. ' +
    'Wartość musi odpowiadać LOYALTYCLUB_SEED_ADMIN_PASSWORD użytemu przy starcie backendu.',
  );
}

/** Numer uczestnika zakładanego na potrzeby przebiegu; losowy, by przebiegi nie kolidowały. */
const customerNumber = `E2E-${Date.now().toString(36).toUpperCase()}`;
const customerLastName = `Testowa${Date.now().toString(36).toUpperCase()}`;

/**
 * Uczestnik zakładany jest przez API, a nie przez interfejs.
 *
 * Przygotowanie stanu przez ten sam interfejs, który jest przedmiotem badania,
 * ukryłoby błąd: gdyby formularz wysyłał zły kształt, lista i tak pokazałaby to,
 * co sama zapisała. Dane wchodzą więc niezależną drogą, a przeglądarka jedynie
 * je odczytuje.
 */
test.beforeAll(async ({ request }) => {
  const login = await request.post(`${API_URL}/api/admin/auth/login`, {
    data: { username: ADMIN_USER, password: ADMIN_PASSWORD },
  });
  expect(login.ok(), 'logowanie administratora przez API').toBeTruthy();
  const { token } = await login.json();

  const created = await request.post(`${API_URL}/api/admin/customers`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      firstName: 'Anna',
      lastName: customerLastName,
      email: `${customerNumber.toLowerCase()}@example.invalid`,
      customerNumber,
      phoneNumber: '+48123456789',
      country: 'PL',
      loyaltyPoints: 0,
    },
  });
  expect(created.ok(), `założenie uczestnika ${customerNumber}`).toBeTruthy();
});

async function zaloguj(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Login').fill(ADMIN_USER!);
  await page.getByLabel('Hasło').fill(ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Zaloguj' }).click();
}

test('logowanie błędnymi poświadczeniami pokazuje komunikat i nie wpuszcza do panelu', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Login').fill(ADMIN_USER);
  await page.getByLabel('Hasło').fill('na-pewno-niepoprawne-haslo');
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  // Backend odpowiada 401; warstwa kliencka ma zamienić to na komunikat, a nie
  // na pustą stronę albo nieobsłużony wyjątek.
  await expect(page.getByText('Niepoprawny login lub hasło.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
});

test('logowanie poprawnymi poświadczeniami otwiera panel operatora', async ({ page }) => {
  await zaloguj(page);

  // Wejście do panelu dowodzi, że token wydany przez backend został przyjęty,
  // zapisany i użyty w kolejnym żądaniu.
  await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();
  await expect(page).toHaveURL(/\/customers$/);
});

test('kartoteka pokazuje uczestnika założonego przez API', async ({ page }) => {
  await zaloguj(page);
  await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();

  // Sekcja klientów otwiera się kafelkami; lista jest pod pierwszym z nich.
  await page.getByRole('button').filter({ hasText: 'Przeglądaj klientów' }).click();
  await page.getByPlaceholder('imię, nazwisko, e-mail, nr klienta...').fill(customerNumber);

  // Odczyt kartoteki przechodzi przez pełny kontrakt: nazwy pól odpowiedzi muszą
  // zgadzać się z modelem warstwy klienckiej, inaczej komórki byłyby puste.
  const wiersz = page.getByRole('row').filter({ hasText: customerNumber });
  await expect(wiersz).toBeVisible();
  await expect(wiersz).toContainText('Anna');
  await expect(wiersz).toContainText(customerLastName);
  await expect(wiersz).toContainText('PL');
});

test('wylogowanie zamyka sesję i wraca do ekranu logowania', async ({ page }) => {
  await zaloguj(page);
  await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible();

  await page.getByRole('button', { name: 'Wyloguj' }).click();

  await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();

  // Sesja ma zniknąć także z pamięci przeglądarki - samo przejście na ekran
  // logowania nie wystarcza, bo odświeżenie strony przywróciłoby panel.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
});
