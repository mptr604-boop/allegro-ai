import { z } from "zod";

export const CONDITIONS = ["new", "like_new", "good", "used", "for_parts"] as const;

// What the model is allowed to produce. Price is deliberately absent: the seller supplies it.
export const ListingSchema = z.object({
  title: z.string().max(50).describe("Offer title, max 50 characters"),
  category: z.string().describe("Suggested Allegro category path"),
  condition: z.enum(CONDITIONS),
  detected: z
    .object({
      brand: z.string().nullable().describe("Brand only if clearly readable in the photo, else null"),
      weight_kg: z.number().nullable().describe("Weight only if printed/visible or given by the seller, else null"),
      material: z.string().nullable().describe("Material only if clearly visible, else null"),
    })
    .describe("Facts read from the photo or the seller note. Use null when unknown."),
  highlights: z.array(z.string()).min(2).max(6).describe("Selling points backed by the photo or the note"),
  description: z.string().describe("Plain-text description, 2-3 short paragraphs, no invented facts"),
  tags: z.array(z.string()).max(8),
  needs_seller_check: z
    .array(z.string())
    .describe("Things the seller should verify or add (e.g. missing weight, delivery terms)"),
});

export type Listing = z.infer<typeof ListingSchema>;
export type FinalListing = Listing & { price_pln: number | null };
