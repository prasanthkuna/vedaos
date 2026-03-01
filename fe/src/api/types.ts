export type StoryPoint = {
  claimId: string;
  text: string;
  weightClass: "event" | "decision" | "descriptor" | "stabilization";
  confidenceScore: number;
  whyLite?: string[];
  whyFullAvailable?: boolean;
};

export type NextStep = "proceed" | "rectification_required" | "rectification_optional";

export type UnlockDTO = {
  quickProofEligible: boolean;
  futureUnlocked: boolean;
  reasons: string[];
  nextSteps?: string[];
};

export type StoryFeed = {
  engineVersion?: string;
  mode: "quick5y" | "full15y";
  years: Array<{ year: number; points: StoryPoint[] }>;
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
};

export type ScoreDTO = {
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  futureUnlocked: boolean;
  unlock: UnlockDTO;
};

export type StoryResponse = {
  runId: string;
  feed: StoryFeed;
  quickProof?: {
    eligibleForExpansion: boolean;
    guardrails: {
      minValidatedCount: number;
      minYearCoverage: number;
      minDiversityScore: number;
      highRiskNeedsRectification: boolean;
    };
  } | null;
};

export type AtmakarakaPrimer = {
  planet: string;
  narrativeKey: string;
  resonanceQuestion: string;
};

export type WeeklyDTO = {
  weekStartUtc: string;
  theme: string;
  provider?: string;
  promptVersion?: string;
  frictionWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  supportWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  muhurthaLite?: Array<{ purpose: string; startUtc: string; endUtc: string }>;
  upaya?: { title: string; instruction: string; disclaimerKey: string } | null;
};

export type ForecastDTO = {
  provider?: string;
  promptVersion?: string;
  summary: string;
  windows: Array<{ period: string; theme: string }>;
};

export type HomeV2DTO = {
  nextStep: NextStep;
  today: {
    cosmicSnapshot: {
      rashi: string;
      nakshatra: string;
      activePhase: string;
    };
    nowActivePhase: {
      md: string;
      ad: string;
      pd: string;
      startUtc: string;
      endUtc: string;
    };
    windows: {
      support: Array<{ startUtc: string; endUtc: string; reason: string }>;
      caution: Array<{ startUtc: string; endUtc: string; reason: string }>;
    };
    upaya: {
      title: string;
      instruction: string;
    };
    upcomingShift: { startsAtUtc: string; phase: string } | null;
  };
};

export type JourneySegment = {
  segmentId: string;
  level: "pd" | "ad" | "md";
  md: string;
  ad: string | null;
  pd: string | null;
  startUtc: string;
  endUtc: string;
  confidenceBand: "high" | "medium" | "low";
  narrative: {
    phaseMeaning: string;
    likelyManifestation: string;
    caution: string;
    action: string;
    timingReference: string;
  };
  keyTransitTriggers: Array<{ type: string; ref: string | null }>;
};

export type JourneyV2DTO = {
  phaseRunId: string;
  narrativeRunId: string;
  provider: string;
  journey: {
    engineVersion: string;
    mode: "quick5y" | "full15y";
    nextStep: NextStep;
    activePhaseRefs: { md: string; ad: string; pd: string; startUtc: string; endUtc: string };
    dateWindows: Array<{ segmentId: string; startUtc: string; endUtc: string }>;
    segments: JourneySegment[];
  };
};

export type MonthlyDTO = {
  monthTheme: string;
  supportWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  frictionWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  bestDates: string[];
  cautionDates: string[];
  monthlyUpaya: { title: string; instruction: string };
  phaseShifts: Array<{ startsAtUtc: string; phase: string }>;
};

export type ProfileSummary = {
  profileId: string;
  displayName: string;
  isGuestProfile: boolean;
  birthTimeRiskLevel: "safe" | "medium" | "high" | null;
  rectificationCompleted: boolean;
};
