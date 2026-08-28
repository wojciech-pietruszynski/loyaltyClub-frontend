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
| `npm run preview` | Podgląd builda produkcyjnego |
| `npm test` | Testy jednostkowe (Vitest) |
| `npm run lint` | ESLint |

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
statycznym (nginx, Caddy, CDN).

Backend musi być osiągalny pod ścieżką `/api` z perspektywy przeglądarki — albo przez
reverse proxy na tym samym origin (wtedy `VITE_API_BASE_URL` zostaje puste), albo przez
podanie pełnego adresu w `VITE_API_BASE_URL` (wtedy backend musi zezwalać na CORS
dla origin frontendu).

---

## Struktura projektu

```
src/
├── api/client.ts          ← Axios + storage sesji + interceptory JWT
├── components/            ← Komponenty prezentacyjne (PascalCase.tsx)
├── hooks/                 ← Logika biznesowa (useXxx.ts)
├── types/                 ← Typy domenowe i UI
├── i18n/                  ← Tłumaczenia PL / EN / DE
├── test/setup.ts          ← Globalne mocki (localStorage, matchMedia)
├── assets/                ← Obrazy, logo
├── App.tsx                ← Główny komponent, routing zakładkowy
└── App.css                ← Style globalne + zmienne CSS
```

Standardy kodowania obowiązujące w tym repozytorium: [`docs/frontend_rules.md`](docs/frontend_rules.md).

---

## Autoryzacja

Logowanie przez `POST /api/admin/auth/login`. Token JWT (ważność 15 minut) trzymany
w `localStorage` i automatycznie odświeżany, gdy pozostało mniej niż 60 sekund.
Role: `ADMIN` (pełny dostęp) oraz `TECHNICAL` (ograniczony do jednego kraju).
