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

export const validateClaim = api(
  { expose: true, method: "POST", path: "/validation.validateClaim" },
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
    };
  },
);

export const getScores = api(
  { expose: true, method: "GET", path: "/validation.getScores" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    return getScoresRepo(params.profileId);
  },
);
