import dotenv from "dotenv";
dotenv.config();

declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export const config = {
  baseUrl: process.env?.BASE_URL || "https://www.doctoralia.pe",
  concurrency: Number(process.env?.CONCURRENCY ?? 5),
  delayMs: Number(process.env?.DELAY_MS ?? 600),
  maxPagesPerSeed: Number(process.env?.MAX_PAGES_PER_SEED ?? 150),
  userAgent:
    process.env.USER_AGENT ||
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
} as const;


