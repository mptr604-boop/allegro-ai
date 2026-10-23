# allegro-ai

Generator ogłoszeń na Allegro Lokalnie: **zdjęcia + krótka notatka → zwalidowany JSON/CSV z gotowym ogłoszeniem**.

To projekt edukacyjny, zbudowany, żeby poznać podstawy pracy z modelami AI w TypeScripcie: structured outputs, multimodalność, ograniczanie halucynacji i ewaluację. Nie jest to produkt ani rozwiązanie produkcyjne. Powstał we współpracy z AI jako asystentem programistycznym.

## Co to pokazuje

| Zagadnienie | Gdzie |
|---|---|
| **Structured output**: model zwraca obiekt zgodny ze schematem zod, nie luźny tekst | [`src/schema.ts`](src/schema.ts) |
| **Multimodalność**: kilka zdjęć jednego przedmiotu + notatka w jednej wiadomości | [`src/listing.ts`](src/listing.ts) |
| **Ograniczenia w prompcie**: żadnych wymyślonych cen, marek i parametrów | [`src/prompt.ts`](src/prompt.ts) |
| **Pola `nullable` i `needs_seller_check`**: model może przyznać się, że czegoś nie wie | [`src/schema.ts`](src/schema.ts) |
| **Dane od człowieka poza modelem**: cenę podaje sprzedawca, nie AI | [`src/listing.ts`](src/listing.ts) |
| **Testy deterministyczne** (bez API): schemat, normalizacja tytułu, eksport CSV | [`test/`](test/) |
| **Ewaluacja na prawdziwym modelu**: zestaw przypadków z regułami (np. brak zmyślonej marki) | [`evals/`](evals/) |
| **Batch**: przetwarzanie katalogu przedmiotów, limity zapytań, odporność na błędy | [`src/batch.ts`](src/batch.ts) |

## Wymagania

- Node.js 24+ (uruchamia pliki `.ts` bez kompilacji)
- Klucz API Gemini (darmowy z [Google AI Studio](https://aistudio.google.com))

## Instalacja

```bash
npm install
cp .env.example .env     # wklej swój klucz do .env
```

Opcjonalnie zmienna `GEMINI_MODEL` pozwala wybrać inny model bez zmian w kodzie (domyślnie `gemini-3.1-flash-lite-preview`). Nazwy modeli się zmieniają i bywają przeciążone (błędy 404/503), dlatego są w jednym miejscu: [`src/config.ts`](src/config.ts).

## Użycie

### Jeden przedmiot

```bash
node src/cli.ts zdjecie.jpg "jak nowy, nie pobijany" --price 150
```

### Wiele przedmiotów (batch)

Jeden folder = jeden przedmiot. Wewnątrz zdjęcia i opcjonalny `meta.json`:

```
items/
  kettlebell-16kg/
    1.jpg
    2.jpg
    meta.json        {"note": "jak nowy, nie pobijany", "price": 150}
  hantle/
    foto.png
```

```bash
npm run batch            # items/ -> out/listings.csv + out/listings.json
node src/batch.ts moj-katalog moje-wyniki
```

Przedmiot z błędem nie przerywa całości. Na końcu dostajesz listę folderów do ponowienia. Między zapytaniami jest 4 s przerwy, żeby nie przekroczyć limitów darmowego planu.

### Testy i ewaluacja

```bash
npm test                 # testy bez API, w milisekundach
npm run eval             # prawdziwy model na przypadkach z evals/cases.json
npm run typecheck
```

Ewaluacja sprawdza reguły, np.: „marka ma być `null`, gdy nie widać logo", „nie ma frazesów typu *na lata*", „marka ma być odczytana, gdy jest na zdjęciu". Przypadki dodajesz wpisem do [`evals/cases.json`](evals/cases.json), a zdjęcia do `evals/images/` (katalog jest w `.gitignore`).

## Decyzje projektowe

- **Cena poza modelem.** Model zgaduje fakty, jeśli mu na to pozwolić, więc cenę podaje człowiek, a w schemacie są pola `nullable`.
- **Deterministyczne rzeczy robi kod, nie prompt.** Wielkość liter w tytule poprawia `normalizeTitle`, bo instrukcja w prompcie miała skutki uboczne.
- **Zależność od dostawcy w jednym miejscu.** Nazwy modeli i API się starzeją (np. `generateObject` jest w AI SDK v7 przestarzały, więc użyto `generateText` z `Output.object`), dlatego konfiguracja jest w [`src/config.ts`](src/config.ts).

## Prywatność

Na darmowym planie Gemini API Google może wykorzystywać wysyłane dane (zdjęcia i teksty) do ulepszania swoich produktów. Nie wysyłaj zdjęć z ludźmi, adresami ani dokumentami. Szczegóły: [warunki Gemini API](https://ai.google.dev/gemini-api/docs/pricing). Pliki `.env`, `items/`, `out/` i `evals/images/` są wyłączone z repozytorium.

## Ograniczenia

- Kategorie i stan to sugestie modelu. Nie ma integracji z API Allegro ani sprawdzania cen rynkowych.
- Ewaluacja ma niewiele przypadków, więc jest szkieletem, a nie pełnym zestawem testowym.
- Wyniki modelu bywają niedeterministyczne, nawet przy niskiej temperaturze.

## Licencja

MIT
