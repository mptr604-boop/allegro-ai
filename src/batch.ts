import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { MODEL_ID } from "./config.ts";
import { generateListing } from "./listing.ts";
import { listingToRow, toCsv } from "./export.ts";
import type { FinalListing } from "./schema.ts";

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

interface Meta {
  note?: string;
  price?: number;
}

async function readMeta(dir: string): Promise<Meta> {
  try {
    return JSON.parse(await readFile(join(dir, "meta.json"), "utf8")) as Meta;
  } catch {
    return {};
  }
}

const inputDir = resolve(process.argv[2] ?? "items");
const outDir = resolve(process.argv[3] ?? "out");

const folders = (await readdir(inputDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`Batch: ${folders.length} przedmiot(ów) z ${inputDir}, model ${MODEL_ID}\n`);

const rows: ReturnType<typeof listingToRow>[] = [];
const full: Record<string, FinalListing> = {};
const errors: string[] = [];
let inTokens = 0;
let outTokens = 0;

for (const [i, folder] of folders.entries()) {
  const dir = join(inputDir, folder);
  const images = (await readdir(dir)).filter((f) => IMAGE_EXT.test(f)).sort().map((f) => join(dir, f));
  if (images.length === 0) {
    console.log(`[${i + 1}/${folders.length}] ${folder}: brak zdjęć, pomijam`);
    continue;
  }
  const meta = await readMeta(dir);
  try {
    const { listing, usage } = await generateListing({ imagePath: images, note: meta.note, pricePln: meta.price });
    rows.push(listingToRow(folder, listing));
    full[folder] = listing;
    inTokens += usage.inputTokens ?? 0;
    outTokens += usage.outputTokens ?? 0;
    console.log(`[${i + 1}/${folders.length}] ${folder}: ${listing.title}`);
  } catch (err) {
    errors.push(folder);
    console.log(`[${i + 1}/${folders.length}] ${folder}: BŁĄD ${(err as Error).message.slice(0, 120)}`);
  }
  // Odstęp, żeby nie przekroczyć limitów zapytań na minutę w darmowym planie.
  await new Promise((r) => setTimeout(r, 4000));
}

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "listings.csv"), toCsv(rows));
await writeFile(join(outDir, "listings.json"), JSON.stringify(full, null, 2));

console.log(`\nGotowe: ${rows.length} OK, ${errors.length} z błędem. Tokeny: ${inTokens} -> ${outTokens}`);
console.log(`Zapisano: ${join(outDir, "listings.csv")} oraz listings.json`);
if (errors.length) console.log(`Do ponowienia: ${errors.join(", ")}`);
process.exit(errors.length ? 1 : 0);
