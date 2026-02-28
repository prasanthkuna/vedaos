import { randomUUID } from "crypto";

export const makeId = (prefix: string): string => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
