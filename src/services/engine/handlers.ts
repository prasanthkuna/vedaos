import { makeId } from "../../lib/id";
import { json, parseJson, parseQuery } from "../../lib/http";
import { store } from "../../store/memory";
import {
  generateStoryBodySchema,
  generateWeeklyBodySchema,
  profileIdBodySchema,
  rectificationPromptsQuerySchema,
  submitRectificationBodySchema,
} from "../../schemas/api";
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
} from "../../lib/engine";
import type { Claim } from "../../domain/types";

const nowIso = () => new Date().toISOString();

const claimTemplateCode = (weightClass: Claim["weightClass"]) => `tmp_${weightClass}_v1`;

const buildFeed = (profileId: string, runId: string, mode: "quick5y" | "full15y") => {
  const years = yearsForMode(mode);
  const yearCards = years.map((year) => {
    const classes = claimClassesForYear(year);
    const points = classes.map((weightClass, idx) => {
      const claimId = makeClaimId();
      const claim: Claim = {
        claimId,
        runId,
        profileId,
        year,
        text: claimText(year, weightClass),
        weightClass,
        confidenceScore: Math.max(50, 92 - idx * 8),
        templateCode: claimTemplateCode(weightClass),
        triggerFlags: ["md-ad-pd", "transit_context"],
      };
      store.claims.set(claimId, claim);
      return {
        claimId,
        text: claim.text,
        weightClass: claim.weightClass,
        confidenceScore: claim.confidenceScore,
        whyLite: ["Derived from MD/AD/PD overlap", "Transit support considered"],
        whyFullAvailable: true,
      };
    });

    return { year, points };
  });

  return yearCards;
};

export const assessRisk = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, profileIdBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const result = assessRiskFromTob(profile.rectifiedTobLocal ?? profile.tobLocal);
  profile.birthTimeRiskLevel = result.riskLevel;
  store.profiles.set(profile.profileId, profile);

  return json({
    riskLevel: result.riskLevel,
    boundaryDistance: result.boundaryDistance,
    rectificationRequired: result.riskLevel === "high",
    details: {
      method: "moon_boundary_proximity_v1",
      certaintyInput: profile.birthTimeCertainty,
    },
  });
};

export const getAtmakarakaPrimer = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, profileIdBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  return json(atmakarakaFromProfile(profile));
};

export const getRectificationPrompts = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const query = parseQuery(url, rectificationPromptsQuerySchema);

  const prompts = [
    { promptId: "job_shift", text: "Did you face a major job shift around a specific year?" },
    { promptId: "relocation", text: "Did relocation happen with strong pressure in any year?" },
    { promptId: "exam_result", text: "Was there a defining exam or certification period?" },
    { promptId: "family_responsibility", text: "Did family responsibility increase sharply in any period?" },
    { promptId: "financial_stress", text: "Did financial pressure peak in any narrow window?" },
  ];

  return json({ engineVersion: query.engineVersion, languageCode: query.languageCode, prompts });
};

export const submitRectification = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, submitRectificationBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const run = rectificationWindow(profile.tobLocal, body.answers.length);
  profile.rectifiedTobLocal = run.effectiveTobLocal;
  profile.rectificationCompleted = true;
  profile.updatedAt = nowIso();
  store.profiles.set(profile.profileId, profile);

  return json({
    rectRunId: makeId("rct"),
    windowStart: run.windowStart,
    windowEnd: run.windowEnd,
    confidence: run.confidence,
    effectiveTobLocal: run.effectiveTobLocal,
  });
};

export const generateStory = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, generateStoryBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const runId = makeId("run");
  const years = yearsForMode(body.mode);
  const yearCards = buildFeed(profile.profileId, runId, body.mode);

  const claimIds = yearCards.flatMap((year) => year.points.map((point) => point.claimId));
  store.runs.set(runId, {
    runId,
    profileId: profile.profileId,
    mode: body.mode,
    engineVersion: "v0.1",
    years,
    claimIds,
    createdAt: nowIso(),
  });

  const score = store.ensureScore(profile.profileId);

  return json({
    runId,
    feed: {
      engineVersion: "v0.1",
      mode: body.mode,
      psa: score.psa,
      pcs: score.pcs,
      validatedCount: score.validatedCount,
      yearCoverage: score.yearCoverage,
      diversityScore: score.diversityScore,
      years: yearCards,
      present: null,
      future: null,
    },
  });
};

export const generateForecast12m = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, profileIdBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  return json({
    forecastRunId: makeId("fct"),
    forecast: {
      summary: "12-month outlook generated from validated profile patterns.",
      windows: [
        { period: "Q1", theme: "reset and alignment" },
        { period: "Q2", theme: "execution and momentum" },
        { period: "Q3", theme: "relationship boundaries" },
        { period: "Q4", theme: "consolidation and gains" },
      ],
    },
  });
};

export const generateWeekly = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, generateWeeklyBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  if (!profile.currentCity || profile.currentLat == null || profile.currentLon == null) {
    return json({ error: "current_city_required" }, 400);
  }

  const windows = weeklyWindows(body.weekStartUtc);

  return json({
    weekly: {
      weekStartUtc: body.weekStartUtc,
      theme: weeklyTheme(body.weekStartUtc),
      frictionWindows: windows.friction,
      supportWindows: windows.support,
      muhurthaLite: windows.muhurthaLite,
      upaya: {
        title: "Weekly grounding upaya",
        instruction: "Offer water to Surya in the morning and avoid reactive communication after sunset.",
        disclaimerKey: "upaya_non_guaranteed",
      },
    },
  });
};
