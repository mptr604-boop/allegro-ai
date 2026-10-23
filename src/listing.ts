import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { generateText, Output } from "ai";
import { model } from "./config.ts";
import { normalizeTitle } from "./checks.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { ListingSchema, type FinalListing } from "./schema.ts";

const MEDIA_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export interface ListingInput {
  imagePath: string | string[];
  note?: string;
  pricePln?: number;
}

export async function generateListing({ imagePath, note, pricePln }: ListingInput) {
  const paths = Array.isArray(imagePath) ? imagePath : [imagePath];
  const images = await Promise.all(
    paths.map(async (p) => {
      const mediaType = MEDIA_TYPES[extname(p).toLowerCase()];
      if (!mediaType) throw new Error(`Obsługiwane formaty: jpg, png, webp (${p})`);
      return { data: await readFile(p), mediaType };
    }),
  );

  const { output, usage } = await generateText({
    model,
    maxRetries: 4,
    abortSignal: AbortSignal.timeout(180_000),
    temperature: 0.2,
    output: Output.object({ schema: ListingSchema }),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `Notatka sprzedawcy: ${note || "(brak)"}. Liczba zdjęć: ${images.length} (to ten sam przedmiot).` },
          ...images.map((i) => ({ type: "file" as const, data: i.data, mediaType: i.mediaType })),
        ],
      },
    ],
  });

  const listing: FinalListing = {
    ...output,
    title: normalizeTitle(output.title),
    price_pln: pricePln ?? null,
  };
  return { listing, usage, imageBytes: images.reduce((s, i) => s + i.data.length, 0) };
}
