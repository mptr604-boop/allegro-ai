import type { FinalListing } from "./schema.ts";

export interface Expectations {
  // Fields in `detected` that must stay null (the photo/note does not reveal them).
  nullFields?: Array<"brand" | "weight_kg" | "material">;
  // Fields in `detected` that must be filled in (the photo/note clearly shows them).
  nonNullFields?: Array<"brand" | "weight_kg" | "material">;
  // Words that must not appear anywhere in the generated text.
  forbiddenWords?: string[];
  // Words that must appear in the generated text.
  requiredWords?: string[];
}

export function normalizeTitle(title: string): string {
  const t = title.trim().replace(/\s+/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function allText(l: FinalListing): string {
  return [l.title, l.description, ...l.highlights, ...l.tags].join(" ").toLowerCase();
}

// Returns a list of failures; an empty list means the listing passed.
export function checkListing(l: FinalListing, exp: Expectations = {}): string[] {
  const failures: string[] = [];
  if (l.title.length > 50) failures.push(`title too long (${l.title.length})`);
  for (const f of exp.nullFields ?? []) {
    if (l.detected[f] !== null) failures.push(`detected.${f} should be null, got ${l.detected[f]}`);
  }
  for (const f of exp.nonNullFields ?? []) {
    if (l.detected[f] === null) failures.push(`detected.${f} should be filled in, got null`);
  }
  const text = allText(l);
  for (const w of exp.forbiddenWords ?? []) {
    if (text.includes(w.toLowerCase())) failures.push(`forbidden word present: "${w}"`);
  }
  for (const w of exp.requiredWords ?? []) {
    if (!text.includes(w.toLowerCase())) failures.push(`required word missing: "${w}"`);
  }
  return failures;
}
