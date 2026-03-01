import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  assessRiskFromTob,
  atmakarakaFromProfile,
  claimEvidence,
  claimClassesForYear,
  claimText,
  cosmicSnapshotFromProfile,
  makeClaimId,
  monthlyOverview,
  phaseNextStep,
  phaseSegmentsForMode,
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
  saveNarrativeRun,
  savePhaseJourneyRun,
  saveRectification,
  saveStoryRun,
  setProfileRisk,
} from "../src/persistence/repo";
import { enforceRateLimit } from "../src/lib/rate-limit";
import { generateForecastNarrative, generateJourneyNarrative, generateWeeklyNarrative } from "../src/lib/journey-ai";

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
    const inputMode =
      profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
    const nextStep = phaseNextStep(inputMode, profile.rectificationCompleted);
    const rectificationRequired = nextStep === "rectification_required";

    return {
      riskLevel: result.riskLevel,
      boundaryDistance: result.boundaryDistance,
      rectificationRequired,
      nextStep,
      details: {
        method: "moon_boundary_proximity_v1",
        certaintyInput: profile.birthTimeCertainty,
        inputMode,
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

export const getHomeV2 = api(
  { expose: true, method: "GET", path: "/engine/home-v2" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; dayStartUtc?: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`homev2:${userId}`, 30, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const inputMode =
      profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
    const nextStep = phaseNextStep(inputMode, profile.rectificationCompleted);

    const generated = phaseSegmentsForMode("quick5y", {
      dob: profile.dob,
      tobLocal: profile.rectifiedTobLocal ?? profile.tobLocal,
      tzIana: profile.tzIana,
      lat: profile.lat,
      lon: profile.lon,
      pobText: profile.pobText,
    });
    const dayStartUtc = params.dayStartUtc ?? new Date().toISOString();
    const windows = weeklyWindows(dayStartUtc, {
      dob: profile.dob,
      tobLocal: profile.rectifiedTobLocal ?? profile.tobLocal,
      tzIana: profile.tzIana,
      lat: profile.currentLat ?? profile.lat,
      lon: profile.currentLon ?? profile.lon,
      pobText: profile.currentCity ?? profile.pobText,
    });
    const active = generated.active;
    const upcoming = generated.segments.find((s) => new Date(s.startUtc).getTime() > Date.now());
    const snapshot = cosmicSnapshotFromProfile(profile, dayStartUtc);

    return {
      nextStep,
      today: {
        cosmicSnapshot: {
          rashi: snapshot.rashi,
          nakshatra: snapshot.nakshatra,
          activePhase: `${active.mdLord}-${active.adLord}-${active.pdLord}`,
        },
        nowActivePhase: {
          md: active.mdLord,
          ad: active.adLord,
          pd: active.pdLord,
          startUtc: active.startUtc,
          endUtc: active.endUtc,
        },
        windows: {
          support: windows.support,
          caution: windows.friction,
        },
        upaya: {
          title: "Today's steadying upaya",
          instruction: "Start one key task during support windows and avoid emotional decisions in caution windows.",
        },
        upcomingShift: upcoming
          ? {
              startsAtUtc: upcoming.startUtc,
              phase: `${upcoming.mdLord}-${upcoming.adLord}-${upcoming.pdLord ?? ""}`.replace(/-$/, ""),
            }
          : null,
      },
    };
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

    const run = rectificationWindow(
      profile.tobLocal,
      params.answers.length,
      profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time"),
    );
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
    const inputMode =
      profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
    const nextStep = phaseNextStep(inputMode, profile.rectificationCompleted);

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
              nextStep !== "rectification_required",
            guardrails: {
              minValidatedCount: 6,
              minYearCoverage: 3,
              minDiversityScore: 50,
              highRiskNeedsRectification: false,
            },
          }
        : null;

    return {
      runId: run.runId,
      feed,
      quickProof,
      nextStep,
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
    const context = {
      birthTimeInputMode: profile.birthTimeInputMode ?? "exact_time",
      birthTimeRiskLevel: profile.birthTimeRiskLevel ?? "safe",
      score: {
        validatedCount: score.validatedCount,
        yearCoverage: score.yearCoverage,
        diversityScore: score.diversityScore,
        futureUnlocked: score.futureUnlocked,
      },
    };
    let ai;
    try {
      ai = await generateForecastNarrative({
        languageCode: profile.languageCode,
        profileContext: context,
      });
    } catch (error) {
      throw APIError.unavailable(error instanceof Error ? error.message : "forecast_generation_failed");
    }

    return {
      forecastRunId: `fct_${Date.now()}`,
      provider: ai.provider,
      promptVersion: ai.promptVersion,
      forecast: {
        summary: ai.summary,
        windows: [
          { period: "Q1", theme: ai.q1 },
          { period: "Q2", theme: ai.q2 },
          { period: "Q3", theme: ai.q3 },
          { period: "Q4", theme: ai.q4 },
        ],
      },
    };
  },
);

export const generateJourneyV2 = api(
  { expose: true, method: "POST", path: "/engine/generate-journey-v2" },
  async (params: {
    authorization?: Header<"Authorization">;
    profileId: string;
    mode: "quick5y" | "full15y";
    explanationMode?: "simple" | "traditional";
  }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`journeyv2:${userId}`, 12, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const inputMode =
      profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
    const nextStep = phaseNextStep(inputMode, profile.rectificationCompleted);
    if (nextStep === "rectification_required") {
      throw APIError.failedPrecondition("rectification_required_for_input_mode");
    }

    const generated = phaseSegmentsForMode(params.mode, {
      dob: profile.dob,
      tobLocal: profile.rectifiedTobLocal ?? profile.tobLocal,
      tzIana: profile.tzIana,
      lat: profile.lat,
      lon: profile.lon,
      pobText: profile.pobText,
    });
    const explanationMode = params.explanationMode ?? "simple";

    let aiNarrative;
    try {
      aiNarrative = await generateJourneyNarrative({
        languageCode: profile.languageCode,
        explanationMode,
        segments: generated.segments,
      });
    } catch (error) {
      throw APIError.unavailable(error instanceof Error ? error.message : "narrative_generation_failed");
    }

    const feed = {
      engineVersion: "v2.0",
      mode: params.mode,
      nextStep,
      activePhaseRefs: {
        md: generated.active.mdLord,
        ad: generated.active.adLord,
        pd: generated.active.pdLord,
        startUtc: generated.active.startUtc,
        endUtc: generated.active.endUtc,
      },
      dateWindows: generated.segments.map((segment) => ({
        segmentId: segment.phaseSegmentId,
        startUtc: segment.startUtc,
        endUtc: segment.endUtc,
      })),
      segments: generated.segments.map((segment, idx) => ({
        segmentId: segment.phaseSegmentId,
        level: segment.level,
        md: segment.mdLord,
        ad: segment.adLord ?? null,
        pd: segment.pdLord ?? null,
        startUtc: segment.startUtc,
        endUtc: segment.endUtc,
        confidenceBand: segment.confidenceBand,
        narrative: {
          phaseMeaning: aiNarrative.blocks[idx]?.phaseMeaning ?? "",
          likelyManifestation: aiNarrative.blocks[idx]?.likelyManifestation ?? "",
          caution: aiNarrative.blocks[idx]?.caution ?? "",
          action: aiNarrative.blocks[idx]?.action ?? "",
          timingReference: aiNarrative.blocks[idx]?.timingReference ?? `${segment.startUtc} -> ${segment.endUtc}`,
        },
        keyTransitTriggers: segment.highlights.map((h) => ({
          type: h.triggerType,
          ref: h.triggerRef ?? null,
        })),
      })),
    };

    const saved = await savePhaseJourneyRun({
      profileId: profile.profileId,
      mode: params.mode,
      engineVersion: "v2.0",
      startUtc: generated.startUtc,
      endUtc: generated.endUtc,
      asOfUtc: generated.asOfUtc,
      feed,
      segments: generated.segments,
    });
    const narrativeRunId = await saveNarrativeRun({
      profileId: profile.profileId,
      phaseRunId: saved.phaseRunId,
      engineVersion: "v2.0",
      provider: aiNarrative.provider,
      promptVersion: aiNarrative.promptVersion,
      languageCode: profile.languageCode,
      explanationMode,
      groundingPassed: true,
      blocks: generated.segments.map((segment, idx) => ({
        phaseSegmentId: segment.phaseSegmentId,
        title: aiNarrative.blocks[idx]?.phaseMeaning ?? "",
        body: aiNarrative.blocks[idx]?.likelyManifestation ?? "",
        actionLine: aiNarrative.blocks[idx]?.action ?? "",
        cautionLine: aiNarrative.blocks[idx]?.caution ?? "",
        timingRef: aiNarrative.blocks[idx]?.timingReference ?? `${segment.startUtc} -> ${segment.endUtc}`,
        whyFactors: {
          md: segment.mdLord,
          ad: segment.adLord ?? null,
          pd: segment.pdLord ?? null,
          triggers: segment.highlights.map((h) => ({ type: h.triggerType, ref: h.triggerRef ?? null })),
        },
      })),
    });

    return {
      phaseRunId: saved.phaseRunId,
      narrativeRunId,
      provider: aiNarrative.provider,
      journey: feed,
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

    const windows = weeklyWindows(params.weekStartUtc, {
      dob: profile.dob,
      tobLocal: profile.rectifiedTobLocal ?? profile.tobLocal,
      tzIana: profile.tzIana,
      lat: profile.currentLat ?? profile.lat,
      lon: profile.currentLon ?? profile.lon,
      pobText: profile.currentCity ?? profile.pobText,
    });
    let ai;
    try {
      ai = await generateWeeklyNarrative({
        languageCode: profile.languageCode,
        city: profile.currentCity,
        weekStartUtc: params.weekStartUtc,
        windows,
      });
    } catch (error) {
      throw APIError.unavailable(error instanceof Error ? error.message : "weekly_generation_failed");
    }

    return {
      weekly: {
        weekStartUtc: params.weekStartUtc,
        theme: ai.theme || weeklyTheme(params.weekStartUtc),
        provider: ai.provider,
        promptVersion: ai.promptVersion,
        frictionWindows: windows.friction,
        supportWindows: windows.support,
        muhurthaLite: windows.muhurthaLite,
        upaya: {
          title: ai.upayaTitle,
          instruction: ai.upayaInstruction,
          disclaimerKey: "upaya_non_guaranteed",
        },
      },
    };
  },
);

export const generateMonthly = api(
  { expose: true, method: "POST", path: "/engine/generate-monthly" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; monthStartUtc: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`monthly:${userId}`, 20, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const month = monthlyOverview(params.monthStartUtc, {
      dob: profile.dob,
      tobLocal: profile.rectifiedTobLocal ?? profile.tobLocal,
      tzIana: profile.tzIana,
      lat: profile.currentLat ?? profile.lat,
      lon: profile.currentLon ?? profile.lon,
      pobText: profile.currentCity ?? profile.pobText,
    });

    return {
      provider: "deterministic_core",
      monthStartUtc: params.monthStartUtc,
      monthly: month,
    };
  },
);
