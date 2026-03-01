import type { ClaimClass, Profile, RiskLevel } from "../domain/types";
import { makeId } from "./id";

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

const hash = (seed: string) => [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const pick = <T>(items: readonly T[], seed: string): T => items[Math.abs(hash(seed)) % items.length];

const claimText = (year: number, type: ClaimClass, seed: string): string => {
  const axis = pick(["career", "finances", "family responsibilities", "partnership dynamics", "location and home"], `${seed}-axis-${year}`);
  const tone = pick(["sudden", "steady", "pressure-driven", "discipline-led", "supportive"], `${seed}-tone-${year}`);
  switch (type) {
    case "event":
      return `${year}: ${tone} structural shift around ${axis}.`;
    case "decision":
      return `${year}: A long-horizon decision around ${axis}.`;
    case "descriptor":
      return `${year}: The mental and external pace around ${axis} changed noticeably.`;
    case "stabilization":
      return `${year}: Stabilization phase for ${axis}; routines dominated over major changes.`;
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

const HOUSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"] as const;
const DASHA_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;

const pickHouse = (seed: string) => pick(HOUSES, `${seed}-house`);
const pickDasha = (seed: string) => ({
  md: pick(DASHA_LORDS, `${seed}-md`),
  ad: pick(DASHA_LORDS, `${seed}-ad`),
  pd: pick(DASHA_LORDS, `${seed}-pd`),
});

export const claimEvidence = (year: number, type: ClaimClass, seed: string): { whyLite: string[]; triggerFlags: string[] } => {
  const house = pickHouse(`${seed}-${year}-${type}`);
  const dasha = pickDasha(`${seed}-${year}-${type}`);
  const transits = type === "stabilization" ? ["saturn_jupiter_hold"] : ["saturn_jupiter_support", "rahu_ketu_axis"];
  const weekly = year % 2 === 0 ? "moon_trigger" : "mars_trigger";

  const reasons =
    type === "stabilization"
      ? [
          `MD/AD/PD ${dasha.md}-${dasha.ad}-${dasha.pd} sustained routine outcomes.`,
          `Saturn and Jupiter support on ${house} favored consolidation over disruption.`,
        ]
      : [
          `MD/AD/PD ${dasha.md}-${dasha.ad}-${dasha.pd} activated ${house} themes.`,
          `Transit context included ${transits.join(" + ")} with ${weekly} refinement.`,
        ];

  return {
    whyLite: reasons,
    triggerFlags: ["md_ad_pd", ...transits, weekly, `house_${house.replace("th", "")}`],
  };
};

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

type JourneyMode = "quick5y" | "full15y";
type PhaseLevel = "md" | "ad" | "pd";

export type PhaseSegment = {
  phaseSegmentId: string;
  level: PhaseLevel;
  mdLord: string;
  adLord?: string;
  pdLord?: string;
  startUtc: string;
  endUtc: string;
  ord: number;
  confidenceBand: "high" | "medium" | "low";
  highlights: Array<{
    phaseHighlightId: string;
    title: string;
    detail: string;
    triggerType: string;
    triggerRef?: string;
  }>;
};

const addMonths = (d: Date, months: number): Date => {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
};

const formatPhaseTitle = (md: string, ad: string, pd: string): string => `${md} Mahadasha - ${ad} Antardasha - ${pd} Pratyantar`;

const makePhaseHighlights = (seed: string, md: string, ad: string, pd: string, idx: number) => {
  const house = pickHouse(`${seed}-phase-${idx}`);
  const trigger = idx % 2 === 0 ? "saturn_jupiter_double_transit" : "moon_mars_trigger";

  return [
    {
      phaseHighlightId: makeId("phh"),
      title: formatPhaseTitle(md, ad, pd),
      detail:
        trigger === "saturn_jupiter_double_transit"
          ? `Saturn and Jupiter jointly emphasized ${house} house themes, creating structural movement.`
          : `Moon and Mars trigger windows intensified ${house} house outcomes in short bursts.`,
      triggerType: trigger,
      triggerRef: house,
    },
  ];
};

export const phaseSegmentsForMode = (mode: JourneyMode, seed: string): {
  startUtc: string;
  endUtc: string;
  asOfUtc: string;
  segments: PhaseSegment[];
  active: { mdLord: string; adLord: string; pdLord: string; startUtc: string; endUtc: string };
} => {
  const now = new Date();
  const spanYears = mode === "quick5y" ? 5 : 15;
  const segmentCount = mode === "quick5y" ? 10 : 30;
  const segmentMonths = Math.max(3, Math.floor((spanYears * 12) / segmentCount));
  const start = addMonths(now, -(segmentMonths * segmentCount));
  const segments: PhaseSegment[] = [];

  for (let i = 0; i < segmentCount; i += 1) {
    const segStart = addMonths(start, i * segmentMonths);
    const segEnd = addMonths(start, (i + 1) * segmentMonths);
    const md = pick(DASHA_LORDS, `${seed}-md-${i}`);
    const ad = pick(DASHA_LORDS, `${seed}-ad-${i}`);
    const pd = pick(DASHA_LORDS, `${seed}-pd-${i}`);
    const confidenceBand = i % 5 === 0 ? "high" : i % 3 === 0 ? "medium" : "high";

    segments.push({
      phaseSegmentId: makeId("phs"),
      level: "pd",
      mdLord: md,
      adLord: ad,
      pdLord: pd,
      startUtc: segStart.toISOString(),
      endUtc: segEnd.toISOString(),
      ord: i + 1,
      confidenceBand,
      highlights: makePhaseHighlights(seed, md, ad, pd, i),
    });
  }

  const active = segments[Math.max(0, segments.length - 1)];
  return {
    startUtc: segments[0]?.startUtc ?? start.toISOString(),
    endUtc: segments[segments.length - 1]?.endUtc ?? now.toISOString(),
    asOfUtc: now.toISOString(),
    segments,
    active: {
      mdLord: active?.mdLord ?? "Saturn",
      adLord: active?.adLord ?? "Mercury",
      pdLord: active?.pdLord ?? "Moon",
      startUtc: active?.startUtc ?? now.toISOString(),
      endUtc: active?.endUtc ?? now.toISOString(),
    },
  };
};

export const phaseNextStep = (
  birthTimeInputMode: "exact_time" | "six_window_approx" | "nakshatra_only" | "unknown",
  rectificationCompleted: boolean,
) => {
  if (birthTimeInputMode === "exact_time") return "proceed" as const;
  if (rectificationCompleted) return "rectification_optional" as const;
  return "rectification_required" as const;
};

export { claimText };
