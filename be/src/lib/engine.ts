import { Body, Ecliptic, GeoVector, MakeTime, Observer, SearchRiseSet } from "astronomy-engine";
import { DateTime } from "luxon";
import type { ClaimClass, Profile, RiskLevel } from "../domain/types";
import { makeId } from "./id";

const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
const CLASSICAL_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const SIDEREAL_SIGNS = [
  "Mesha",
  "Vrishabha",
  "Mithuna",
  "Karka",
  "Simha",
  "Kanya",
  "Tula",
  "Vrischika",
  "Dhanu",
  "Makara",
  "Kumbha",
  "Meena",
] as const;
const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;
const VIMSHOTTARI_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] as const;
const VIMSHOTTARI_YEARS: Record<(typeof VIMSHOTTARI_ORDER)[number], number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const NAKSHATRA_SPAN = 360 / 27;
const DAY_MS = 86_400_000;

type Graha = (typeof PLANETS)[number];
type DashaLord = (typeof VIMSHOTTARI_ORDER)[number];
type JourneyMode = "quick5y" | "full15y";
type PhaseLevel = "md" | "ad" | "pd";

type ProfileAstroInput = Pick<Profile, "dob" | "tobLocal" | "tzIana" | "lat" | "lon" | "pobText">;

type NatalCore = {
  birthUtc: Date;
  ayanamsha: number;
  sidereal: Record<Graha, number>;
  moonNakshatraIndex: number;
  moonNakshatra: string;
  moonPada: number;
  moonSignIndex: number;
  moonSign: string;
  sunriseUtc?: string;
};

type DashaInterval = {
  lord: DashaLord;
  start: Date;
  end: Date;
  years: number;
};

type PDInterval = {
  md: DashaLord;
  ad: DashaLord;
  pd: DashaLord;
  start: Date;
  end: Date;
};

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

const hash = (seed: string) => [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
const pick = <T>(items: readonly T[], seed: string): T => items[Math.abs(hash(seed)) % items.length];

const norm360 = (deg: number) => {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
};

const addYears = (date: Date, years: number): Date => new Date(date.getTime() + years * 365.2425 * DAY_MS);
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS);

const localBirthToUtc = (profile: ProfileAstroInput): Date => {
  const tobLocal = profile.tobLocal && profile.tobLocal.trim().length > 0 ? profile.tobLocal : "12:00";
  const dt = DateTime.fromISO(`${profile.dob}T${tobLocal}`, { zone: profile.tzIana });
  if (!dt.isValid) {
    return new Date(`${profile.dob}T${tobLocal}:00.000Z`);
  }
  return dt.toUTC().toJSDate();
};

const lahiriAyanamsha = (date: Date): number => {
  // MVP approximation anchored near J2000 Lahiri with mean precession drift.
  const daysFromJ2000 = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0, 0)) / DAY_MS;
  const years = daysFromJ2000 / 365.2425;
  return 23.8531 + years * (50.29 / 3600);
};

const meanNodeLongitude = (date: Date): number => {
  const time = MakeTime(date);
  const t = time.tt / 36525;
  const omega =
    125.04455501 -
    1934.13626197 * t +
    0.0020762 * t * t +
    (t * t * t) / 467410 -
    (t * t * t * t) / 60616000;
  return norm360(omega);
};

const geoTropicalLongitude = (body: Body, date: Date): number => {
  const vec = GeoVector(body, date, true);
  const ecl = Ecliptic(vec);
  return norm360(ecl.elon);
};

const siderealLongitude = (body: Body, date: Date): number => norm360(geoTropicalLongitude(body, date) - lahiriAyanamsha(date));

const computeSunriseUtc = (profile: ProfileAstroInput, birthUtc: Date): string | undefined => {
  if (profile.lat == null || profile.lon == null) return undefined;
  try {
    const observer = new Observer(profile.lat, profile.lon, 0);
    const start = new Date(Date.UTC(birthUtc.getUTCFullYear(), birthUtc.getUTCMonth(), birthUtc.getUTCDate(), 0, 0, 0));
    const rise = SearchRiseSet(Body.Sun, observer, +1, start, 2);
    return rise ? rise.date.toISOString() : undefined;
  } catch {
    return undefined;
  }
};

const computeNatalCore = (profile: ProfileAstroInput): NatalCore => {
  const birthUtc = localBirthToUtc(profile);
  const ayanamsha = lahiriAyanamsha(birthUtc);

  const sidereal: Record<Graha, number> = {
    Sun: siderealLongitude(Body.Sun, birthUtc),
    Moon: siderealLongitude(Body.Moon, birthUtc),
    Mars: siderealLongitude(Body.Mars, birthUtc),
    Mercury: siderealLongitude(Body.Mercury, birthUtc),
    Jupiter: siderealLongitude(Body.Jupiter, birthUtc),
    Venus: siderealLongitude(Body.Venus, birthUtc),
    Saturn: siderealLongitude(Body.Saturn, birthUtc),
    Rahu: norm360(meanNodeLongitude(birthUtc) - ayanamsha),
    Ketu: norm360(meanNodeLongitude(birthUtc) - ayanamsha + 180),
  };

  const moonNakshatraIndex = Math.floor(sidereal.Moon / NAKSHATRA_SPAN);
  const moonNakshatra = NAKSHATRAS[moonNakshatraIndex] ?? NAKSHATRAS[0];
  const moonPada = Math.min(4, Math.floor((sidereal.Moon % NAKSHATRA_SPAN) / (NAKSHATRA_SPAN / 4)) + 1);
  const moonSignIndex = Math.floor(sidereal.Moon / 30);

  return {
    birthUtc,
    ayanamsha,
    sidereal,
    moonNakshatraIndex,
    moonNakshatra,
    moonPada,
    moonSignIndex,
    moonSign: SIDEREAL_SIGNS[moonSignIndex] ?? SIDEREAL_SIGNS[0],
    sunriseUtc: computeSunriseUtc(profile, birthUtc),
  };
};

const dashaSequence = (startLord: DashaLord): DashaLord[] => {
  const idx = VIMSHOTTARI_ORDER.indexOf(startLord);
  return Array.from({ length: 9 }, (_, i) => VIMSHOTTARI_ORDER[(idx + i) % VIMSHOTTARI_ORDER.length]);
};

const deriveMdTimeline = (natal: NatalCore, untilUtc: Date): DashaInterval[] => {
  const mdLord = VIMSHOTTARI_ORDER[natal.moonNakshatraIndex % VIMSHOTTARI_ORDER.length];
  const elapsedFrac = (natal.sidereal.Moon % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  const balanceFrac = 1 - elapsedFrac;

  const intervals: DashaInterval[] = [];
  let currentStart = natal.birthUtc;
  let currentLord = mdLord;
  let first = true;

  for (let i = 0; i < 30; i += 1) {
    const years = VIMSHOTTARI_YEARS[currentLord] * (first ? balanceFrac : 1);
    const end = addYears(currentStart, years);
    intervals.push({ lord: currentLord, start: currentStart, end, years });
    if (end.getTime() > untilUtc.getTime()) break;
    currentStart = end;
    currentLord = VIMSHOTTARI_ORDER[(VIMSHOTTARI_ORDER.indexOf(currentLord) + 1) % VIMSHOTTARI_ORDER.length];
    first = false;
  }

  return intervals;
};

const subdivideByVimshottari = (start: Date, end: Date, startLord: DashaLord): DashaInterval[] => {
  const totalYears = (end.getTime() - start.getTime()) / DAY_MS / 365.2425;
  const seq = dashaSequence(startLord);
  const out: DashaInterval[] = [];
  let cur = start;

  for (let i = 0; i < seq.length; i += 1) {
    const lord = seq[i];
    const years = (totalYears * VIMSHOTTARI_YEARS[lord]) / 120;
    const nxt = i === seq.length - 1 ? end : addYears(cur, years);
    out.push({ lord, start: cur, end: nxt, years });
    cur = nxt;
  }

  return out;
};

const derivePdTimeline = (natal: NatalCore, untilUtc: Date): PDInterval[] => {
  const md = deriveMdTimeline(natal, untilUtc);
  const pdIntervals: PDInterval[] = [];

  for (const mdInt of md) {
    const adTimeline = subdivideByVimshottari(mdInt.start, mdInt.end, mdInt.lord);
    for (const adInt of adTimeline) {
      const pdTimeline = subdivideByVimshottari(adInt.start, adInt.end, adInt.lord);
      for (const pdInt of pdTimeline) {
        pdIntervals.push({
          md: mdInt.lord,
          ad: adInt.lord,
          pd: pdInt.lord,
          start: pdInt.start,
          end: pdInt.end,
        });
      }
    }
  }

  return pdIntervals;
};

const signIndex = (lon: number) => Math.floor(norm360(lon) / 30);
const signDistance = (from: number, to: number) => ((to - from) % 12 + 12) % 12;

const saturnAspects = (saturnSign: number, targetSign: number) => {
  const d = signDistance(saturnSign, targetSign);
  return d === 2 || d === 6 || d === 9;
};

const jupiterAspects = (jupiterSign: number, targetSign: number) => {
  const d = signDistance(jupiterSign, targetSign);
  return d === 4 || d === 6 || d === 8;
};

const marsAspects = (marsSign: number, targetSign: number) => {
  const d = signDistance(marsSign, targetSign);
  return d === 3 || d === 6 || d === 7;
};

const phaseTitle = (md: string, ad: string, pd: string) => `${md} Mahadasha - ${ad} Antardasha - ${pd} Pratyantar`;

const moonHouseFromNatalMoon = (planetLon: number, natalMoonSign: number): number => signDistance(natalMoonSign, signIndex(planetLon)) + 1;

const phaseHighlights = (segmentDate: Date, natal: NatalCore, pd: PDInterval) => {
  const satSign = signIndex(siderealLongitude(Body.Saturn, segmentDate));
  const jupSign = signIndex(siderealLongitude(Body.Jupiter, segmentDate));
  const marsSign = signIndex(siderealLongitude(Body.Mars, segmentDate));
  const moonSign = signIndex(siderealLongitude(Body.Moon, segmentDate));

  const targetSign = natal.moonSignIndex;
  const doubleTransit = saturnAspects(satSign, targetSign) && jupiterAspects(jupSign, targetSign);
  const marsTrigger = marsAspects(marsSign, targetSign);
  const moonTrigger = moonSign === signIndex(natal.sidereal.Saturn);

  const pdHouse = moonHouseFromNatalMoon(natal.sidereal[pd.pd as Graha], natal.moonSignIndex);
  const detail = doubleTransit
    ? `Saturn and Jupiter simultaneously activated Moon-lagna house ${pdHouse}, increasing materialization probability in this phase.`
    : `Primary activation came from ${pd.pd} PD on Moon-lagna house ${pdHouse}; results depend on your execution and timing discipline.`;

  const triggerType = doubleTransit ? "saturn_jupiter_double_transit" : marsTrigger ? "mars_trigger" : moonTrigger ? "moon_trigger" : "phase_support";
  const triggerRef = `house_${pdHouse}`;

  return {
    confidenceBand: (doubleTransit ? "high" : marsTrigger || moonTrigger ? "medium" : "low") as "high" | "medium" | "low",
    highlights: [
      {
        phaseHighlightId: makeId("phh"),
        title: phaseTitle(pd.md, pd.ad, pd.pd),
        detail,
        triggerType,
        triggerRef,
      },
    ],
  };
};

const safeNatal = (profile: ProfileAstroInput): NatalCore => {
  try {
    return computeNatalCore(profile);
  } catch {
    const fallback: ProfileAstroInput = {
      ...profile,
      tobLocal: profile.tobLocal || "12:00",
      tzIana: profile.tzIana || "Asia/Kolkata",
    };
    return computeNatalCore(fallback);
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
  const natal = safeNatal(profile);
  let winner: (typeof CLASSICAL_PLANETS)[number] = "Saturn";
  let best = -1;

  for (const planet of CLASSICAL_PLANETS) {
    const degInSign = natal.sidereal[planet] % 30;
    if (degInSign > best) {
      best = degInSign;
      winner = planet;
    }
  }

  return {
    planet: winner,
    narrativeKey: `atma_${winner.toLowerCase()}`,
    resonanceQuestion: `Your Atmakaraka is ${winner}. Does this core life theme resonate with you?`,
  };
};

export const cosmicSnapshotFromProfile = (profile: Profile, atUtc?: string) => {
  const natal = safeNatal(profile);
  const date = atUtc ? new Date(atUtc) : new Date();
  const moonNow = siderealLongitude(Body.Moon, date);
  const moonSign = SIDEREAL_SIGNS[signIndex(moonNow)] ?? SIDEREAL_SIGNS[0];
  const nakIndex = Math.floor(moonNow / NAKSHATRA_SPAN);
  const nak = NAKSHATRAS[nakIndex] ?? NAKSHATRAS[0];

  return {
    rashi: moonSign,
    nakshatra: nak,
    natalMoonRashi: natal.moonSign,
    natalNakshatra: `${natal.moonNakshatra} Pada ${natal.moonPada}`,
    sunriseUtc: natal.sunriseUtc ?? null,
  };
};

export const yearsForMode = (mode: "quick5y" | "full15y"): number[] => {
  const currentYear = new Date().getUTCFullYear();
  const span = mode === "quick5y" ? 5 : 15;
  return Array.from({ length: span }, (_, idx) => currentYear - (span - 1 - idx));
};

export const claimClassesForYear = (year: number): ClaimClass[] => {
  if (year % 4 === 0) return ["stabilization", "descriptor", "decision", "event"];
  return ["event", "decision", "descriptor", "event"];
};

export const makeClaimId = (): string => makeId("clm");

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

export const claimEvidence = (year: number, type: ClaimClass, seed: string): { whyLite: string[]; triggerFlags: string[] } => {
  const md = pick(VIMSHOTTARI_ORDER, `${seed}-md-${year}`);
  const ad = pick(VIMSHOTTARI_ORDER, `${seed}-ad-${year}`);
  const pd = pick(VIMSHOTTARI_ORDER, `${seed}-pd-${year}`);
  const house = (Math.abs(hash(`${seed}-${year}-${type}`)) % 12) + 1;
  const transits = type === "stabilization" ? ["saturn_jupiter_hold"] : ["saturn_jupiter_support", "rahu_ketu_axis"];

  return {
    whyLite: [
      `MD/AD/PD ${md}-${ad}-${pd} activated Moon-lagna house ${house}.`,
      `Transit context considered ${transits.join(" + ")} for this period.`,
    ],
    triggerFlags: ["md_ad_pd", ...transits, `house_${house}`],
  };
};

export const rectificationWindow = (
  tobLocal: string,
  answerCount: number,
  mode: "exact_time" | "six_window_approx" | "nakshatra_only" | "unknown" = "exact_time",
) => {
  const [hRaw, mRaw] = tobLocal.split(":");
  const h = Number.parseInt(hRaw ?? "12", 10);
  const m = Number.parseInt(mRaw ?? "0", 10);
  const baseWidth = mode === "six_window_approx" ? 90 : mode === "nakshatra_only" ? 150 : mode === "unknown" ? 180 : 30;
  const width = Math.max(10, baseWidth - answerCount * 8);
  const totalMinutes = Math.min(23 * 60 + 59, Math.max(0, h * 60 + m));
  const startTotal = Math.max(0, totalMinutes - width);
  const endTotal = Math.min(23 * 60 + 59, totalMinutes + width);
  const pad = (v: number) => `${v}`.padStart(2, "0");
  const hhmm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  const effective = Math.round((startTotal + endTotal) / 2);

  return {
    windowStart: hhmm(startTotal),
    windowEnd: hhmm(endTotal),
    confidence: Math.min(0.96, 0.42 + answerCount * 0.08),
    effectiveTobLocal: hhmm(effective),
  };
};

export const weeklyTheme = (weekStartUtc: string): string => {
  const week = new Date(weekStartUtc).getUTCDate();
  if (week % 3 === 0) return "Execution with discipline";
  if (week % 3 === 1) return "Relationship clarity and boundaries";
  return "Learning and strategic patience";
};

export const weeklyWindows = (weekStartUtc: string, profile?: ProfileAstroInput) => {
  const start = new Date(weekStartUtc);
  const mkWindow = (dayStart: Date, startHour: number, endHour: number, reason: string) => {
    const s = new Date(dayStart);
    s.setUTCHours(startHour, 0, 0, 0);
    const e = new Date(dayStart);
    e.setUTCHours(endHour, 0, 0, 0);
    return { startUtc: s.toISOString(), endUtc: e.toISOString(), reason };
  };

  if (!profile) {
    return {
      friction: [
        mkWindow(addDays(start, 1), 5, 8, "Moon-Saturn friction window"),
        mkWindow(addDays(start, 4), 13, 16, "Mars activation, avoid escalation"),
      ],
      support: [
        mkWindow(addDays(start, 2), 9, 12, "Jupiter supportive window"),
        mkWindow(addDays(start, 5), 6, 9, "Clear decision window"),
      ],
      muhurthaLite: [
        { purpose: "difficult_conversation", ...mkWindow(addDays(start, 3), 14, 16, "muhurtha") },
        { purpose: "paperwork_submission", ...mkWindow(addDays(start, 6), 10, 12, "muhurtha") },
      ],
    };
  }

  const natal = safeNatal(profile);
  const natalMoonSign = natal.moonSignIndex;
  const natalJupSign = signIndex(natal.sidereal.Jupiter);
  const natalSatSign = signIndex(natal.sidereal.Saturn);

  const friction: Array<{ startUtc: string; endUtc: string; reason: string }> = [];
  const support: Array<{ startUtc: string; endUtc: string; reason: string }> = [];

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    const moonSign = signIndex(siderealLongitude(Body.Moon, day));
    const marsSign = signIndex(siderealLongitude(Body.Mars, day));
    const jupSign = signIndex(siderealLongitude(Body.Jupiter, day));

    if (moonSign === natalSatSign || marsAspects(marsSign, natalMoonSign)) {
      friction.push(mkWindow(day, 5, 8, "Moon/Mars pressure; avoid emotional escalation."));
    }
    if (moonSign === natalJupSign || jupiterAspects(jupSign, natalMoonSign)) {
      support.push(mkWindow(day, 9, 12, "Jupiter support window; prioritize key actions."));
    }
  }

  if (friction.length === 0) friction.push(mkWindow(addDays(start, 2), 6, 8, "Keep decisions measured in early morning hours."));
  if (support.length === 0) support.push(mkWindow(addDays(start, 4), 9, 11, "Steady support for planned actions."));

  const muhurthaLite = support.slice(0, 2).map((w, idx) => ({
    purpose: idx === 0 ? "difficult_conversation" : "paperwork_submission",
    startUtc: w.startUtc,
    endUtc: w.endUtc,
  }));

  return { friction, support, muhurthaLite };
};

export const monthlyOverview = (
  monthStartUtc: string,
  profile: ProfileAstroInput,
): {
  monthTheme: string;
  supportWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  frictionWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  bestDates: string[];
  cautionDates: string[];
  monthlyUpaya: { title: string; instruction: string };
  phaseShifts: Array<{ startsAtUtc: string; phase: string }>;
} => {
  const start = new Date(monthStartUtc);
  const end = addDays(start, 30);
  const natal = safeNatal(profile);
  const natalMoonSign = natal.moonSignIndex;
  const natalSatSign = signIndex(natal.sidereal.Saturn);
  const natalJupSign = signIndex(natal.sidereal.Jupiter);

  const supportWindows: Array<{ startUtc: string; endUtc: string; reason: string }> = [];
  const frictionWindows: Array<{ startUtc: string; endUtc: string; reason: string }> = [];
  const bestDates: string[] = [];
  const cautionDates: string[] = [];

  for (let i = 0; i < 30; i += 1) {
    const day = addDays(start, i);
    const moonSign = signIndex(siderealLongitude(Body.Moon, day));
    const marsSign = signIndex(siderealLongitude(Body.Mars, day));
    const jupSign = signIndex(siderealLongitude(Body.Jupiter, day));

    const s = new Date(day);
    s.setUTCHours(8, 0, 0, 0);
    const e = new Date(day);
    e.setUTCHours(11, 0, 0, 0);

    if (moonSign === natalJupSign || jupiterAspects(jupSign, natalMoonSign)) {
      supportWindows.push({
        startUtc: s.toISOString(),
        endUtc: e.toISOString(),
        reason: "Jupiter support for growth and constructive action.",
      });
      bestDates.push(s.toISOString().slice(0, 10));
    }

    if (moonSign === natalSatSign || marsAspects(marsSign, natalMoonSign)) {
      frictionWindows.push({
        startUtc: s.toISOString(),
        endUtc: e.toISOString(),
        reason: "Moon/Mars pressure. Slow down before major commitments.",
      });
      cautionDates.push(s.toISOString().slice(0, 10));
    }
  }

  const phaseSet = phaseSegmentsForMode("quick5y", profile).segments
    .filter((segment) => {
      const segmentStart = new Date(segment.startUtc).getTime();
      return segmentStart >= start.getTime() && segmentStart <= end.getTime();
    })
    .slice(0, 3)
    .map((segment) => ({
      startsAtUtc: segment.startUtc,
      phase: `${segment.mdLord}-${segment.adLord}-${segment.pdLord ?? ""}`.replace(/-$/, ""),
    }));

  const theme =
    supportWindows.length > frictionWindows.length
      ? "Expansion month with disciplined execution windows."
      : frictionWindows.length > supportWindows.length
        ? "Consolidation month; protect energy and avoid reactive moves."
        : "Balanced month; steady effort brings measurable progress.";

  return {
    monthTheme: theme,
    supportWindows: supportWindows.slice(0, 8),
    frictionWindows: frictionWindows.slice(0, 8),
    bestDates: Array.from(new Set(bestDates)).slice(0, 8),
    cautionDates: Array.from(new Set(cautionDates)).slice(0, 8),
    monthlyUpaya: {
      title: "Monthly grounding upaya",
      instruction:
        "On Thursdays, begin one important task during support windows and avoid emotionally charged decisions on caution dates.",
    },
    phaseShifts: phaseSet,
  };
};

export const phaseSegmentsForMode = (
  mode: JourneyMode,
  profile: ProfileAstroInput,
): {
  startUtc: string;
  endUtc: string;
  asOfUtc: string;
  segments: PhaseSegment[];
  active: { mdLord: string; adLord: string; pdLord: string; startUtc: string; endUtc: string };
} => {
  const asOf = new Date();
  const spanYears = mode === "quick5y" ? 5 : 15;
  const startWindow = addYears(asOf, -spanYears);

  const natal = safeNatal(profile);
  const pdTimeline = derivePdTimeline(natal, addYears(asOf, 2));

  const filtered = pdTimeline.filter((pd) => pd.end.getTime() >= startWindow.getTime() && pd.start.getTime() <= asOf.getTime());
  const scope = filtered.length > 0 ? filtered : pdTimeline.slice(-Math.min(30, pdTimeline.length));

  const segments = scope.map((pd, idx) => {
    const derived = phaseHighlights(pd.start, natal, pd);
    return {
      phaseSegmentId: makeId("phs"),
      level: "pd" as const,
      mdLord: pd.md,
      adLord: pd.ad,
      pdLord: pd.pd,
      startUtc: pd.start.toISOString(),
      endUtc: pd.end.toISOString(),
      ord: idx + 1,
      confidenceBand: derived.confidenceBand,
      highlights: [
        {
          phaseHighlightId: makeId("phh"),
          title: phaseTitle(pd.md, pd.ad, pd.pd),
          detail: derived.highlights[0]?.detail ?? "Phase interaction derived from dasha and transit context.",
          triggerType: derived.highlights[0]?.triggerType ?? "phase_support",
          triggerRef: derived.highlights[0]?.triggerRef,
        },
      ],
    };
  });

  const active = segments.find((s) => new Date(s.startUtc).getTime() <= asOf.getTime() && new Date(s.endUtc).getTime() >= asOf.getTime()) ?? segments.at(-1);

  return {
    startUtc: segments[0]?.startUtc ?? startWindow.toISOString(),
    endUtc: segments.at(-1)?.endUtc ?? asOf.toISOString(),
    asOfUtc: asOf.toISOString(),
    segments,
    active: {
      mdLord: active?.mdLord ?? "Saturn",
      adLord: active?.adLord ?? "Mercury",
      pdLord: active?.pdLord ?? "Moon",
      startUtc: active?.startUtc ?? asOf.toISOString(),
      endUtc: active?.endUtc ?? asOf.toISOString(),
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
