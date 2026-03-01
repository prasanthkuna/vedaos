import { APIError } from "encore.dev/api";

type WindowState = { start: number; count: number };

const windows = new Map<string, WindowState>();

export const enforceRateLimit = (key: string, maxCalls: number, windowMs: number): void => {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return;
  }

  if (current.count >= maxCalls) {
    throw APIError.resourceExhausted("rate_limited");
  }

  current.count += 1;
  windows.set(key, current);
};
