# Diagram klas — loyalty-club (frontend)

Diagram jest generowany ze źródeł `src` skryptem
[`scripts/generate-class-diagram.py`](../../scripts/generate-class-diagram.py),
a nie eksportowany ręcznie z IntelliJ — dzięki temu da się go odtworzyć po każdej
zmianie w kodzie. Odpowiada diagramowi z repozytorium backendu
(`loyalytyClub-backend/docs/diagrams`).

## Zawartość katalogu

| Plik | Opis |
| --- | --- |
| `class-diagram-a4.pdf` | 12 stron A4 poziomo, jedna warstwa architektury na stronę |
| `class-diagram-a3.pdf` | te same 12 stron w formacie A3 poziomo (czytelniejsze w druku) |
| `page-NN.svg` | rysunek pojedynczej strony (źródło wektorowe, skalowalne bez straty) |
| `page-NN.puml` | źródło PlantUML danej strony — można edytować ręcznie |
| `class-diagram-full.svg` | cały diagram (98 elementów) na jednym arkuszu, 9502 × 1662 px — do oglądania na ekranie |
| `manifest.json` | spis stron: tytuł, lista elementów, powiązania z innymi stronami, wymiary rysunku |

## Co trafia na diagram

Frontend nie jest napisany w stylu obiektowym, więc „klasą” diagramu jest
jednostka, którą TypeScript faktycznie deklaruje. Skrypt rozpoznaje 98 elementów:

| Rodzaj | Liczba | Skąd pochodzi |
| --- | --- | --- |
| typ (`type`) | 38 | aliasy typów, w tym kontrakty hooków i stany formularzy |
| komponent | 18 | eksportowana funkcja `PascalCase` w pliku `.tsx` |
| moduł | 12 | plik bez komponentu i hooka (klient API, walidacja, słowniki i18n) |
| hook | 11 | eksportowana funkcja `useXxx` |
| interfejs | 9 | `interface` — typy danych zwracanych przez API |
| typ wyliczeniowy | 8 | unia literałów tekstowych, np. `'ADMIN' \| 'TECHNICAL'` |
| klasa | 2 | `ErrorBoundary` i `ResponseShapeError` |

Pliki testowe (`*.test.ts(x)`, `src/test/`) i deklaracje środowiska (`*.d.ts`)
są pomijane — nie należą do architektury aplikacji.

Pudełko komponentu zawiera właściwości z jego typu `Props` (typ `XProps` jest
wciągany do komponentu, żeby nie dublować pudełek). Pudełko hooka pokazuje jego
sygnaturę, a zwracany kontrakt (`CustomersApi`, `CouponsApi` itd.) stoi obok jako
osobny typ z pełną listą pól i metod.

## Relacje

- `<|--` — dziedziczenie i implementacja (`extends`, `implements`),
- `-->` oraz `1 --> *` — asocjacja wynikająca z typu pola; gwiazdka dla kolekcji
  (`T[]`, `Array<T>`, `Record<K, V>`, `Map`, `Set`),
- `..>` — zależność wynikająca z importu, rysowana dla komponentów, hooków
  i modułów; to ona pokazuje przepływ: komponent → hook → klient API.

Relacja słabsza nie dubluje mocniejszej między tą samą parą elementów.

## Podział na strony

Strony odpowiadają warstwom architektury: model dziedzinowy, typy interfejsu,
warstwa dostępu do API, hooki, kontekst i nawigacja, komponenty, internacjonalizacja
i narzędzia pomocnicze. Warstwa, której rysunek nie mieścił się na arkuszu, jest
dzielona na części (`cz. 1 z 3` itd.) — skrypt robi to automatycznie, mierząc
wymiary wyrenderowanego SVG. Dzieli też rysunki nadmiernie rozciągnięte w poziomie
(proporcja powyżej 2,8:1): taki rysunek po wpasowaniu w szerokość arkusza marnuje
jego wysokość, a tekst klas robi się drobniejszy, niż musi.

Powiązania wychodzące poza bieżącą stronę pokazane są dwojako:

- jako szare pudełka w ramce `powiązania spoza tej strony` — tylko wtedy, gdy
  mieszczą się na arkuszu (ramka potrafi rozepchnąć rysunek na tyle, że tekst
  robi się nieczytelny),
- jako wykaz w stopce każdej strony PDF (`Powiązania z innymi stronami`) —
  z numerami stron, na których stoją powiązane elementy. Wykaz jest skracany do
  trzech wierszy; pełną listę ma `manifest.json`.

Nazwa powtarzająca się w dwóch plikach (np. lokalny typ `PromotionView`) dostaje
na etykiecie nazwę modułu w nawiasie.

## Regeneracja

```bash
python scripts/generate-class-diagram.py
```

Wymagania: `java` (skrypt używa `plantuml.jar` z lokalnego repozytorium Mavena)
oraz zainstalowany Chrome lub Edge (druk HTML do PDF w trybie headless).
Jeśli brakuje `plantuml.jar`:

```bash
mvn dependency:get -Dartifact=net.sourceforge.plantuml:plantuml:1.2025.4
```
