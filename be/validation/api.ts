import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  getClaim,
  getProfileByUser,
  getRun,
  getScores as getScoresRepo,
  recomputeScores,
  upsertValidation,
} from "../src/persistence/repo";
import { enforceRateLimit } from "../src/lib/rate-limit";

const isRectificationBlocked = (profile: { birthTimeInputMode?: string; birthTimeCertainty: string; rectificationCompleted: boolean }) => {
  const inputMode = profile.birthTimeInputMode ?? (profile.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
  return inputMode !== "exact_time" && !profile.rectificationCompleted;
};

const buildUnlock = (input: {
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  futureUnlocked: boolean;
  rectificationBlocked: boolean;
}) => {
  const reasons: string[] = [];
  const nextSteps: string[] = [];
  const quickProofEligible =
    input.validatedCount >= 6 &&
    input.yearCoverage >= 3 &&
    input.diversityScore >= 50 &&
    !input.rectificationBlocked;

  if (input.validatedCount < 6) {
    reasons.push("need_more_validations");
    nextSteps.push("Validate at least 6 claims.");
  }
  if (input.yearCoverage < 3) {
    reasons.push("need_more_year_coverage");
    nextSteps.push("Validate claims across at least 3 different years.");
  }
  if (input.diversityScore < 50) {
    reasons.push("need_more_claim_diversity");
    nextSteps.push("Include both event and non-event claims.");
  }
  if (input.rectificationBlocked) {
    reasons.push("rectification_required");
    nextSteps.push("Complete rectification because birth-time mode is approximate or unknown.");
  }

  return {
    quickProofEligible,
    futureUnlocked: input.futureUnlocked,
    reasons,
    nextSteps,
  };
};

export const validateClaim = api(
  { expose: true, method: "POST", path: "/validation/validate-claim" },
  async (params: {
    authorization?: Header<"Authorization">;
    profileId: string;
    runId: string;
    claimId: string;
    label: "true" | "somewhat" | "false";
    topics?: string[];
    direction?: "better" | "worse";
    confidenceLevel?: "high" | "medium" | "low";
    quarter?: 1 | 2 | 3 | 4;
    wrongReason?: string;
    note?: string;
  }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`validate:${userId}`, 120, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const run = await getRun(params.runId);
    if (!run || run.profile_id !== params.profileId) {
      throw APIError.notFound("run_not_found");
    }

    const claim = await getClaim(params.claimId);
    if (!claim || claim.run_id !== params.runId || claim.profile_id !== params.profileId) {
      throw APIError.notFound("claim_not_found");
    }

    await upsertValidation({
      profileId: params.profileId,
      runId: params.runId,
      claimId: params.claimId,
      label: params.label,
      topics: params.topics,
      direction: params.direction,
      confidenceLevel: params.confidenceLevel,
      quarter: params.quarter,
      wrongReason: params.wrongReason,
      note: params.note,
    });

    const score = await recomputeScores(params.profileId);

    return {
      psa: score.psa,
      pcs: score.pcs,
      validatedCount: score.validatedCount,
      yearCoverage: score.yearCoverage,
      diversityScore: score.diversityScore,
      futureUnlocked: score.futureUnlocked,
      unlock: buildUnlock({
        validatedCount: score.validatedCount,
        yearCoverage: score.yearCoverage,
        diversityScore: score.diversityScore,
        futureUnlocked: score.futureUnlocked,
        rectificationBlocked: isRectificationBlocked(profile),
      }),
    };
  },
);

export const getScores = api(
  { expose: true, method: "GET", path: "/validation/get-scores" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    enforceRateLimit(`scores:${userId}`, 120, 60_000);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const score = await getScoresRepo(params.profileId);
    return {
      ...score,
      unlock: buildUnlock({
        validatedCount: score.validatedCount,
        yearCoverage: score.yearCoverage,
        diversityScore: score.diversityScore,
        futureUnlocked: score.futureUnlocked,
        rectificationBlocked: isRectificationBlocked(profile),
      }),
    };
  },
);
