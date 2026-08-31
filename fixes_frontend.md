# Poprawki frontendu — realizacja rejestru braków `impl-loss/frontend.md`

**Gałąź:** `fix/frontend-impl-loss`
**Punkt wyjścia:** `aab1856` (28 sierpnia 2026)
**Data prac:** 30–31 sierpnia 2026
**Źródło zadań:** `praca/impl-loss/frontend.md` — 19 pozycji kategorii **A**
oraz 3 pozycje kategorii **C**.

---

## Podsumowanie

| Miara | Przed | Po |
|---|---|---|
| Błędy analizatora statycznego (`npm run lint`) | 49 błędów, 3 ostrzeżenia | 0 |
| Kontrola typów (`npm run typecheck`) | przechodzi | przechodzi |
| Testy | 64 w 17 plikach | **165 w 27 plikach** |
| Pokrycie (instrukcje) | nie raportowane | **80,7 %** |
| Wiersze `App.tsx` | 575 | **118** |
| Stany `useState` w `App.tsx` | 34 | **3** |
| Największa liczba właściwości komponentu | 22 (`ToolsSection`, `CustomerDetailsModal`) | **7** (`ModalShell`); sekcje trasy: **0** |
| Żądania HTTP zaraz po zalogowaniu | 6 (dla `ADMIN` 7) | **2** |
| Porcje kodu ładowane wraz z trasą | brak podziału | **7 porcji** |
| Martwe komponenty | 2 (z własnymi testami) | 0 |
| Bramka jakości w CI | brak | `.github/workflows/ci.yml` |

Zrealizowano **18 z 19** pozycji kategorii A oraz **2 z 3** pozycji kategorii C.
Dwie pozycje pozostawiono świadomie — uzasadnienie w sekcji
[„Czego nie zrobiono”](#czego-nie-zrobiono).

---

## A. Braki przyznane wprost w tekście pracy

### ✅ F1. Filtrowanie kuponów nie działa

**Było:** orkiestrator przekazywał do sekcji kuponów `filteredCoupons={couponApi.coupons}`
(całą kolekcję, z komentarzem `// Simplified filtering for now`) oraz
`couponSortValues={[]}` (z komentarzem `// TODO: populate if needed`). Trzy kontrolki
— wyszukiwanie po kodzie, wybór pola i wybór wartości — były w pełni podłączone do
stanu, ale stan nie wpływał na nic.

**Jest:** filtrowanie liczone w `CouponsSection` (`src/components/CouponsSection.tsx`):

- lista wartości drugiego pola powstaje z rzeczywistych danych
  (`filterValuesFor` — unikalne wartości wybranego pola, posortowane),
- `filteredCoupons` zawęża listę po kodzie (bez rozróżniania wielkości liter)
  i po wybranej wartości,
- nad tabelą pojawia się licznik wyników (`3 kupony`) i przycisk
  **Wyczyść filtry**, widoczny tylko gdy jakiś filtr jest ustawiony.

Etykieta pola zmieniona z „Sortuj po” na „Filtruj po” — kontrolka filtruje, nie sortuje.

**Testy:** `CouponsSection.test.tsx` — zawężanie po wartości filtra, zawężanie po
kodzie, komunikat o pustym wyniku, przywrócenie pełnej listy po wyczyszczeniu.

---

### ✅ F2. Brak routingu

**Było:** nawigację realizował stan `activeTab` w `App.tsx`.

**Jest:** **React Router 7** w wariancie `HashRouter` (`src/main.tsx`), definicje
tras w `src/routes.ts`, powłoka aplikacji w `src/components/AppShell.tsx`.

Wszystkie cztery skutki wymienione w pracy są usunięte:

| Skutek z pracy | Stan po zmianie |
|---|---|
| brak odnośnika do konkretnego widoku | `#/coupons`, `#/reports`, … — adres da się wysłać |
| niedziałający przycisk cofania | historia przeglądarki działa |
| powrót do widoku domyślnego po odświeżeniu | adres jest źródłem prawdy o widoku |
| brak podziału kodu na porcje | `React.lazy` na każdą trasę |

**Decyzja — `HashRouter`, nie `BrowserRouter`:** `dist/` jest serwowane jako
statyczne pliki (nginx / CDN, tak mówi README). Przy `BrowserRouter` odświeżenie
adresu `/coupons` zwracałoby 404, dopóki serwer nie przepisze wszystkich ścieżek
na `index.html`. Wariant z fragmentem adresu działa na dowolnym serwerze
statycznym bez konfiguracji i nie wprowadza zależności między frontendem
a ustawieniami wdrożenia. Powód zapisany w komentarzu w `main.tsx`.

Dostępność tras według roli przeniesiona do `routes.ts` (`routesForRole`,
`isRouteAllowed`) — wcześniej były to trzy `tabs.splice(...)` w `useMemo`.

**Testy:** `routes.test.ts` — unikalność adresów, komplet zakładek dla `ADMIN`,
ukrycie „Dodaj punkty” przed kontem technicznym.

---

### ✅ F3. Kod kraju w sesji nie jest wykorzystywany

**Było:** `auth_country` zapisywany przy logowaniu, udostępniany przez `useAuth`,
nieużywany przez żaden komponent — martwy kod w mechanizmie sesji.

**Jest:** kod kraju jest wykorzystywany w dwóch miejscach:

1. **Nagłówek** (`AppHeader`) pokazuje zakres pracy: kod kraju albo
   „wszystkie kraje” dla administratora.
2. **`CountrySelect`** (nowy komponent) — konto techniczne działa w jednym kraju,
   więc pole wyboru kraju jest dla niego ustawione na ten kraj, zablokowane
   i opatrzone wyjaśnieniem. Formularze startują z krajem operatora zamiast
   z pustą wartością.

Wybrano wariant „zawężenie widoków i etykiet do kraju operatora”, a nie usunięcie
klucza z sesji — informacja jest użyteczna, a jej brak w interfejsie pozwalał
wybrać kraj, w którym backend i tak odrzuciłby operację.

**Testy:** `AppHeader.test.tsx` — zakres kraju z sesji i wariant „wszystkie kraje”.

---

### ✅ F4. Brak granicy błędów

**Było:** wyjątek przy renderowaniu wygaszał całe drzewo Reacta — biały ekran bez
komunikatu.

**Jest:** `src/components/ErrorBoundary.tsx` — komponent klasowy (React nie ma
odpowiednika `componentDidCatch` w komponencie funkcyjnym) osadzony nad powłoką
aplikacji **i** nad widokiem logowania. Pokazuje przetłumaczony komunikat,
zwijane szczegóły techniczne oraz dwa przyciski: **Spróbuj ponownie**
(czyści stan błędu) i **Odśwież stronę**.

Wyjątek od reguły „tylko komponenty funkcyjne” odnotowany w `docs/frontend_rules.md`.

**Testy:** `ErrorBoundary.test.tsx` — przepuszczanie dzieci, przechwycenie wyjątku,
powrót do normalnego renderowania po „Spróbuj ponownie”.

---

### ✅ F5. Walidacja formularzy wyłącznie atrybutami HTML

**Było:** jedyną walidacją były atrybuty `required` i `type="email"`; każdy błąd
reguły biznesowej wykrywał dopiero backend.

**Jest:** `src/lib/validation.ts` — reguły pól (`requiredText`, `emailRule`,
`phoneRule`, `positiveNumberRule`, `nonNegativeNumberRule`, `dateRangeRule`)
oraz walidatory całych formularzy dla siedmiu formularzy aplikacji.

Walidatory zwracają **klucze tłumaczeń**, nie gotowe teksty — komunikat powstaje
dopiero w komponencie `FieldMessage`, więc walidacja jest wielojęzyczna tak samo
jak reszta interfejsu.

Reguły odwzorowują to, co i tak sprawdza backend: format adresu e-mail i telefonu,
dodatnia wartość przelicznika i wartości kuponu, całkowita liczba punktów, hasło
konta technicznego co najmniej ośmioznakowe, koniec promocji nie wcześniejszy niż
start, mnożnik wymagany tylko dla typu `MULTIPLIER`.

**Testy:** `lib/validation.test.ts` (17 przypadków) plus przypadki „formularz
niepoprawny — akcja hooka nie została wywołana” w testach pięciu sekcji.

---

### ✅ F6. Dostępność: trzy braki względem WCAG + błędny atrybut języka

**Było:** dziesięć kopii tej samej nakładki modalnej, żadna nie przechwytywała
fokusu, nie obsługiwała klawisza Escape ani nie przywracała fokusu po zamknięciu.
Dokument deklarował `lang="en"` przy polskim interfejsie.

**Jest:**

- `src/hooks/useModalA11y.ts` — przechwycenie fokusu wewnątrz okna (tabulator
  krąży w obrębie panelu), zamknięcie klawiszem Escape, przywrócenie fokusu do
  elementu, który okno otworzył, oraz ustawienie fokusu na pierwszym elemencie
  interaktywnym po otwarciu.
- `src/components/ModalShell.tsx` — wspólna powłoka okna (nakładka, panel,
  nagłówek, przycisk zamknięcia, miejsce na komunikat błędu). Wszystkie okna
  w aplikacji korzystają z niej, więc zachowania dostępności są w jednym miejscu,
  a nie w dziesięciu kopiach.
- `index.html` ma `lang="pl"`, a `App.tsx` przestawia `document.documentElement.lang`
  razem z wyborem języka.
- Przy okazji: przełączniki statusu w tabelach dostały `aria-label` z nazwą
  wiersza — wcześniej czytnik ekranu odczytywał je jako bezimienne pola wyboru.

**Testy:** `ModalShell.test.tsx` (7 przypadków) — atrybuty `role="dialog"` /
`aria-modal` / `aria-labelledby`, fokus po otwarciu, Escape, krążenie fokusu
w obie strony, powrót fokusu do elementu wywołującego.

---

### ✅ F7. i18n: brak liczby mnogiej, walut i lokalizacji dat

**Było:** `toLocaleString()` bez podania lokalizacji (postać daty zależała od
ustawień przeglądarki, nie od języka aplikacji), brak obsługi liczby mnogiej,
brak formatowania walut. Odwzorowanie `localeByLanguage` istniało w modelu widoku,
lecz nie było używane.

**Jest:** `src/i18n/format.ts` — `createFormatters(language)` zwraca komplet
formatterów opartych na `Intl`, zbudowanych na istniejącym odwzorowaniu
`localeByLanguage`:

| Funkcja | Mechanizm |
|---|---|
| `formatDate`, `formatDateTime` | `Intl.DateTimeFormat` z lokalizacją języka |
| `formatNumber` | `Intl.NumberFormat` |
| `formatCurrency` | `Intl.NumberFormat` w trybie waluty, waluta z kraju rekordu (`currencyByCountry`); dla kraju spoza mapy — sama liczba z dwoma miejscami |
| `pluralCategory` | `Intl.PluralRules` |

Liczba mnoga: `translatePlural(language, key, count)` wybiera wariant klucza
`_one` / `_few` / `_many` / `_other`. Polski wymaga formy trójstopniowej —
„1 klient”, „3 klienci”, „12 klientów” — czego pojedynczy łańcuch z `{{count}}`
nie jest w stanie obsłużyć. Dodano trzy zestawy kluczy w liczbie mnogiej
(klienci, kupony, wynik importu) we wszystkich trzech słownikach.

Instancje `Intl.*` są tworzone raz na język (pamięć podręczna w `format.ts`) —
ich konstrukcja jest kosztowna.

**Testy:** `i18n/index.test.ts` — trzy polskie formy, dwie angielskie,
formatowanie daty według języka (`18 mar 2026` vs `Mar 18, 2026`), waluta,
wartość zastępcza dla pustych danych.

---

### ✅ F8. Dwa hooki wyświetlają stały tekst po angielsku

**Było:** wyrażenie `err.response?.data?.detail || 'Failed to …'` powielone
w każdym hooku, a `usePromotions` i `useTechnicalUsers` w ogóle pomijały komunikat
serwera (`catch { setError('Failed to fetch promotions') }`) — tekst po angielsku,
nieobjęty mechanizmem tłumaczeń. Funkcja `extractApiError` istniała w `App.tsx`
i była wywoływana raz.

**Jest:**

- `src/api/errors.ts` — `extractApiError(err, fallback)` jako jedyne miejsce
  odczytu komunikatu; kolejność zapasowa `detail` → `title` → `error` → `message`
  → tekst zapasowy. Typ argumentu to `unknown`, nie `any`.
- `src/hooks/useApiError.ts` — `useApiErrorMessage(t)` zwraca **stabilną** funkcję,
  która jako tekst zapasowy przyjmuje **klucz słownika**, a nie gotowy łańcuch.
  Translator trzymany w referencji, więc zmiana języka nie unieważnia `useCallback`
  w hookach i nie powoduje ponownego pobrania danych.
- Wszystkie sześć hooków dziedzinowych plus `useAuth` używa tej samej ścieżki.
  Do słowników dodano 13 kluczy komunikatów błędów, których wcześniej nie było.

**Testy:** `api/errors.test.ts` (9 przypadków) plus przypadki „komunikat z
`detail`” i „przetłumaczony tekst zapasowy, gdy backend nie podał `detail`”
w testach hooków.

---

### ✅ F9. Wszystkie dane ładowane po zalogowaniu

**Było:** `fetchData` w orkiestratorze pobierał sześć kolekcji równolegle,
a dla roli `ADMIN` siódmą — niezależnie od aktywnej zakładki.

**Jest:** `src/hooks/useEnsure.ts` — opakowanie, które wykonuje pobranie co najwyżej
raz na sesję. Każdy hook dziedzinowy udostępnia wariant `ensure…` obok `fetch…`,
a sekcja woła go w efekcie przy wejściu na swoją trasę.

Zaraz po zalogowaniu pobierane są **tylko dwa** słowniki konfiguracyjne
(kraje i prefiksy kuponów), z których korzysta większość formularzy. Reszta
schodzi przy wejściu na trasę i nie jest pobierana ponownie przy powrocie.

Sprzężenie z **F2** wykorzystane zgodnie z sugestią rejestru: podział kodu
i odroczone pobieranie danych wprowadzone razem z routingiem.

**Testy:** `useCustomers.test.ts` — dwa wywołania `ensureCustomers` dają jedno
żądanie; testy sekcji sprawdzają, że wejście na trasę woła `ensure…`.

---

### ✅ F10. Brak aktualizacji optymistycznych

**Było:** każda operacja modyfikująca kończyła się ponownym pobraniem całej kolekcji.

**Jest:** dla operacji zmieniających samą flagę (włącz / wyłącz promocję, promocję
hierarchii, konto techniczne) stan jest aktualizowany lokalnie od razu, a wycofywany
do poprzedniej wartości, jeśli żądanie się nie powiedzie. Znika jedno żądanie
`GET` po każdym przełączeniu, a przełącznik reaguje natychmiast.

Operacje tworzące i edytujące nadal pobierają kolekcję ponownie — serwer nadaje
identyfikatory, kody kuponów i daty ważności, więc odgadywanie odpowiedzi po
stronie klienta dawałoby stan rozjeżdżający się z serwerem. Rejestr określał
tę pozycję jako opcjonalną; wprowadzono ją tam, gdzie jest bezpieczna.

**Testy:** `usePromotions.test.ts` i `useHierarchyPromotions.test.ts` —
aktualizacja bez ponownego `GET` oraz wycofanie zmiany po błędzie.

---

### ✅ F11. Niekonsekwentna konwersja liczb w formularzach

**Było:** `useCoupons.createTemplate` i `usePromotions.savePromotion` wysyłały
formularz bez konwersji (`api.post('/coupon-templates', form)`), więc rzutowanie
łańcuchów na liczby spoczywało na deserializatorze backendu. Dodatkowo
`NewPointsFormState.points` był typu `number`, wbrew regule „wszystkie pola
liczbowe formularzy są łańcuchami znaków”.

**Jest:** `src/lib/numbers.ts` — `toNumber`, `toNumberOrNull`, `toInteger`,
`toIntegerOrNull`, `toTextOrNull` (obsługuje też przecinek dziesiętny i przycinanie
białych znaków). Wszystkie hooki budują ładunek żądania jawnie, konwertując pola
liczbowe na granicy wysyłki. `NewPointsFormState.points` jest teraz łańcuchem —
typy formularzy są jednolite.

**Testy:** `lib/numbers.test.ts` (6 przypadków) plus asercje na kształcie ładunku
w testach `useCoupons`, `usePromotions`, `useHierarchyPromotions`, `useCustomers`.

---

### ✅ F12. Odpowiedzi backendu bez walidacji kształtu w czasie działania

**Było:** `api.get<Customer[]>('/customers')` — kontrakt wyłącznie kompilacyjny,
znikający po transpilacji.

**Jest:** `src/api/schema.ts` — predykaty typu dla dziesięciu kształtów
odpowiedzi oraz `parseList` / `parseObject`, które rzucają `ResponseShapeError`
z nazwą punktu końcowego. Wszystkie wywołania mają teraz postać
`api.get<unknown>(…)` z jawnym sprawdzeniem kształtu, a `ResponseShapeError`
jest tłumaczony na komunikat „Serwer zwrócił dane w nieoczekiwanym formacie”.

Świadomie **nie** dodano biblioteki walidacji schematów (Zod, Valibot) — dziesięć
predykatów to ok. 120 wierszy bez nowej zależności i bez drugiego źródła prawdy
o typach obok `src/types/`.

Efekt uboczny wskazany w rejestrze: znikła część użyć typu dowolnego z **F15**,
a atrapy w testach musiały nabrać pełnego, poprawnego kształtu — stąd
`src/test/fixtures.ts`. Atrapa `{ id: 'c1' }` udawała kontrakt, którego backend
nigdy nie zwraca, więc test przechodził, nie znacząc nic.

**Testy:** `api/schema.test.ts` (10 przypadków) plus przypadek „odpowiedź
o złym kształcie” w testach `useCustomers` i `useReports`.

---

### ✅ F13. Dwa martwe komponenty z własnymi testami

Usunięto `AddCustomerSection.tsx` i `TechnicalAccountsSection.tsx` wraz z ich
plikami testowymi. Oba były pozostałością po przebudowie — ich funkcje przejęły
odpowiednio `CustomersSection` i `ToolsSection`, a żaden komponent ich nie
importował. Metryka pokrycia przestała być zawyżana testami kodu, który nie
trafiał do wyniku budowania.

---

### ✅ F14. Fantomowa zależność biblioteki dat

`dayjs` był importowany w `StorePromotionsSection` i `HierarchyPromotionsSection`,
lecz niezadeklarowany — działał jako zależność tranzytywna Ant Design.
Zadeklarowany jawnie w `package.json` (`dayjs: ^1.11.23`) i wymieniony w tabeli
stosu technologicznego w README oraz w regułach projektu.

---

### ✅ F15. Analizator statyczny zgłasza 49 błędów i 3 ostrzeżenia

**Było:** `npm run lint` kończył się niepowodzeniem (41 użyć typu dowolnego,
8 nieużywanych zmiennych, 3 ostrzeżenia), podczas gdy budowanie i testy
przechodziły — nic nie blokowało wydania.

**Jest:** `npm run lint` przechodzi bez błędów i bez ostrzeżeń.

- 41 użyć typu dowolnego zastąpionych typem `unknown` z predykatami
  (`api/errors.ts`, `api/schema.ts`); dotyczy to również plików testowych,
  gdzie `as any` w atrapach zastąpiły dane z `src/test/fixtures.ts`.
- 8 nieużywanych zmiennych (`catch (err: any)` bez użycia `err`) zniknęło razem
  z przepisaniem obsługi błędów.
- 3 ostrzeżenia pochodziły z **wygenerowanego** katalogu `coverage/`, który
  analizator brał pod uwagę. Dodany do `globalIgnores` w `eslint.config.js`
  razem z `node_modules`.
- Naprawiono też dwa naruszenia reguły `react-hooks/set-state-in-effect`,
  które ujawniły się przy nowym kodzie.

**Bramka jakości:** `.github/workflows/ci.yml` uruchamia na każdym pushu
i pull requeście do `master`: `npm ci` → `lint` → `typecheck` → `test:coverage`
→ `build`, i zachowuje raport pokrycia jako artefakt. Dodano skrypty
`npm run typecheck` i `npm run test:coverage`.

---

### ✅ F16. Komponent raportów łamie architekturę warstw

**Było:** `ReportsAuditSection` jako jedyny komponent warstwy prezentacji
importował klienta HTTP bezpośrednio i zarządzał własnym stanem sieciowym
(trzy `useState`, dwa efekty z pobieraniem, `URL.createObjectURL` dla eksportu).

**Jest:** `src/hooks/useReports.ts` — szósty hook dziedzinowy, o tej samej
budowie co pozostałe (`summary`, `auditLogs`, `loading`, `exporting`, `error`,
`fetchSummary`, `fetchAuditLogs`, `exportCsv`). Komponent jest czysto prezentacyjny.

Przy okazji przeniesiono do `useCustomers` drugie takie miejsce: import CSV
wołał `api.post('/tools/import-customers', …)` bezpośrednio z `App.tsx`. Teraz
jest to `importCustomers(file)`, a liczba zaimportowanych klientów trafia do
komunikatu w poprawnej formie liczby mnogiej — parametr `{{count}}` w kluczu
`importCustomersSuccess` nigdy wcześniej nie był przekazywany.

**Testy:** `useReports.test.ts` (6 przypadków), `ReportsAuditSection.test.tsx`
(6 przypadków, w tym „komponent prosi hook zamiast wołać klienta HTTP”).

---

### ✅ F17. Przewiercanie właściwości (prop drilling)

**Było:** 34 stany w `App.tsx`, dwa komponenty przyjmujące po 22 właściwości,
brak warstwy pośredniczącej między hookami a komponentami.

**Jest:** kontekst Reacta (`src/context/`) plus przeniesienie stanu formularzy
do sekcji, które je renderują.

- `appContext.ts` — typ kontekstu i `useAppContext()`; udostępnia tłumaczenia
  (`t`, `tPlural`), formatowanie (`format`), etykiety domenowe, ustawienia
  interfejsu, sesję, słowniki konfiguracyjne, komplet hooków dziedzinowych
  i powiadomienia.
- `AppProvider.tsx` — tworzy hooki, pilnuje licznika powiadomień, pobiera
  słowniki konfiguracyjne.
- Sekcje nie przyjmują już właściwości w ogóle; stan formularza, wybrany widok
  i stan filtrów mieszkają w komponencie, który z nich korzysta.

Wynik: `App.tsx` z 575 wierszy do 118, z 34 stanów do 3 (język, motyw,
powiadomienie — reszta zeszła do hooków i do sekcji). Sekcje tras nie przyjmują
już żadnych właściwości. Najwięcej właściwości ma dziś `ModalShell` (7 —
tytuł, podtytuł, `onClose`, błąd, szerokość, identyfikator nagłówka, dzieci),
a wśród widoków `LoginView` (6): renderuje się przed dostawcą kontekstu, więc
jako jedyny dostaje `t` i motyw jako właściwości. Stan pól logowania trzyma
sam — orkiestrator nie ma powodu znać wpisywanego hasła.

Nie wprowadzono zewnętrznego magazynu stanu (Redux, Zustand) — kontekst wystarcza
przy tej liczbie obszarów dziedziny i nie dokłada zależności ani nowego wzorca
do opanowania.

---

### ✅ F18 — częściowo. Kontrola dostępu wyłącznie prezentacyjna, token w pamięci przeglądarki

Zgodnie z rejestrem, który nazywa to **granicą rozwiązania, a nie luką**:
domknięcie (ciasteczko niedostępne dla skryptów + ochrona przed fałszowaniem
żądań międzywitrynowych) wymaga zmian po stronie backendu i pozostaje poza
zakresem tej gałęzi.

Zrobiono to, co da się zrobić po stronie frontendu: kompromis jest **opisany
wprost w README**, w sekcji o autoryzacji — że rola i kod kraju sterują wyłącznie
wyglądem interfejsu, a jedyną realną kontrolą dostępu jest backend. Wcześniej
dokumentacja tego nie odnotowywała.

---

### ✅ F19. Cztery twierdzenia dokumentacji nie odpowiadają kodowi

Zaktualizowano `docs/frontend_rules.md`. Rozbieżności, które znaleziono i naprawiono:

| # | Twierdzenie dokumentacji | Stan faktyczny w `aab1856` |
|---|---|---|
| 1 | „Zakładki renderowane przez komponent `<Tabs>` z Ant Design” | zakładki to zwykłe `<button>` z klasą `.sidebar-nav-btn` |
| 2 | Unia `Tab` wymieniona jako `'add-customer' \| 'store-promotions' \| 'technical-accounts'` | rzeczywista unia to `'promotions' \| 'reports' \| 'tools'` — trzy wymienione wartości nie istniały |
| 3 | „Response: przy 401 wywołuje `logout()` **i odświeża stronę**” | interceptor woła `logout()` i przekazuje błąd dalej; nigdzie nie ma przeładowania |
| 4 | `extractApiError` opisana jako element `src/api/client.ts` | funkcja mieszkała w `App.tsx` i była wywoływana raz |

Przy okazji poprawiono dwa nieaktualne przykłady (plik `AddCustomerSection.tsx`
i setter `setActiveTab` — oba już nie istnieją) i uzupełniono dokument o sekcje
opisujące stan po zmianach: kontekst, walidację, formatowanie Intl, walidację
kształtu odpowiedzi, routing, bramkę jakości.

---

## C. Funkcje nieobecne w całym rozdziale

### ✅ F-C1. Brak wyszukiwania i stronicowania w kartotece klientów

Dodane w `CustomersSection`: pole wyszukiwania (imię, nazwisko, e-mail, numer
klienta, telefon, kraj — bez rozróżniania wielkości liter), wybór liczby wierszy
na stronie (10 / 25 / 50), nawigacja między stronami i licznik wyników
w poprawnej formie liczby mnogiej.

**Zastrzeżenie:** filtrowanie i stronicowanie działają **po stronie klienta**,
na kolekcji pobranej w całości. Usuwa to problem użyteczności panelu (rejestr:
„panel przestanie być używalny wcześniej niż backend przestanie wyrabiać”),
ale nie problem wydajnościowy — ten wymaga stronicowania w API i jest sprzężony
z pozycją **B5** rejestru backendu.

### ⚠️ F-C2. Brak ręcznego wylogowania — pozycja nieaktualna

Ręczne wylogowanie **istniało już w `aab1856`**: przycisk „Wyloguj” w nagłówku
(`AppHeader`), wołający `logout()` z `useAuth`. Rejestr wypunktował brak opisu
w rozdziale 4, nie brak funkcji. Do kodu nie było więc czego dodawać — brakowało
opisu, i to jest do uzupełnienia po stronie pracy.

### ❌ F-C3. Brak ekranu zmiany własnego hasła — nie zrobione

Wymaga punktu końcowego po stronie backendu (sprzężenie z **B-C1** rejestru
backendu). Zbudowanie ekranu wołającego nieistniejący adres dałoby kontrolkę,
za którą nic nie stoi — czyli dokładnie to, czym jest **F1**, najpoważniejszy
brak z tego rejestru. Zostawione do zrobienia razem z backendem.

---

## Czego nie zrobiono

| Pozycja | Powód |
|---|---|
| **F-C3** — ekran zmiany hasła | brak punktu końcowego w API; sprzężone z **B-C1** |
| **F18** — token w ciasteczku niedostępnym dla skryptów | wymaga zmian po stronie backendu; rejestr nazywa to granicą rozwiązania, nie luką |

Obie pozycje mają wspólną cechę: nie da się ich domknąć wyłącznie w tym
repozytorium. Reszta rejestru — 18 z 19 pozycji **A** i 2 z 3 pozycji **C** —
jest zrealizowana.

---

## Zmiany w zależnościach

| Pakiet | Wersja | Powód |
|---|---|---|
| `react-router-dom` | `^7.18.3` | **F2** — routing |
| `dayjs` | `^1.11.23` | **F14** — deklaracja zależności fantomowej |

Nie dodano biblioteki walidacji schematów ani magazynu stanu — uzasadnienie
przy **F12** i **F17**.

---

## Nowe pliki

```
.github/workflows/ci.yml          ← bramka jakości (F15)
src/routes.ts                     ← definicje tras i dostęp wg roli (F2)
src/api/errors.ts                 ← extractApiError (F8)
src/api/schema.ts                 ← walidacja kształtu odpowiedzi (F12)
src/context/appContext.ts         ← typ kontekstu + useAppContext (F17)
src/context/AppProvider.tsx       ← dostawca kontekstu (F17)
src/lib/numbers.ts                ← konwersja pól liczbowych (F11)
src/lib/validation.ts             ← walidacja formularzy (F5)
src/i18n/format.ts                ← formatowanie Intl (F7)
src/hooks/useApiError.ts          ← komunikaty błędów z kluczy słownika (F8)
src/hooks/useEnsure.ts            ← pobieranie odroczone (F9)
src/hooks/useModalA11y.ts         ← wymagania WCAG dla okien (F6)
src/hooks/useReports.ts           ← hook raportów i audytu (F16)
src/components/AppShell.tsx       ← powłoka z routingiem (F2)
src/components/ModalShell.tsx     ← wspólna powłoka okna (F6)
src/components/ErrorBoundary.tsx  ← granica błędów (F4)
src/components/CountrySelect.tsx  ← wybór kraju z zakresem sesji (F3)
src/components/FieldMessage.tsx   ← komunikat walidacji (F5)
src/components/PromotionsPage.tsx ← trasa /promotions (F2)
src/test/fixtures.ts              ← dane testowe zgodne z kontraktem (F12)
src/test/harness.tsx              ← renderWithApp (F17)
```

Usunięte: `src/components/AddCustomerSection.tsx`,
`src/components/TechnicalAccountsSection.tsx` wraz z testami (**F13**).

---

## Weryfikacja

```
npm run lint           → 0 błędów, 0 ostrzeżeń
npm run typecheck      → bez błędów
npm test               → 165 testów w 27 plikach, wszystkie zaliczone
npm run test:coverage  → 80,7 % instrukcji, 82,6 % gałęzi
npm run build          → sukces, 7 porcji ładowanych wraz z trasą
```

Weryfikacja wobec żywego backendu nie została przeprowadzona — backend nie był
uruchomiony podczas prac. Wszystkie zmiany kontraktu z API (kształt ładunków
żądań w **F11**, predykaty odpowiedzi w **F12**) odwzorowują to, co wysyłał
i przyjmował kod sprzed zmian; predykaty dopuszczają wartość pustą tam, gdzie
typy domenowe ją przewidują. Pierwsze uruchomienie z działającym backendem
warto poświęcić na sprawdzenie właśnie tych dwóch punktów.
