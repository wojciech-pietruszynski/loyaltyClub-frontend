# LoyaltyClub — Frontend

Panel administracyjny programu lojalnościowego **LoyaltyClub** — React 19 + TypeScript + Vite.
Aplikacja SPA konsumująca REST API backendu (Spring Boot), które żyje w osobnym repozytorium:
[`loyalytyClub`](https://github.com/wojciech-pietruszynski/loyalytyClub).

---

## Stos technologiczny

| Technologia | Wersja | Rola |
|-------------|--------|------|
| React | 19.2 | Framework UI |
| TypeScript | 5.9 (strict) | Typowanie statyczne |
| Vite | 7.3 | Build tool / serwer deweloperski |
| Ant Design | 5.27 | Biblioteka komponentów |
| Axios | 1.13 | Klient HTTP |
| Vitest | 3.2 | Testy jednostkowe |
| @testing-library/react | 16.3 | Testy komponentów |
| lucide-react | — | Ikony |
| React Router | 7.x | Routing (HashRouter) |
| dayjs | 1.x | Daty w komponentach Ant Design |

---

## Uruchomienie

### Wymagania
- Node.js 20+
- Uruchomiony backend LoyaltyClub (domyślnie `http://localhost:8089`)

### Instalacja i dev server
```bash
npm ci
cp .env.example .env    # opcjonalnie — domyślne wartości wystarczą lokalnie
npm run dev
```
Vite startuje na porcie **5173** i przekierowuje żądania `/api` na backend.

### Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev` | Serwer deweloperski z HMR |
| `npm run build` | `tsc -b && vite build` → katalog `dist/` |
| `npm run typecheck` | Kontrola typów bez emisji plików |
| `npm run preview` | Podgląd builda produkcyjnego |
| `npm test` | Testy jednostkowe (Vitest) |
| `npm run test:coverage` | Testy z raportem pokrycia |
| `npm run lint` | ESLint |

Te same cztery kroki — `lint`, `typecheck`, `test:coverage`, `build` — stanowią
bramkę jakości w potoku CI (`.github/workflows/ci.yml`). Zmiana z czerwonym
analizatorem statycznym nie wejdzie na gałąź główną.

---

## Konfiguracja

Zmienne środowiskowe (wzorzec w `.env.example`):

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `VITE_API_BASE_URL` | *(puste)* | Bazowy adres backendu wbudowywany w build produkcyjny. Puste = ten sam origin co SPA (wariant z reverse proxy kierującym `/api` na backend). |
| `VITE_DEV_API_PROXY` | `http://localhost:8089` | Cel proxy `/api` dla serwera deweloperskiego Vite. |

---

## Wdrożenie

`npm run build` produkuje statyczne pliki w `dist/`. Serwuj je dowolnym serwerem
statycznym (nginx, Caddy, CDN) — bez dodatkowej konfiguracji przepisywania
adresów, bo aplikacja używa routingu opartego na fragmencie adresu
(`#/customers`, `#/coupons`). Każda trasa jest osobną porcją kodu, pobieraną
dopiero przy wejściu na nią.

Backend musi być osiągalny pod ścieżką `/api` z perspektywy przeglądarki — albo przez
reverse proxy na tym samym origin (wtedy `VITE_API_BASE_URL` zostaje puste), albo przez
podanie pełnego adresu w `VITE_API_BASE_URL` (wtedy backend musi zezwalać na CORS
dla origin frontendu).

---

## Struktura projektu

```
src/
├── api/
│   ├── client.ts          ← Axios + storage sesji + interceptory JWT
│   ├── errors.ts          ← Odczyt komunikatu z ProblemDetail
│   └── schema.ts          ← Walidacja kształtu odpowiedzi w czasie działania
├── components/            ← Komponenty prezentacyjne (PascalCase.tsx)
├── context/               ← Kontekst aplikacji: i18n, sesja, hooki dziedzinowe
├── hooks/                 ← Logika biznesowa (useXxx.ts)
├── lib/                   ← Konwersja liczb i walidacja formularzy
├── types/                 ← Typy domenowe i UI
├── i18n/                  ← Tłumaczenia PL / EN / DE + formatowanie Intl
├── test/                  ← Mocki, dane testowe, harness renderujący
├── assets/                ← Obrazy, logo
├── routes.ts              ← Trasy i ich dostępność według roli
├── App.tsx                ← Ustawienia interfejsu, sesja, dostawca kontekstu
└── App.css                ← Style globalne + zmienne CSS
```

Standardy kodowania obowiązujące w tym repozytorium: [`docs/frontend_rules.md`](docs/frontend_rules.md).

---

## Autoryzacja

Logowanie przez `POST /api/admin/auth/login`. Token JWT (ważność 15 minut) trzymany
w `localStorage` i automatycznie odświeżany, gdy pozostało mniej niż 60 sekund.
Role: `ADMIN` (pełny dostęp) oraz `TECHNICAL` (ograniczony do jednego kraju).

Rola i kod kraju z sesji sterują widocznością zakładek i zawężają pola wyboru
kraju w formularzach. Jest to **wyłącznie wygoda interfejsu, nie granica
bezpieczeństwa** — token i rola są dostępne dla dowolnego skryptu na stronie,
a jedyną realną kontrolą dostępu pozostaje backend. Domknięcie tego (ciasteczko
niedostępne dla skryptów + ochrona przed CSRF) wymaga zmian po stronie API.

---

## Rejestr poprawek

Zmiany wprowadzone względem rewizji `aab1856` w odpowiedzi na rejestr braków
funkcjonalnych: [`fixes_frontend.md`](fixes_frontend.md).
