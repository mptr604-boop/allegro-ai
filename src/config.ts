import "dotenv/config";
import { google } from "@ai-sdk/google";

export const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite-preview";
export const model = google(MODEL_ID);
