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

**Komendy:**
```bash
npm run dev      # dev server (proxy → localhost:8089)
npm run build    # tsc -b && vite build
npm run test     # vitest run
npm run lint     # eslint .
```

---

## 2. Struktura katalogów

```
src/
├── api/
│   └── client.ts          ← konfiguracja axios, auth storage, interceptory
├── components/            ← komponenty prezentacyjne (PascalCase.tsx)
├── hooks/                 ← logika biznesowa (useXxx.ts)
├── types/
│   ├── index.ts           ← typy domenowe (Customer, Coupon, StorePromotion...)
│   └── ui.ts              ← typy UI (Tab, Theme, Translator, FormState...)
├── i18n/
│   ├── index.ts           ← funkcja translate()
│   ├── pl.ts              ← tłumaczenia PL (domyślny)
│   ├── en.ts              ← tłumaczenia EN
│   └── de.ts              ← tłumaczenia DE
├── test/
│   └── setup.ts           ← globalne mocki (localStorage, matchMedia)
├── assets/                ← obrazy, logo
├── App.tsx                ← główny komponent, routing tabowy, stan globalny
└── App.css                ← globalne style + CSS variables
```

---

## 3. Konwencje nazewnicze

| Element | Konwencja | Przykład |
|---------|-----------|---------|
| Pliki komponentów | `PascalCase.tsx` | `AddCustomerSection.tsx` |
| Pliki hooków | `camelCase.ts` z prefixem `use` | `useCustomers.ts` |
| Pliki typów | `camelCase.ts` | `index.ts`, `ui.ts` |
| Interfejsy/typy TS | `PascalCase` | `Customer`, `Tab`, `AuthRole` |
| Funkcje/zmienne | `camelCase` | `fetchCustomers`, `handleAddCustomer` |
| Stałe | `UPPER_SNAKE_CASE` | `REFRESH_THRESHOLD_MS`, `TOKEN_KEY` |
| Klasy CSS | `kebab-case` | `.modal-overlay`, `.btn-primary` |
| Handlery zdarzeń | prefix `handle` | `handleLogin`, `handleAddCustomer` |
| Settery stanu | prefix `set` | `setNewCustomer`, `setActiveTab` |

---

## 4. Komponenty

**Zasady:**
- Tylko **funkcyjne komponenty** — żadnych klas
- Props zawsze jawnie typowane interfejsem lub typem:
  ```tsx
  type MyComponentProps = {
    t: Translator;
    items: Customer[];
    onSelect: (id: number) => void;
  };

  export function MyComponent({ t, items, onSelect }: MyComponentProps) {
    return (...);
  }
  ```
- Eksport: **named export** (nie default export)
- Komponenty są **prezentacyjne** — nie wywołują API bezpośrednio, dostają dane i handlery jako props
- Logikę biznesową i stan: przesuwaj do hooków (`useCustomers`, `useCoupons` itp.)
- Nie przekazuj całego stanu aplikacji do komponentów — tylko to, czego potrzebuje dany komponent

---

## 5. Hooki (hooks)

**Struktura hooka:**
```ts
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Customer[]>('/customers');
      setCustomers(data);
      setError(null);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Failed to fetch customers'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { customers, loading, error, fetchCustomers };
}
```

**Zasady:**
- Każdy hook zwraca **obiekt** z polami (nie tablicę, chyba że to `useState`)
- Trójka stanów dla operacji async: `loading`, `error`, `data`
- `useCallback` dla funkcji przekazywanych do komponentów lub używanych w `useEffect`
- Nie używaj zewnętrznego store (Redux, Zustand) — stan zarządzany hookami i `useState` w App
- `useEffect` z prawidłową tablicą zależności

---

## 6. Komunikacja z API (`src/api/client.ts`)

**Dwie instancje axios:**
```ts
const authApi = axios.create({ baseURL: '/api/admin/auth' });  // login, refresh
const api = axios.create({ baseURL: '/api/admin' });           // wszystkie pozostałe
```

**Interceptory:**
- **Request**: dołącza `Authorization: Bearer {token}` + wywołuje `ensureFreshSession()`
- **Response**: przy 401 wywołuje `logout()` i odświeża stronę

**Zasady:**
- Prefiks bazowy pochodzi z `VITE_API_BASE_URL` (domyślnie puste = ten sam origin)
- W devie ścieżki `/api` idą przez proxy Vite (`VITE_DEV_API_PROXY`, domyślnie `http://localhost:8089`)
- Nie hardkoduj `http://localhost:...` w kodzie — adres backendu wyłącznie przez zmienne env
- Błędy API wyciągaj przez `extractApiError(err, fallback)`:
  ```ts
  function extractApiError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const apiErr = err as { response?: { data?: { detail?: string } }; message?: string };
      return apiErr.response?.data?.detail || fallback;
    }
    return fallback;
  }
  ```
- Pole błędu z backendu: `response.data.detail` (format RFC 7807 ProblemDetail)

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

- Brak zewnętrznego routera (React Router nie jest używany)
- Nawigacja przez stan `activeTab: Tab` w `App.tsx`
- Zakładki renderowane przez komponent `<Tabs>` z Ant Design
- Typ zakładek:
  ```ts
  export type Tab =
    | 'customers' | 'add-points' | 'coupons' | 'add-customer'
    | 'store-promotions' | 'tools' | 'technical-accounts';
  ```
- Nowe funkcje = nowa wartość w unii `Tab`

---

## 9. Typowanie TypeScript

**Konfiguracja:** `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`

**Zasady:**
- Nigdy nie używaj `any` — preferuj `unknown` z type guard lub konkretny typ
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
- Wszystkie teksty widoczne dla użytkownika przez `t(key)` — **bez** hardkodowanych stringów UI
- Nowe teksty: dodaj klucz do `TranslationKey`, następnie do `pl.ts`, `en.ts`, `de.ts`
- Język przechowywany w `localStorage` klucz `app_language`
- Parametry w tłumaczeniach: `{{paramName}}` w stringu

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
- Sukcesy: `<Alert type="success">` z `setTimeout` 3000ms
- Pole błędu: zawsze `err.response?.data?.detail` (ProblemDetail z backendu)
- Fallback błędu: czytelny tekst w języku angielskim jako drugi argument `extractApiError`

---

## 13. Testy

**Framework:** Vitest + @testing-library/react

**Konwencja nazw plików:** `ComponentName.test.tsx`, `useHookName.test.ts`

**Szablon testu komponentu:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('MyComponent', () => {
  const mockProps = {
    t: (key: string) => key,
    items: [],
    onSelect: vi.fn(),
  };

  it('renders correctly', () => {
    render(<MyComponent {...mockProps} />);
    expect(screen.getByText('someKey')).toBeInTheDocument();
  });

  it('calls handler on click', () => {
    render(<MyComponent {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockProps.onSelect).toHaveBeenCalled();
  });
});
```

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
- Nie testuj implementacji — testuj zachowanie z perspektywy użytkownika
- Wykluczone z pokrycia: `src/main.tsx`, `src/api/client.ts`
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
- Pliki wynikowe: `dist/` — serwowane osobno (nginx / CDN), backend ich już nie pakuje
- Nowe zmienne env: prefiks `VITE_`, deklaracja typu w `src/vite-env.d.ts`, wpis w `.env.example`
