import { test } from "node:test";
import assert from "node:assert/strict";
import { checkListing, normalizeTitle } from "../src/checks.ts";
import { ListingSchema, type FinalListing } from "../src/schema.ts";

const valid = {
  title: "Kettlebell 16 kg",
  category: "Sport > Fitness",
  condition: "like_new",
  detected: { brand: null, weight_kg: 16, material: null },
  highlights: ["waga 16 kg", "stan jak nowy"],
  description: "Sprzedam kettlebell.",
  tags: ["kettlebell"],
  needs_seller_check: ["podaj materiał"],
};

const asFinal = (o: object): FinalListing => ({ ...(o as FinalListing), price_pln: 180 });

test("schema accepts a valid listing", () => {
  assert.equal(ListingSchema.safeParse(valid).success, true);
});

test("schema rejects a title longer than 50 characters", () => {
  assert.equal(ListingSchema.safeParse({ ...valid, title: "x".repeat(51) }).success, false);
});

test("schema rejects an unknown condition", () => {
  assert.equal(ListingSchema.safeParse({ ...valid, condition: "great" }).success, false);
});

test("schema does not allow the model to set a price field", () => {
  const parsed = ListingSchema.parse({ ...valid, price_pln: 1 });
  assert.equal("price_pln" in parsed, false);
});

test("normalizeTitle capitalizes and collapses whitespace", () => {
  assert.equal(normalizeTitle("  odważnik   kettlebell 16 kg "), "Odważnik kettlebell 16 kg");
});

test("checkListing passes a clean listing", () => {
  assert.deepEqual(checkListing(asFinal(valid), { nullFields: ["brand", "material"] }), []);
});

test("checkListing catches invented brand and forbidden words", () => {
  const bad = asFinal({ ...valid, detected: { brand: "Adidas", weight_kg: 16, material: null }, description: "Idealny na lata" });
  const failures = checkListing(bad, { nullFields: ["brand"], forbiddenWords: ["na lata"] });
  assert.equal(failures.length, 2);
});
