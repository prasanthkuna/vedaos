import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  assessRiskFromTob,
  atmakarakaFromProfile,
  claimClassesForYear,
  claimText,
  makeClaimId,
  rectificationWindow,
  weeklyTheme,
  weeklyWindows,
  yearsForMode,
} from "../src/lib/engine";
import {
  getProfileByUser,
  getScores,
  saveRectification,
  saveStoryRun,
  setProfileRisk,
} from "../src/persistence/repo";

export const assessRisk = api(
  { expose: true, method: "POST", path: "/engine.assessRisk" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
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
  { expose: true, method: "POST", path: "/engine.getAtmakarakaPrimer" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    return atmakarakaFromProfile(profile);
  },
);

export const getRectificationPrompts = api(
  { expose: true, method: "GET", path: "/engine.getRectificationPrompts" },
  async (params: {
    authorization?: Header<"Authorization">;
    engineVersion?: string;
    languageCode?: "en" | "hi" | "te" | "ta" | "kn" | "ml";
  }) => {
    await requireUserId(params.authorization);
    return {
      engineVersion: params.engineVersion ?? "v0.1",
      languageCode: params.languageCode ?? "en",
      prompts: [
        { promptId: "job_shift", text: "Did you face a major job shift around a specific year?" },
        { promptId: "relocation", text: "Did relocation happen with strong pressure in any year?" },
        { promptId: "exam_result", text: "Was there a defining exam or certification period?" },
        { promptId: "family_responsibility", text: "Did family responsibility increase sharply in any period?" },
        { promptId: "financial_stress", text: "Did financial pressure peak in any narrow window?" },
      ],
    };
  },
);

export const submitRectification = api(
  { expose: true, method: "POST", path: "/engine.submitRectification" },
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
  { expose: true, method: "POST", path: "/engine.generateStory" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; mode: "quick5y" | "full15y" }) => {
    const userId = await requireUserId(params.authorization);
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
        const text = claimText(year, weightClass);
        const point = {
          claimId,
          text,
          weightClass,
          confidenceScore: Math.max(50, 92 - idx * 8),
          whyLite: ["Derived from MD/AD/PD overlap", "Transit support considered"],
          whyFullAvailable: true,
        };

        claims.push({
          claimId,
          year,
          text,
          weightClass,
          confidenceScore: point.confidenceScore,
          templateCode: `tmp_${weightClass}_v1`,
          triggerFlags: ["md-ad-pd", "transit_context"],
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

    return {
      runId: run.runId,
      feed,
    };
  },
);

export const generateForecast12m = api(
  { expose: true, method: "POST", path: "/engine.generateForecast12m" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    return {
      forecastRunId: `fct_${Date.now()}`,
      forecast: {
        summary: "12-month outlook generated from validated profile patterns.",
        windows: [
          { period: "Q1", theme: "reset and alignment" },
          { period: "Q2", theme: "execution and momentum" },
          { period: "Q3", theme: "relationship boundaries" },
          { period: "Q4", theme: "consolidation and gains" },
        ],
      },
    };
  },
);

export const generateWeekly = api(
  { expose: true, method: "POST", path: "/engine.generateWeekly" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; weekStartUtc: string }) => {
    const userId = await requireUserId(params.authorization);
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
