export const isoWeekStartUtc = (): string => {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
};
