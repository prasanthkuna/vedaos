export const isApiCode = (error: unknown, code: string): boolean =>
  error instanceof Error && error.message.toLowerCase().includes(code.toLowerCase());

export const readableError = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;
