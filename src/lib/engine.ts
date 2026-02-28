import type { ClaimClass, Profile, RiskLevel } from "../domain/types";
import { makeId } from "./id";

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

const claimText = (year: number, type: ClaimClass): string => {
  switch (type) {
    case "event":
      return `${year}: Structural shift around work, money, or family responsibility.`;
    case "decision":
      return `${year}: Important personal decision with long-term impact.`;
    case "descriptor":
      return `${year}: Mental and external pace changed noticeably.`;
    case "stabilization":
      return `${year}: Stabilization phase, routines dominated over major changes.`;
  }
};

export const assessRiskFromTob = (tobLocal: string): { riskLevel: RiskLevel; boundaryDistance: number } => {
  const minute = Number.parseInt(tobLocal.split(":")[1] ?? "0", 10);
  const distance = Number.isFinite(minute) ? Math.abs(30 - minute) : 30;
  if (distance <= 3) return { riskLevel: "high", boundaryDistance: distance };
  if (distance <= 8) return { riskLevel: "medium", boundaryDistance: distance };
  return { riskLevel: "safe", boundaryDistance: distance };
};

export const atmakarakaFromProfile = (profile: Profile): { planet: string; narrativeKey: string; resonanceQuestion: string } => {
  const seed = `${profile.dob}-${profile.tobLocal}-${profile.pobText}`;
  const index = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PLANETS.length;
  const planet = PLANETS[index];
  return {
    planet,
    narrativeKey: `atma_${planet.toLowerCase()}`,
    resonanceQuestion: `Your Atmakaraka is ${planet}. Does this core life theme resonate with you?`,
  };
};

export const yearsForMode = (mode: "quick5y" | "full15y"): number[] => {
  const currentYear = new Date().getUTCFullYear();
  const span = mode === "quick5y" ? 5 : 15;
  return Array.from({ length: span }, (_, idx) => currentYear - (span - 1 - idx));
};

export const claimClassesForYear = (year: number): ClaimClass[] => {
  // Every 4th year marks stabilization; others use mixed claims.
  if (year % 4 === 0) return ["stabilization", "descriptor", "decision", "event"];
  return ["event", "decision", "descriptor", "event"];
};

export const makeClaimId = (): string => makeId("clm");

export const rectificationWindow = (tobLocal: string, answerCount: number) => {
  const [hRaw, mRaw] = tobLocal.split(":");
  const h = Number.parseInt(hRaw ?? "0", 10);
  const m = Number.parseInt(mRaw ?? "0", 10);
  const width = Math.max(10, 30 - answerCount);
  const startM = Math.max(0, m - width);
  const endM = Math.min(59, m + width);
  const pad = (v: number) => `${v}`.padStart(2, "0");
  return {
    windowStart: `${pad(h)}:${pad(startM)}`,
    windowEnd: `${pad(h)}:${pad(endM)}`,
    confidence: Math.min(0.95, 0.45 + answerCount * 0.08),
    effectiveTobLocal: `${pad(h)}:${pad(Math.round((startM + endM) / 2))}`,
  };
};

export const weeklyTheme = (weekStartUtc: string): string => {
  const week = new Date(weekStartUtc).getUTCDate();
  if (week % 3 === 0) return "Execution with discipline";
  if (week % 3 === 1) return "Relationship clarity and boundaries";
  return "Learning and strategic patience";
};

export const weeklyWindows = (weekStartUtc: string) => {
  const start = new Date(weekStartUtc);
  const mk = (days: number, startHour: number, endHour: number) => {
    const s = new Date(start);
    s.setUTCDate(s.getUTCDate() + days);
    s.setUTCHours(startHour, 0, 0, 0);
    const e = new Date(start);
    e.setUTCDate(e.getUTCDate() + days);
    e.setUTCHours(endHour, 0, 0, 0);
    return { startUtc: s.toISOString(), endUtc: e.toISOString() };
  };

  return {
    friction: [
      { ...mk(1, 5, 8), reason: "Moon-Saturn friction window" },
      { ...mk(4, 13, 16), reason: "Mars activation, avoid escalation" },
    ],
    support: [
      { ...mk(2, 9, 12), reason: "Jupiter supportive window" },
      { ...mk(5, 6, 9), reason: "Clear decision window" },
    ],
    muhurthaLite: [
      { purpose: "difficult_conversation", ...mk(3, 14, 16) },
      { purpose: "paperwork_submission", ...mk(6, 10, 12) },
    ],
  };
};

export { claimText };
