import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { MODEL_ID } from "../src/config.ts";
import { checkListing, type Expectations } from "../src/checks.ts";
import { generateListing } from "../src/listing.ts";

interface EvalCase {
  name: string;
  image: string | string[]; // path(s) relative to the cases file
  note?: string;
  expect?: Expectations;
}

const casesPath = resolve(process.argv[2] ?? "evals/cases.json");
const cases: EvalCase[] = JSON.parse(await readFile(casesPath, "utf8"));

console.log(`Eval: ${cases.length} case(s) on ${MODEL_ID}\n`);

let failed = 0;
for (const c of cases) {
  try {
    const base = dirname(casesPath);
    const paths = [c.image].flat().map((p) => resolve(base, p));
    const { listing } = await generateListing({ imagePath: paths, note: c.note });
    const failures = checkListing(listing, c.expect);
    if (failures.length) failed++;
    console.log(`${failures.length ? "FAIL" : "PASS"}  ${c.name}  detected=${JSON.stringify(listing.detected)}`);
    for (const f of failures) console.log(`      - ${f}`);
  } catch (err) {
    failed++;
    console.log(`ERROR ${c.name}: ${(err as Error).message}`);
  }
  // Stay well below free-tier per-minute limits.
  await new Promise((r) => setTimeout(r, 4000));
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
