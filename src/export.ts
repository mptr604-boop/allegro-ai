import type { FinalListing } from "./schema.ts";

export function toCsv(rows: Array<Record<string, string | number | null>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
}

export function listingToRow(folder: string, l: FinalListing) {
  return {
    folder,
    title: l.title,
    price_pln: l.price_pln,
    condition: l.condition,
    category: l.category,
    brand: l.detected.brand,
    weight_kg: l.detected.weight_kg,
    material: l.detected.material,
    description: l.description,
    tags: l.tags.join("; "),
    to_check: l.needs_seller_check.join("; "),
  };
}
