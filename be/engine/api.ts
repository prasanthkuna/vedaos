import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  assessRiskFromTob,
  atmakarakaFromProfile,
  claimEvidence,
  claimClassesForYear,
  claimText,
  makeClaimId,
  rectificationWindow,
  weeklyTheme,
  weeklyWindows,
  yearsForMode,
} from "../src/lib/engine";
import {
  getEntitlements,
  getProfileByUser,
  getRectificationPrompts as getRectificationPromptsRepo,
  getScores,
  saveRectification,
  saveStoryRun,
  setProfileRisk,
} from "../src/persistence/repo";
import { enforceRateLimit } from "../src/lib/rate-limit";

const assertProAccess = async (userId: string) => {
  const ent = await getEntitlements(userId);
  if (!ent || (!ent.pro_enabled && !ent.trial_active && ent.plan_code !== "family")) {
    throw APIError.permissionDenied("pro_required");
  }
};

export const assessRisk = api(
  { expose: true, method: "POST", path: "/engine/assess-risk" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`risk:${userId}`, 30, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const result = assessRiskFromTob(profile.rectifiedTobLocal ?? profile.tobLocal);
    await setProfileRisk(profile.profileId, result.riskLevel);

    return {
      riskLevel: result.riskLevel,
      boundaryDistance: result.boundaryDistance,
      rectificationRequired: result.riskLevel === "high",
      details: {
        method: "moon_boundary_proximity_v1",
        certaintyInput: profile.birthTimeCertainty,
      },
    };
  },
);

export const getAtmakarakaPrimer = api(
  { expose: true, method: "POST", path: "/engine/atmakaraka-primer" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`atmakaraka:${userId}`, 30, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    return atmakarakaFromProfile(profile);
  },
);

export const getRectificationPrompts = api(
  { expose: true, method: "GET", path: "/engine/rectification-prompts" },
  async (params: {
    authorization?: Header<"Authorization">;
    engineVersion?: string;
    languageCode?: "en" | "hi" | "te" | "ta" | "kn" | "ml";
  }) => {
    await requireUserId(params.authorization);
    const prompts = await getRectificationPromptsRepo(params.languageCode ?? "en");
    return {
      engineVersion: params.engineVersion ?? "v0.1",
      languageCode: params.languageCode ?? "en",
      prompts,
    };
  },
);

export const submitRectification = api(
  { expose: true, method: "POST", path: "/engine/submit-rectification" },
  async (params: {
    authorization?: Header<"Authorization">;
    profileId: string;
    answers: Array<{
      promptId: string;
      yn?: boolean;
      year?: number;
      quarter?: number;
      rangeStartYear?: number;
      rangeEndYear?: number;
      textValue?: string;
    }>;
  }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`rectification:${userId}`, 8, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const run = rectificationWindow(profile.tobLocal, params.answers.length);
    const saved = await saveRectification({
      profileId: profile.profileId,
      windowStart: run.windowStart,
      windowEnd: run.windowEnd,
      confidence: run.confidence,
      effectiveTobLocal: run.effectiveTobLocal,
      answers: params.answers,
    });

    return {
      rectRunId: saved.rectRunId,
      windowStart: run.windowStart,
      windowEnd: run.windowEnd,
      confidence: run.confidence,
      effectiveTobLocal: run.effectiveTobLocal,
    };
  },
);

export const generateStory = api(
  { expose: true, method: "POST", path: "/engine/generate-story" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; mode: "quick5y" | "full15y" }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`story:${userId}`, 12, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const years = yearsForMode(params.mode);

    const yearsPayload: Array<{
      year: number;
      points: Array<{
        claimId: string;
        text: string;
        weightClass: "event" | "decision" | "descriptor" | "stabilization";
        confidenceScore: number;
        whyLite: string[];
        whyFullAvailable: boolean;
      }>;
    }> = [];

    const claims: Array<{
      claimId: string;
      year: number;
      text: string;
      weightClass: "event" | "decision" | "descriptor" | "stabilization";
      confidenceScore: number;
      templateCode: string;
      triggerFlags: string[];
    }> = [];

    for (const year of years) {
      const classes = claimClassesForYear(year);
      const points = classes.map((weightClass, idx) => {
        const claimId = makeClaimId();
        const text = claimText(year, weightClass, `${profile.profileId}-${profile.dob}-${profile.tobLocal}`);
        const evidence = claimEvidence(year, weightClass, `${profile.profileId}-${profile.dob}-${profile.tobLocal}`);
        const point = {
          claimId,
          text,
          weightClass,
          confidenceScore: Math.max(50, 92 - idx * 8),
          whyLite: evidence.whyLite,
          whyFullAvailable: true,
        };

        claims.push({
          claimId,
          year,
          text,
          weightClass,
          confidenceScore: point.confidenceScore,
          templateCode: `tmp_${weightClass}_v1`,
          triggerFlags: evidence.triggerFlags,
        });

        return point;
      });

      yearsPayload.push({ year, points });
    }

    const score = await getScores(profile.profileId);

    const feed = {
      engineVersion: "v0.1",
      mode: params.mode,
      psa: score.psa,
      pcs: score.pcs,
      validatedCount: score.validatedCount,
      yearCoverage: score.yearCoverage,
      diversityScore: score.diversityScore,
      years: yearsPayload,
      present: null,
      future: null,
    };

    const run = await saveStoryRun({
      profileId: profile.profileId,
      mode: params.mode,
      engineVersion: "v0.1",
      years,
      feed,
      claims,
    });

    const quickProof =
      params.mode === "quick5y"
        ? {
            eligibleForExpansion:
              score.validatedCount >= 6 &&
              score.yearCoverage >= 3 &&
              score.diversityScore >= 50 &&
              !(profile.birthTimeRiskLevel === "high" && !profile.rectificationCompleted),
            guardrails: {
              minValidatedCount: 6,
              minYearCoverage: 3,
              minDiversityScore: 50,
              highRiskNeedsRectification: true,
            },
          }
        : null;

    return {
      runId: run.runId,
      feed,
      quickProof,
    };
  },
);

export const generateForecast12m = api(
  { expose: true, method: "POST", path: "/engine/generate-forecast-12m" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`forecast:${userId}`, 12, 60_000);
    await assertProAccess(userId);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");
    const score = await getScores(profile.profileId);
    const tone =
      score.psa >= 80 ? "momentum and confident execution" : score.psa >= 60 ? "measured progress and calibration" : "consolidation and patience";

    return {
      forecastRunId: `fct_${Date.now()}`,
      forecast: {
        summary: `12-month outlook tuned to your validated pattern strength (${tone}).`,
        windows: [
          { period: "Q1", theme: tone },
          { period: "Q2", theme: profile.birthTimeRiskLevel === "high" ? "verify major decisions before commitment" : "expansion with structure" },
          { period: "Q3", theme: score.diversityScore >= 50 ? "balanced growth across priorities" : "focus on one core axis" },
          { period: "Q4", theme: score.futureUnlocked ? "harvest and scale" : "stability and groundwork" },
        ],
      },
    };
  },
);

export const generateWeekly = api(
  { expose: true, method: "POST", path: "/engine/generate-weekly" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; weekStartUtc: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`weekly:${userId}`, 20, 60_000);
    await assertProAccess(userId);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    if (!profile.currentCity || profile.currentLat == null || profile.currentLon == null) {
      throw APIError.invalidArgument("current_city_required");
    }

    const windows = weeklyWindows(params.weekStartUtc);

    return {
      weekly: {
        weekStartUtc: params.weekStartUtc,
        theme: weeklyTheme(params.weekStartUtc),
        frictionWindows: windows.friction,
        supportWindows: windows.support,
        muhurthaLite: windows.muhurthaLite,
        upaya: {
          title: "Weekly grounding upaya",
          instruction: "Offer water to Surya in the morning and avoid reactive communication after sunset.",
          disclaimerKey: "upaya_non_guaranteed",
        },
      },
    };
  },
);
