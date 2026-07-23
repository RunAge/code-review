Oto kompletna specyfikacja techniczna przeznaczona bezpośrednio dla agenta kodującego (np. Cursor, Windsurf, Claude Code, Aider). Specyfikacja została napisana w formie precyzyjnych instrukcji z naciskiem na **TDD (Test-Driven Development)** oraz podziałem na fazy.

---

# Specyfikacja Techniczna: AI-Friendly Code Review Tool (Client-Side SPA)

## 1. Cel Projektu & Architektura

Stworzenie bezserwerowego (Client-Side SPA) narzędzia do wyspecjalizowanego Code-Review dla bardzo dużych Pull Requestów (PR) wygenerowanych przez agenty AI.

- **Hosting:** GitHub Pages (statyczny build Nuxt 3 SPA).

- **Zero Backend Storage:** Wszystkie dane przeglądania, tokeny, hashe i drafty komentarzy żyją wyłącznie w przeglądarce użytkownika (`IndexedDB`).

- **Autoryzacja:** GitHub OAuth 2.0 z przepływem PKCE (Client-Side) lub zapasowo Personal Access Token (PAT).

- **Śledzenie Zmian:** Unikalne śledzenie przejrzanych fragmentów kodu (`patch-id`) odporne na `git push --force` i rebase.

## 2. Stos Technologiczny

- **Framework:** Nuxt 3 (mode: `ssr: false`, SPA / SSG) + TypeScript.

- **Stan & Storage:** Pinia + `Dexie.js` (IndexedDB Wrapper).

- **Diff Engine / UI:** Vue Virtual Scroller + CodeMirror 6 lub Shiki/Monaco (optymalizacja pod duże pliki).

- **Testy (TDD):** **Vitest** (testy jednostkowe i logiki biznesowej) + **Vue Test Utils** + **Playwright** (testy E2E / integracyjne).
- **Worker:** Web Workers (dla ciężkich operacji parsujących i wyliczania hashy).

- **Środowisko testowe PR:** W repo powinien istnieć lekki zestaw zmian do ręcznego testowania UI review (inline comment, range comment, suggestion).

---

## 3. Żelazna Zasada: Test-Driven Development (TDD)

> **Rozkaz dla Agenta:** Dla każdej fazy oraz każdej pojedynczej funkcji **NAJPIERW** musisz napisać zestaw testów (Vitest), które nie przechodzą (RED). Dopiero po zatwierdzeniu testów piszesz minimalny kod produkcyjny wymagany do ich zaliczenia (GREEN), a na końcu wykonujesz refaktoryzację (REFACTOR). Nie twórz kodu produkcyjnego bez wcześniejszego testu jednostkowego lub integracyjnego!

---

## 4. Fazy Wdrożenia Projektu

### Dodatek: Testowy Pull Request (Sandbox)

W celu walidacji narzędzia review poza testami automatycznymi, utrzymuj jedną testową gałąź PR z kontrolowanymi zmianami w katalogu `docs/test-pr-fixture/`.

Zakres testów manualnych na sandbox PR:

- pojedynczy komentarz do linii,
- komentarz do zakresu linii,
- komentarz z blokiem suggestion,
- submit review typu `COMMENT` z pending comments.

### FAZA 1: Inicjalizacja Projektu, Środowisko TDD i Autoryzacja OAuth PKCE

#### Zadania do wykonania:

1. Skonfiguruj projekt Nuxt 3 w trybie SPA (`ssr: false`) oraz przygotuj konfigurację dla GitHub Pages (`nitro.preset: 'github-pages'`).

2. Skonfiguruj środowisko testowe **Vitest** + **Vue Test Utils**.
3. Zaimplementuj moduł autoryzacji z GitHub API:

- Obsługa przepływu OAuth 2.0 PKCE (`@octokit/oauth-methods` lub własna implementacja oparta na Web Crypto API).

- Fallback: Pole do ręcznego wklejenia Personal Access Token (PAT) dla celów deweloperskich.

- Zapisywanie tokena w bezpieczny sposób w `localStorage` / `IndexedDB`.

#### Wymagane Testy (TDD) przed napisaniem kodu:

- `tests/auth/pkce.test.ts`: Test sprawdzający prawidłowe wygenerowanie `code_verifier` oraz `code_challenge` (SHA-256).
- `tests/auth/tokenStorage.test.ts`: Test zapisu, odczytu i czyszczenia tokena z bezpiecznej pamięci.
- `tests/auth/githubAuth.test.ts`: Test sprawdzający poprawność dodawania nagłówka `Authorization: Bearer <token>` do wszystkich wychodzących zapytań `fetch`.

---

### FAZA 2: Web Worker, Parsowanie Diffów i Generowanie Patch-ID (Rebase-Resistant)

#### Zadania do wykonania:

1. Stwórz Web Worker obsługujący przetwarzanie ciężkich tekstowych plików `.diff` bez blokowania wątku głównego (UI).

2. Wykorzystaj pobieranie zbiorczego diffa za pomocą nagłówka `Accept: application/vnd.github.v3.diff`.

3. Stwórz algorytm generowania unikalnego `patch-id` dla każdego hunka (fragmentu diffa) w kodzie:

- Normalizacja: usunięcie białych znaków na końcach linii, ignorowanie pusto-liniowych różnic.

- Generowanie SHA-256 z treści linii przed i po zmianie przy użyciu natywnego `crypto.subtle` w przeglądarce / workerze.

#### Wymagane Testy (TDD) przed napisaniem kodu:

- `tests/parser/diffParser.test.ts`: Test parsowania surowego pliku `.diff` na strukturę drzewa plików i hunków.
- `tests/crypto/patchId.test.ts`:
- Test sprawdzający, czy ta sama zmiana w kodzie daje **ten sam hash**, nawet jeśli numery linii uległy zmianie.
- Test sprawdzający, czy modyfikacja choćby jednego znaku w logice generuje **inny hash**.
- Test sprawdzający odporność na zmiany cudzysłowów lub spacji na końcach linii (zgodnie z zasadami normalizacji).

---

### FAZA 3: Baza Danych Local-First (IndexedDB) & Rebase Engine

#### Zadania do wykonania:

1. Skonfiguruj `Dexie.js` (IndexedDB) z tabelami:

- `reviews`: ID Pull Requesta, owner, repo, data.

- `viewed_hunks`: `pr_id`, `file_path`, `patch_id` (hash hunka), `timestamp`.

2. Zaimplementuj silnik dopasowywania (Fuzzy Matching Engine):

- Po załadowaniu PR po wykonanym `git push --force`, system porównuje nowe `patch-id` z zapisanymi w `IndexedDB`.

- Jeśli hash hunka zgadza się z zapisanym, hunk automatycznie oznacza się jako **"Przeczytany"** (mimo iż commit SHA uległ zmianie).

#### Wymagane Testy (TDD) przed napisaniem kodu:

- `tests/db/indexedDb.test.ts`: Testy operacji CRUD na `Dexie.js` (oznaczanie hunka jako przeczytany/nieprzeczytany).
- `tests/engine/rebaseMatching.test.ts`: Test symulujący `git push --force`. Tworzone są 2 wersje diffa tego samego kodu z innymi commit SHA. Test musi wykazać, że stan "przeczytane" został zachowany dla niezmienionych hunków po rebase.

---

### FAZA 4: Interfejs Użytkownika – Virtual Scrolling, Split/Single View & AI Noise Filter

#### Zadania do wykonania:

1. Stwórz wydajny komponent renderowania diffa z przełącznikiem **Single View (Unified)** oraz **Split View (Side-by-Side)**.

2. Zastosuj **Virtual Scrolling** (`vue-virtual-scroller`), aby płynnie renderować PR mające ponad 10 000 linii.

3. Zaimplementuj **Smart AI Noise Filter**:

- Automatyczne ukrywanie / zwijanie plików `.lock`, wygenerowanych typów (`*.gen.ts`), schematów DB.

- Zwijanie hunków zawierających wyłącznie reorganizację importów lub automatyczne formatowanie.

4. Dodaj drzewo plików (File Tree) po lewej stronie z licznikami postępu review (np. `[4/5 przeczytane]`).

5. Dodaj skróty klawiszowe (np. `J` / `K` do skakania między nieprzejrzanymi hunkami, `M` do oznaczania jako przeczytane).

#### Wymagane Testy (TDD) przed napisaniem kodu:

- `tests/ui/diffView.test.ts`: Test renderowania komponentu DiffView w trybie Unified i Split.
- `tests/filters/aiNoiseFilter.test.ts`: Testy klasyfikujące pliki i hunki jako "szum AI" na podstawie nazwy pliku i typu zmian.
- `tests/ui/keyboardShortcuts.test.ts`: Test symulujący wciśnięcie klawiszy `J`/`K`/`M` i weryfikujący zmianę aktywnego hunka i stanu w store.

---

### FAZA 5: System Komentarzy, Wątki (Inline/General), Bot Detection & GraphQL

#### Zadania do wykonania:

1. Pobieranie komentarzy z GitHub API:

- REST API dla komentarzy inline (`/pulls/{pr}/comments`) i ogólnych (`/issues/{pr}/comments`).

- GraphQL API dla pobierania statusów **Resolved / Unresolved** wątków.

2. Nakładanie komentarzy na kod w widoku diffa:

- Indeksowanie komentarzy per linia i plik.

- Wstrzykiwanie komponentu wątku pod odpowiednimi liniami kodu.

3. Rozróżnianie autorów i filtrowanie:

- Wykrywanie botów i agentów AI (`user.type === "Bot"`).

- Filtry UI: `Wszystkie` | `Tylko Ludzie` | `Tylko Boty AI` | `Tylko Nierozwiązane`.

4. Obsługa zdezaktualizowanych komentarzy (Outdated Comments po force-push): wyliczanie ich pozycji na podstawie `patch-id` lub zwijanie w dedykowanej sekcji.

5. Dodawanie nowych komentarzy oraz zatwierdzanie / odrzucanie PR (Approve / Request Changes) przez GitHub API.

#### Wymagane Testy (TDD) przed napisaniem kodu:

- `tests/comments/commentMapper.test.ts`: Test mapujący surową tablicę komentarzy z GitHub API na strukturę drzewa linii w plikach.
- `tests/comments/botDetection.test.ts`: Test weryfikujący poprawność wykrywania autorów będących botami AI.
- `tests/comments/outdatedComments.test.ts`: Test weryfikujący właściwe przypisywanie komentarzy z flaga `outdated: true` do zreorganizowanego kodu.

---

## 5. Kryteria Akceptacji i Quality Gates

1. **Pokrycie testami (Code Coverage):** Minimum 85% pokrycia kodu dla warstwy logiki (Worker, Crypto, Parser, Matching Engine, Storage).
2. **Wydajność (Performance):** Przetworzenie diffa 10 000 linii w czasie < 800ms w Web Workerze bez zacięcia UI.
3. **Prywatność:** Zero zewnętrznych zapytań HTTP poza oficjalnym API GitHuba (`api.github.com`). Brak własnych serwerów pośredniczących.
