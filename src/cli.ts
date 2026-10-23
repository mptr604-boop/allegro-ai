import { parseArgs } from "node:util";
import { MODEL_ID } from "./config.ts";
import { generateListing } from "./listing.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { price: { type: "string", short: "p" } },
});

const [imagePath, ...noteParts] = positionals;
if (!imagePath) {
  console.error('Użycie: node src/cli.ts <zdjęcie> ["notatka"] [--price 150]');
  process.exit(1);
}

const pricePln = values.price ? Number(values.price.replace(",", ".")) : undefined;
if (pricePln !== undefined && !Number.isFinite(pricePln)) {
  console.error("--price musi być liczbą");
  process.exit(1);
}

console.log(`Pytam ${MODEL_ID}...`);

try {
  const { listing, usage, imageBytes } = await generateListing({
    imagePath,
    note: noteParts.join(" "),
    pricePln,
  });
  console.log(JSON.stringify(listing, null, 2));
  console.log(`zdjęcie: ${(imageBytes / 1024).toFixed(0)} KB, tokeny: ${usage.inputTokens} -> ${usage.outputTokens}`);
} catch (err) {
  const e = err as { statusCode?: number; message?: string };
  console.error(`Błąd ${e.statusCode ?? ""}: ${e.message ?? err}`);
  process.exit(1);
}
