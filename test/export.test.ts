import { test } from "node:test";
import assert from "node:assert/strict";
import { listingToRow, toCsv } from "../src/export.ts";
import type { FinalListing } from "../src/schema.ts";

const listing: FinalListing = {
  title: "Kettlebell 16 kg",
  category: "Sport > Fitness",
  condition: "like_new",
  detected: { brand: null, weight_kg: 16, material: "żeliwo" },
  highlights: ["a", "b"],
  description: 'Opis z "cudzysłowem", przecinkiem\ni nową linią.',
  tags: ["kettlebell", "fitness"],
  needs_seller_check: ["podaj markę"],
  price_pln: 180,
};

test("toCsv escapes quotes, commas and newlines", () => {
  const csv = toCsv([listingToRow("kb", listing)]);
  assert.ok(csv.includes('"Opis z ""cudzysłowem"", przecinkiem\ni nową linią."'));
});

test("toCsv writes null as an empty cell and keeps the header", () => {
  const [header, row] = toCsv([listingToRow("kb", listing)]).split("\n");
  assert.ok(header.startsWith("folder,title,price_pln"));
  assert.ok(row.includes(",,16,"));
});

test("toCsv returns an empty string for no rows", () => {
  assert.equal(toCsv([]), "");
});
