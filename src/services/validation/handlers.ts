import { json, parseJson, parseQuery } from "../../lib/http";
import { store } from "../../store/memory";
import { getScoresQuerySchema, validateClaimBodySchema } from "../../schemas/api";
import { makeId } from "../../lib/id";
import { round2, scoreClaim } from "../../lib/scoring";
import type { ValidationRecord } from "../../domain/types";

const nowIso = () => new Date().toISOString();

const recalcScores = (profileId: string) => {
  const validations = [...store.validations.values()].filter((v) => v.profileId === profileId);
  if (validations.length === 0) {
    const empty = store.ensureScore(profileId);
    empty.updatedAt = nowIso();
    store.scores.set(profileId, empty);
    return empty;
  }

  let totalScore = 0;
  const years = new Set<number>();
  const classes = new Set<string>();
  let patternCount = 0;

  for (const validation of validations) {
    const claim = store.claims.get(validation.claimId);
    if (!claim) continue;

    totalScore += scoreClaim(claim.weightClass, validation.label, validation.confidenceLevel);
    years.add(claim.year);
    classes.add(claim.weightClass);

    if (validation.label !== "false") {
      patternCount += claim.triggerFlags.length > 0 ? 1 : 0;
    }
  }

  const maxWeight = validations.length;
  const psa = maxWeight > 0 ? (totalScore / maxWeight) * 100 : 0;
  const validatedCount = validations.length;
  const yearCoverage = years.size;
  const diversityScore = round2((classes.size / 4) * 100);
  const pcs = round2(Math.min(100, (patternCount / Math.max(1, validatedCount)) * 100));

  const profile = store.profiles.get(profileId);
  const highRiskBlocked = profile?.birthTimeRiskLevel === "high" && !profile.rectificationCompleted;
  const futureUnlocked = validatedCount >= 10 && yearCoverage >= 4 && diversityScore >= 50 && psa >= 75 && !highRiskBlocked;

  const snapshot = {
    profileId,
    psa: round2(psa),
    pcs,
    validatedCount,
    yearCoverage,
    diversityScore,
    futureUnlocked,
    updatedAt: nowIso(),
  };

  store.scores.set(profileId, snapshot);
  return snapshot;
};

export const validateClaim = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, validateClaimBodySchema);

  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const run = store.runs.get(body.runId);
  if (!run || run.profileId !== body.profileId) {
    return json({ error: "run_not_found" }, 404);
  }

  const claim = store.claims.get(body.claimId);
  if (!claim || claim.runId !== body.runId) {
    return json({ error: "claim_not_found" }, 404);
  }

  const existing = [...store.validations.values()].find(
    (v) => v.profileId === body.profileId && v.runId === body.runId && v.claimId === body.claimId,
  );

  const validation: ValidationRecord = {
    validationId: existing?.validationId ?? makeId("val"),
    profileId: body.profileId,
    runId: body.runId,
    claimId: body.claimId,
    label: body.label,
    topics: body.topics,
    direction: body.direction,
    confidenceLevel: body.confidenceLevel,
    quarter: body.quarter as ValidationRecord["quarter"],
    wrongReason: body.wrongReason,
    note: body.note,
    createdAt: existing?.createdAt ?? nowIso(),
  };

  store.validations.set(validation.validationId, validation);
  const scores = recalcScores(body.profileId);

  return json({
    psa: scores.psa,
    pcs: scores.pcs,
    validatedCount: scores.validatedCount,
    yearCoverage: scores.yearCoverage,
    diversityScore: scores.diversityScore,
    futureUnlocked: scores.futureUnlocked,
  });
};

export const getScores = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const query = parseQuery(url, getScoresQuerySchema);
  const profile = store.profiles.get(query.profileId);

  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const score = store.ensureScore(query.profileId);
  return json(score);
};
