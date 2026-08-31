# Frontend Rules – Loyalty Club

## 1. Stack technologiczny

| Technologia | Wersja | Rola |
|-------------|--------|------|
| React | 19 | Framework UI |
| TypeScript | strict | Typowanie |
| Vite | 7 | Build tool / Dev server |
| Ant Design | 5 | Biblioteka komponentów |
| Axios | 1.x | Klient HTTP |
| Vitest | 3 | Testy jednostkowe |
| @testing-library/react | 16 | Testy komponentów |
| lucide-react | – | Ikony |
| react-router-dom | 7 | Routing (HashRouter) |
| dayjs | 1.x | Daty w komponentach Ant Design |

**Komendy:**
```bash
npm run dev            # dev server (proxy → localhost:8089)
npm run build          # tsc -b && vite build
npm run typecheck      # tsc -b --noEmit
npm run test           # vitest run
npm run test:coverage  # vitest run --coverage
npm run lint           # eslint .
```

Wszystkie cztery — `lint`, `typecheck`, `test:coverage`, `build` — są bramką
jakości w potoku CI (`.github/workflows/ci.yml`) i muszą przechodzić.

---

## 2. Struktura katalogów

```
src/
├── api/
│   ├── client.ts          ← konfiguracja axios, auth storage, interceptory
│   ├── errors.ts          ← extractApiError() — jedno miejsce odczytu ProblemDetail
│   └── schema.ts          ← walidacja kształtu odpowiedzi w czasie działania
├── components/            ← komponenty prezentacyjne (PascalCase.tsx)
├── context/
│   ├── appContext.ts      ← typ kontekstu + useAppContext()
│   └── AppProvider.tsx    ← dostawca: i18n, sesja, konfiguracja, hooki dziedzinowe
├── hooks/                 ← logika biznesowa (useXxx.ts)
├── lib/
│   ├── numbers.ts         ← konwersja pól liczbowych na granicy wysyłki
│   └── validation.ts      ← walidacja formularzy po stronie klienta
├── types/
│   ├── index.ts           ← typy domenowe (Customer, Coupon, StorePromotion...)
│   └── ui.ts              ← typy UI (Tab, Theme, Translator, FormState...)
├── i18n/
│   ├── index.ts           ← translate() i translatePlural()
│   ├── format.ts          ← Intl: daty, liczby, waluty, liczba mnoga
│   ├── pl.ts              ← tłumaczenia PL (domyślny)
│   ├── en.ts              ← tłumaczenia EN
│   └── de.ts              ← tłumaczenia DE
├── test/
│   ├── setup.ts           ← globalne mocki (localStorage, matchMedia)
│   ├── fixtures.ts        ← dane testowe zgodne z kontraktem backendu
│   └── harness.tsx        ← renderWithApp() — render w kontekście aplikacji
├── assets/                ← obrazy, logo
├── routes.ts              ← definicje tras i ich dostępność wg roli
├── App.tsx                ← złożenie: ustawienia UI, sesja, dostawca, powłoka
└── App.css                ← globalne style + CSS variables
```

---

## 3. Konwencje nazewnicze

| Element | Konwencja | Przykład |
|---------|-----------|---------|
| Pliki komponentów | `PascalCase.tsx` | `CustomersSection.tsx` |
| Pliki hooków | `camelCase.ts` z prefixem `use` | `useCustomers.ts` |
| Pliki typów | `camelCase.ts` | `index.ts`, `ui.ts` |
| Interfejsy/typy TS | `PascalCase` | `Customer`, `Tab`, `AuthRole` |
| Funkcje/zmienne | `camelCase` | `fetchCustomers`, `handleAddCustomer` |
| Stałe | `UPPER_SNAKE_CASE` | `REFRESH_THRESHOLD_MS`, `TOKEN_KEY` |
| Klasy CSS | `kebab-case` | `.modal-overlay`, `.btn-primary` |
| Handlery zdarzeń | prefix `handle` | `handleLogin`, `handleAddCustomer` |
| Settery stanu | prefix `set` | `setNewCustomer`, `setView` |

---

## 4. Komponenty

**Zasady:**
- Tylko **funkcyjne komponenty** — jedyny wyjątek to `ErrorBoundary`,
  bo React nie ma odpowiednika `componentDidCatch` w komponencie funkcyjnym
- Props zawsze jawnie typowane interfejsem lub typem:
  ```tsx
  type MyComponentProps = {
    customer: Customer;
    onSelect: (id: number) => void;
  };

  export function MyComponent({ customer, onSelect }: MyComponentProps) {
    const { t, format } = useAppContext();
    return (...);
  }
  ```
- Eksport: **named export** (nie default export)
- Komponenty są **prezentacyjne** — nigdy nie importują klienta HTTP; dostęp do sieci
  wyłącznie przez hooki dziedzinowe
- Logikę biznesową i stan serwera: przesuwaj do hooków (`useCustomers`, `useCoupons` itp.)
- Rzeczy przekrojowe (`t`, formatowanie, sesja, lista krajów, powiadomienia, hooki
  dziedzinowe) bierz z **kontekstu** przez `useAppContext()`, nie z właściwości
- Stan formularza trzyma komponent, który go renderuje — nie orkiestrator
- Właściwości zostają dla tego, co jest specyficzne dla wywołania (np. `customer`, `onClose`)
- Modale buduj na `ModalShell` — dokłada wymagania WCAG (fokus, Escape, powrót fokusu)
- Błędy walidacji renderuj przez `FieldMessage`

---

## 5. Hooki (hooks)

**Struktura hooka:**
```ts
export function useCustomers(t: Translator): CustomersApi {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toMessage = useApiErrorMessage(t);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<unknown>('/customers');
      setCustomers(parseList('/customers', data, isCustomer));
      setError(null);
    } catch (err: unknown) {
      setError(toMessage(err, 'fetchCustomersError'));
    } finally {
      setLoading(false);
    }
  }, [toMessage]);

  // Pobranie odroczone — sekcja woła je przy wejściu na trasę, wykonuje się raz.
  const ensureCustomers = useEnsure(fetchCustomers);

  return { customers, loading, error, fetchCustomers, ensureCustomers };
}
```

**Zasady:**
- Każdy hook zwraca **obiekt** z polami (nie tablicę, chyba że to `useState`)
- Każdy hook ma jawnie wyeksportowany typ zwracany (`CustomersApi`, `CouponsApi`, ...)
- Hook przyjmuje `t: Translator` i zamienia wyjątki na komunikaty przez
  `useApiErrorMessage(t)` — nigdy nie wpisuj stałego tekstu komunikatu
- Trójka stanów dla operacji async: `loading`, `error`, `data`
- Odpowiedzi przepuszczaj przez `parseList` / `parseObject` z `api/schema.ts`
- Pola liczbowe formularzy konwertuj przy wysyłce (`lib/numbers.ts`)
- Zmiana samej flagi (włącz/wyłącz) = aktualizacja optymistyczna z wycofaniem,
  bez ponownego pobierania całej kolekcji
- Do każdego pobrania kolekcji dorzuć wariant `ensure...` (`useEnsure`) — sekcje
  wołają go przy wejściu na trasę, dane pobierają się raz
- Nie używaj zewnętrznego store (Redux, Zustand) — stan współdzielony idzie przez kontekst
- `useEffect` z prawidłową tablicą zależności; **bez** `setState` w ciele efektu

---

## 6. Komunikacja z API (`src/api/client.ts`)

**Dwie instancje axios:**
```ts
const authApi = axios.create({ baseURL: '/api/admin/auth' });  // login, refresh
const api = axios.create({ baseURL: '/api/admin' });           // wszystkie pozostałe
```

**Interceptory:**
- **Request**: dołącza `Authorization: Bearer {token}` + wywołuje `ensureFreshSession()`
- **Response**: przy 401 wywołuje `logout()` i przekazuje błąd dalej
  (bez przeładowania strony — widok logowania pokazuje `App` po zmianie stanu sesji)

**Zasady:**
- Prefiks bazowy pochodzi z `VITE_API_BASE_URL` (domyślnie puste = ten sam origin)
- W devie ścieżki `/api` idą przez proxy Vite (`VITE_DEV_API_PROXY`, domyślnie `http://localhost:8089`)
- Nie hardkoduj `http://localhost:...` w kodzie — adres backendu wyłącznie przez zmienne env
- Błędy API wyciągaj **wyłącznie** przez `extractApiError(err, fallback)` z
  `src/api/errors.ts` — nie powielaj wyrażenia `err.response?.data?.detail`
  w hookach. W hookach używaj opakowania `useApiErrorMessage(t)`, które
  jako tekst zapasowy bierze klucz słownika:
  ```ts
  const toMessage = useApiErrorMessage(t);
  setError(toMessage(err, 'fetchCustomersError'));
  ```
- Pole błędu z backendu: `response.data.detail` (format RFC 7807 ProblemDetail);
  kolejność zapasowa: `detail` → `title` → `error` → `message` → tekst z klucza
- Kształt odpowiedzi sprawdzaj w `src/api/schema.ts`. Parametr generyczny
  (`api.get<Customer[]>`) jest kontraktem tylko kompilacyjnym i znika po
  transpilacji, więc każda odpowiedź przechodzi przez predykat:
  ```ts
  const { data } = await api.get<unknown>('/customers');
  setCustomers(parseList('/customers', data, isCustomer));
  ```
  Niezgodny kształt daje `ResponseShapeError`, tłumaczony na `invalidServerResponse`.

---

## 7. Autentykacja i JWT

**Storage:** `localStorage` z kluczami:
```
auth_token       ← Bearer token
auth_expires_at  ← epoch miliseconds
auth_role        ← 'ADMIN' | 'TECHNICAL'
auth_country     ← kod kraju lub null
```

**Zasady:**
- Token odświeżany automatycznie gdy pozostało < 60 sekund (`REFRESH_THRESHOLD_MS = 60_000`)
- Jedna instancja `refreshPromise` zapobiega równoległym wywołaniom refresh
- Timer w `useAuth` sprawdza wygaśnięcie co 1 sekundę — **bez** `setState` w każdej iteracji (tylko logout)
- 401 z API = natychmiastowy `logout()` przez interceptor
- Dostępność zakładek zależy od `authRole`:
  - `ADMIN`: wszystkie zakładki + zarządzanie kontami technicznymi
  - `TECHNICAL`: ograniczone do scopu kraju, bez zakładki add-points i technical-accounts

---

## 8. Routing i nawigacja

- **React Router 7**, wariant `HashRouter` (`src/main.tsx`). Hash, nie ścieżka:
  `dist/` jest serwowane jako statyczne pliki, więc odświeżenie adresu `/coupons`
  bez przepisywania żądań na `index.html` kończyłoby się błędem 404
- Adres jest źródłem prawdy o aktywnym widoku: `#/customers`, `#/coupons`, ...
  Odnośnik do widoku da się wysłać, cofanie działa, odświeżenie nie gubi widoku
- Definicje tras i ich dostępność wg roli: `src/routes.ts`
- Nawigacja: `<NavLink>` w `AppShell` (klasa `.sidebar-nav-btn`, stan `.active`
  z `isActive`) — **nie** komponent `<Tabs>` z Ant Design
- Każda sekcja jest ładowana leniwie (`React.lazy`), więc trasa = osobna porcja kodu
- Typ zakładek:
  ```ts
  export type Tab = 'customers' | 'add-points' | 'coupons' | 'promotions' | 'reports' | 'tools';
  ```
- Nowa funkcja = nowa wartość w unii `Tab` + wpis w `ROUTES` + wpis
  w `SECTION_BY_TAB` i `ICON_BY_TAB` w `AppShell.tsx`

---

## 9. Typowanie TypeScript

**Konfiguracja:** `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`

**Zasady:**
- Nigdy nie używaj `any` — preferuj `unknown` z type guard lub konkretny typ.
  Reguła jest egzekwowana: `npm run lint` musi kończyć się bez błędów, a CI
  blokuje zmianę, która ją łamie. Dotyczy również plików testowych
- Wszystkie props, state, return types hooków — jawnie typowane
- Typy domenowe w `src/types/index.ts`
- Typy UI/formularzy w `src/types/ui.ts`
- Enumeracje jako string union type:
  ```ts
  type CouponStatus = 'ACTIVE' | 'USED' | 'EXPIRED';
  type AuthRole = 'ADMIN' | 'TECHNICAL';
  ```
- Typ `Translator`:
  ```ts
  export type Translator = (key: TranslationKey, params?: Record<string, string | number>) => string;
  ```
  Zawsze przekazuj `t: Translator` do komponentów zamiast bezpośrednio importować funkcję tłumaczącą

---

## 10. Stylowanie

**Podejście:** Vanilla CSS z CSS Custom Properties — **bez** Tailwind, **bez** styled-components, **bez** CSS Modules

**Zmienne CSS (motyw jasny/ciemny):**
```css
:root {
  --primary: #6366f1;
  --bg: #f8fafc;
  --card-bg: #ffffff;
  --text: #1e293b;
  --text-light: #64748b;
  --border: #e2e8f0;
  --success: #22c55e;
  --error: #ef4444;
}

[data-theme='dark'] {
  --primary: #818cf8;
  --bg: #0b1220;
  --card-bg: #141c2f;
  --text: #e5e7eb;
}
```

**Zasady:**
- Motyw przechowywany w `localStorage` klucz `app_theme`
- Przełączanie motywu: `document.documentElement.setAttribute('data-theme', theme)`
- Ant Design konfigurowany przez `<ConfigProvider theme={{ algorithm: darkAlgorithm | defaultAlgorithm }}>` z `colorPrimary: '#6366f1'`
- Klasy CSS: `kebab-case`
- Responsywność: media queries w `App.css` (breakpoint: 860px)
- Nowe komponenty używają istniejących klas (`.card`, `.btn-primary`, `.form-group`) zanim dodasz nowe

---

## 11. Internacjonalizacja (i18n)

**Obsługiwane języki:** `pl` (domyślny), `en`, `de`

**Użycie:**
```ts
const t = (key: TranslationKey, params?) => translate(language, key, params);
// Przykład z parametrami:
t('pointsAdded', { count: 100 })  // "Dodano 100 punktów"
```

**Zasady:**
- Wszystkie teksty widoczne dla użytkownika przez `t(key)` — **bez** hardkodowanych
  stringów UI, również w komunikatach błędów hooków
- Nowe teksty: dodaj klucz do `pl.ts` (źródło typu `TranslationKey`), potem do `en.ts` i `de.ts`
- Język przechowywany w `localStorage` klucz `app_language`; atrybut `lang`
  dokumentu jest ustawiany razem z wyborem języka
- Parametry w tłumaczeniach: `{{paramName}}` w stringu
- **Liczba mnoga**: klucze z sufiksami `_one` / `_few` / `_many` / `_other`
  i `tPlural(key, count)`. Polski wymaga formy trójstopniowej, więc samo
  `{{count}}` w jednym łańcuchu nie wystarcza — kategorię wybiera `Intl.PluralRules`
- **Daty, liczby, waluty**: wyłącznie przez `format` z kontekstu
  (`formatDate`, `formatDateTime`, `formatNumber`, `formatCurrency`).
  Nigdy `toLocaleString()` bez lokalizacji — postać zależałaby od ustawień
  przeglądarki, a nie od języka wybranego w aplikacji
- Odwzorowanie języka na lokalizację: `localeByLanguage` w `types/ui.ts`;
  waluty krajów: `currencyByCountry` w `i18n/format.ts`

---

## 12. Obsługa błędów i powiadomienia

**Wzorzec:**
```tsx
// Stan błędu
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

// Wyświetlanie
{error && <Alert type="error" showIcon message={error} />}
{success && <Alert type="success" showIcon message={success} />}

// Success z auto-zniknięciem po 3 sekundach
setSuccess(t('operationSuccess'));
setTimeout(() => setSuccess(null), 3_000);
```

**Zasady:**
- Błędy: Ant Design `<Alert type="error">` — nigdy `alert()` przeglądarki
- Powiadomienia globalne: `notifySuccess(...)` / `notifyError(...)` z kontekstu;
  znikają samoczynnie po 3 sekundach (`AppProvider` pilnuje licznika)
- Pole błędu: zawsze `extractApiError` (ProblemDetail z backendu)
- Tekst zapasowy: **klucz słownika**, nie stały łańcuch po angielsku
- Wyjątek renderowania przechwytuje `ErrorBoundary` nad powłoką i nad widokiem
  logowania — użytkownik dostaje komunikat, nie biały ekran
- Walidacja formularzy: reguły z `lib/validation.ts` wołane w handlerze `submit`,
  komunikat pod polem przez `FieldMessage`. Atrybuty HTML (`required`,
  `type="email"`) to za mało — nie znają reguł biznesowych

---

## 13. Testy

**Framework:** Vitest + @testing-library/react

**Konwencja nazw plików:** `ComponentName.test.tsx`, `useHookName.test.ts`

**Szablon testu komponentu:**
```tsx
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithApp } from '../test/harness';
import { makeCustomer } from '../test/fixtures';

describe('MyComponent', () => {
  it('renders the list from the context', () => {
    renderWithApp(<MyComponent />, { customers: { customers: [makeCustomer()] } });
    expect(screen.getByText('someKey')).toBeInTheDocument();
  });

  it('calls the hook action', () => {
    const { context } = renderWithApp(<MyComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(context.data.customers.addCustomer).toHaveBeenCalled();
  });
});
```

`renderWithApp` renderuje komponent w `MemoryRouter` i w kontekście aplikacji;
`t` zwraca sam klucz, a `tPlural` klucz z liczbą (`customersFound:3`), więc testy
sprawdzają, *który* komunikat trafia na ekran, nie jego brzmienie w danym języku.

**Szablon testu hooka:**
```ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../api/client', () => ({
  login: vi.fn(),
  isAuthenticated: vi.fn().mockReturnValue(false),
}));

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.loading).toBe(false);
  });
});
```

**Zasady:**
- Mocki w `src/test/setup.ts`: `localStorage`, `matchMedia` (wymagane przez Ant Design)
- Mockuj `src/api/client.ts` w testach hooków używając `vi.mock`
- Atrapy odpowiedzi buduj z `src/test/fixtures.ts` — odpowiedzi są sprawdzane
  w czasie działania, więc atrapa `{ id: 1 }` udaje kontrakt, którego backend
  nigdy nie zwraca, i test przestaje cokolwiek znaczyć
- Testy hooków wołają je z translatorem: `renderHook(() => useCustomers(t))`
- Nie testuj implementacji — testuj zachowanie z perspektywy użytkownika
- Wykluczone z pokrycia: `src/main.tsx`, `src/api/client.ts`, `src/test/**`,
  `src/types/**`, słowniki `src/i18n/{pl,en,de}.ts`
- `beforeEach(() => vi.clearAllMocks())` w każdym suite

---

## 14. Konfiguracja Vite

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': process.env.VITE_DEV_API_PROXY || 'http://localhost:8089' }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

**Zasady:**
- Domyślny port backendu: `8089` (konfiguracja Spring Boot `server.port`)
- Build produkcyjny: `tsc -b && vite build` — TypeScript sprawdzany przed bundlem
- Pliki wynikowe: `dist/` — serwowane osobno (nginx / CDN), backend ich już nie pakuje.
  Dzięki `React.lazy` każda trasa dostaje własną porcję kodu
- Nowe zmienne env: prefiks `VITE_`, deklaracja typu w `src/vite-env.d.ts`, wpis w `.env.example`
- `dist/` i `coverage/` są pomijane przez ESLint (`globalIgnores`) — wcześniej
  analizator zgłaszał ostrzeżenia z wygenerowanych plików raportu pokrycia

---

## 15. Bramka jakości (CI)

`.github/workflows/ci.yml` uruchamia na każdym pushu i pull requeście do `master`:

1. `npm ci`
2. `npm run lint` — zero błędów i zero ostrzeżeń
3. `npm run typecheck`
4. `npm run test:coverage` — raport trafia do artefaktów przebiegu
5. `npm run build`

Żaden z kroków nie jest opcjonalny. Zmiana z czerwonym analizatorem nie wejdzie
na gałąź główną — wcześniej budowanie i testy przechodziły niezależnie od tego,
czy `npm run lint` się powiódł.
