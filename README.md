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

### A. W kontenerze (Docker)

Potrzebny jest wyłącznie Docker — bez Node'a i bez `node_modules`.

Najpierw musi działać warstwa serwerowa, bo to ona tworzy sieć
`loyaltyclub-net`, do której podpina się kontener SPA:

```bash
cd ../loyalytyClub-backend && ./scripts/stack.sh up
```

Potem SPA:

```bash
./scripts/stack.sh up          # Linux / macOS
.\scripts\stack.ps1 up          # Windows
```

Aplikacja jest dostępna pod **http://localhost:8080**. Skrypt czeka na stan
`healthy` kontenera i wykonuje test dymny: pobiera stronę główną oraz wysyła
żądanie na `/api/admin/auth/login`. Odpowiedź **401** oznacza, że żądanie
doszło do backendu (błędne dane logowania); **502** oznaczałoby, że nginx nie
dosięgnął kontenera backendu.

| Polecenie | Efekt |
|-----------|-------|
| `build` | Zbudowanie obrazu (nginx + statyki z `dist/`) |
| `test` | Bramka jakości w kontenerze: `lint`, `typecheck`, `test:coverage` |
| `up` | Zbudowanie i uruchomienie SPA, czekanie na `healthy`, test dymny |
| `down` | Zatrzymanie |
| `logs` / `ps` / `smoke` | Diagnostyka działającego wdrożenia |

### B. Serwer deweloperski

#### Wymagania
- Node.js 20+
- Uruchomiony backend LoyaltyClub (domyślnie `http://localhost:8089`)

#### Instalacja i dev server
```bash
npm ci
cp .env.example .env    # opcjonalnie — domyślne wartości wystarczą lokalnie
npm run dev
```
Vite startuje na porcie **5173** i przekierowuje żądania `/api` na backend.

#### Komendy

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

CI uruchamia je w kontenerze (cel `ci` w `Dockerfile`), a nie przez lokalny
Node — dzięki temu „przechodzi u mnie” i „przechodzi na CI” znaczą to samo.
Ten sam zestaw można odpalić lokalnie bez instalowania zależności:
`./scripts/stack.sh test`.

---

## Konfiguracja

Zmienne środowiskowe (wzorzec w `.env.example`):

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `VITE_API_BASE_URL` | *(puste)* | Bazowy adres backendu wbudowywany w build produkcyjny. Puste = ten sam origin co SPA (wariant z reverse proxy kierującym `/api` na backend). |
| `VITE_DEV_API_PROXY` | `http://localhost:8089` | Cel proxy `/api` dla serwera deweloperskiego Vite. |

Wdrożenie kontenerowe (czytane przez `docker-compose.yml`):

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `FRONTEND_HOST_PORT` | `8080` | Port SPA widoczny na hoście. |
| `BACKEND_ORIGIN` | `http://loyalty-backend:8089` | Adres backendu w sieci kontenerów, do którego nginx przekazuje `/api`. |
| `NGINX_RESOLVER` | `127.0.0.11` | Wbudowany DNS Dockera. |

`VITE_API_BASE_URL` zostaje puste także w obrazie: SPA odpytuje własny origin,
a przekazaniem `/api` dalej zajmuje się nginx w tym samym kontenerze.

---

## Wdrożenie

### Obraz kontenera

`Dockerfile` jest wieloetapowy; każdy etap to osobny cel budowania:

| Cel | Przeznaczenie |
|-----|---------------|
| `deps` | `npm ci`; osobna warstwa, więc zmiana kodu nie instaluje zależności od nowa |
| `ci` | `lint` + `typecheck` + `test:coverage` — bramka jakości |
| `ci-reports` | Wystawienie raportu pokrycia poza obraz (`--output`) |
| `build` | `npm run build` — statyki do `dist/` |
| `runtime` | `nginx:1.29-alpine` ze statykami i `HEALTHCHECK` na `/healthz` |

### Komunikacja z backendem

Przeglądarka nie widzi sieci kontenerów — widzi ją nginx. Stąd układ:

```
przeglądarka → localhost:8080 → [loyalty-frontend / nginx]
                                        │  /api/**
                                        ↓
                              [loyalty-backend :8089] → [db :5432]
                                   sieć loyaltyclub-net
```

Konfiguracja nginx powstaje z `docker/nginx.conf.template` — wejście obrazu
podmienia w nim `${BACKEND_ORIGIN}` przez `envsubst`. Adres backendu jest
podstawiany do `proxy_pass` przez **zmienną**, więc nazwa kontenera
rozwiązywana jest przy każdym żądaniu, a nie przy wczytywaniu konfiguracji —
inaczej nginx nie wstawałby, gdyby frontend uruchomił się przed backendem.

Ponieważ SPA i API leżą pod tym samym originem, `VITE_API_BASE_URL` zostaje
puste i CORS po stronie backendu jest zbędny.

### Bez Dockera

`npm run build` produkuje statyczne pliki w `dist/`. Serwuj je dowolnym serwerem
statycznym (nginx, Caddy, CDN) — bez dodatkowej konfiguracji przepisywania
adresów, bo aplikacja używa routingu opartego na fragmencie adresu
(`#/customers`, `#/coupons`). Każda trasa jest osobną porcją kodu, pobieraną
dopiero przy wejściu na nią.

Backend musi być osiągalny pod ścieżką `/api` z perspektywy przeglądarki — albo przez
reverse proxy na tym samym origin (wtedy `VITE_API_BASE_URL` zostaje puste), albo przez
podanie pełnego adresu w `VITE_API_BASE_URL` (wtedy backend musi zezwalać na CORS
dla origin frontendu).

### CI/CD

| Plik | Rola |
|------|------|
| `.github/workflows/ci.yml` | Bramka jakości i obraz: cel `ci-reports`, budowanie obrazu, test dymny kontenera, publikacja do GHCR z `master` |
| `jenkins/build.jenkinsfile` | Potok wdrożeniowy: bramka jakości, obraz ze znacznikiem numeru budowania, `docker compose up -d`, test dymny przejścia `/api` |

Wycofanie zmiany to powtórzenie etapu wdrożenia ze starszym znacznikiem:
`IMAGE_TAG=<numer budowania> docker compose up -d --no-build`.

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

Pliki wdrożeniowe w korzeniu repozytorium:

```
├── Dockerfile                      ← Wieloetapowy: deps/ci/build/runtime
├── .dockerignore
├── docker-compose.yml              ← SPA w sieci loyaltyclub-net
├── docker/nginx.conf.template      ← Statyki + przekazanie /api do backendu
├── scripts/
│   ├── stack.sh                    ← build / test / up / down / smoke
│   └── stack.ps1                   ← to samo, dla Windowsa
├── jenkins/build.jenkinsfile       ← Potok wdrożeniowy (Docker)
└── .github/workflows/ci.yml        ← Bramka jakości (GitHub Actions)
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
