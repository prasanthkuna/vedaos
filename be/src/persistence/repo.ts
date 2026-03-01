import { vedaDB } from "../../db";
import { artifactsBucket } from "../../storage";
import { makeId } from "../lib/id";
import { decryptPII, encryptPII } from "../lib/crypto";
import type {
  BirthTimeInputMode,
  CalendarMode,
  ConfidenceLevel,
  LanguageCode,
  LanguageMode,
  RiskLevel,
  ValidationLabel,
} from "../domain/types";
import { round2, scoreClaim } from "../lib/scoring";

const nowIso = () => new Date().toISOString();

export type ProfileRecord = {
  profileId: string;
  userId: string;
  displayName: string;
  dob: string;
  tobLocal: string;
  pobText: string;
  tzIana: string;
  lat?: number;
  lon?: number;
  birthTimeInputMode: BirthTimeInputMode;
  birthTimeWindowCode?: string;
  birthNakshatraHint?: string;
  birthTimeNotes?: string;
  birthTimeCertainty: "verified" | "confident" | "uncertain";
  languageCode: LanguageCode;
  languageMode: LanguageMode;
  calendarMode: CalendarMode;
  currentCity?: string;
  currentLat?: number;
  currentLon?: number;
  isGuestProfile: boolean;
  birthTimeRiskLevel?: RiskLevel;
  rectifiedTobLocal?: string;
  rectificationCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClaimRow = {
  claimId: string;
  year: number;
  weightClass: "event" | "decision" | "descriptor" | "stabilization";
  triggerFlags: string[];
};

export type ScoreRow = {
  profileId: string;
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  futureUnlocked: boolean;
  updatedAt: string;
};

const mapProfile = (row: Record<string, any>): ProfileRecord => ({
  profileId: row.profile_id,
  userId: row.user_id,
  displayName: row.display_name,
  dob: decryptPII(row.dob),
  tobLocal: decryptPII(row.tob_local),
  pobText: decryptPII(row.pob_text),
  tzIana: row.tz_iana,
  lat: row.lat ?? undefined,
  lon: row.lon ?? undefined,
  birthTimeInputMode:
    row.birth_time_input_mode ??
    (row.birth_time_certainty === "uncertain" ? "unknown" : "exact_time"),
  birthTimeWindowCode: row.birth_time_window_code ?? undefined,
  birthNakshatraHint: row.birth_nakshatra_hint ?? undefined,
  birthTimeNotes: row.birth_time_notes ?? undefined,
  birthTimeCertainty: row.birth_time_certainty,
  languageCode: row.language_code,
  languageMode: row.language_mode,
  calendarMode: row.calendar_mode,
  currentCity: row.current_city ? decryptPII(row.current_city) : undefined,
  currentLat: row.current_lat ?? undefined,
  currentLon: row.current_lon ?? undefined,
  isGuestProfile: row.is_guest_profile,
  birthTimeRiskLevel: row.birth_time_risk_level ?? undefined,
  rectifiedTobLocal: row.rectified_tob_local ? decryptPII(row.rectified_tob_local) : undefined,
  rectificationCompleted: row.rectification_completed,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const ensureUser = async (userId: string): Promise<void> => {
  await vedaDB.exec`
    INSERT INTO veda_users (user_id, created_at)
    VALUES (${userId}, NOW())
    ON CONFLICT (user_id) DO NOTHING
  `;

  await vedaDB.exec`
    INSERT INTO veda_entitlements (user_id, plan_code, trial_active, pro_enabled, family_enabled, updated_at)
    VALUES (${userId}, 'basic', false, false, false, NOW())
    ON CONFLICT (user_id) DO NOTHING
  `;
};

export const guestProfileCount = async (userId: string): Promise<number> => {
  const row = await vedaDB.queryRow<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM veda_profiles
    WHERE user_id = ${userId} AND is_guest_profile = true AND deleted_at IS NULL
  `;
  return row?.count ?? 0;
};

export const createProfile = async (input: {
  userId: string;
  displayName: string;
  dob: string;
  tobLocal?: string;
  pobText: string;
  tzIana: string;
  lat?: number;
  lon?: number;
  birthTimeInputMode?: BirthTimeInputMode;
  birthTimeWindowCode?: string;
  birthNakshatraHint?: string;
  birthTimeNotes?: string;
  birthTimeCertainty: "verified" | "confident" | "uncertain";
  isGuestProfile: boolean;
}): Promise<string> => {
  const profileId = makeId("pro");
  const safeTobLocal = input.tobLocal && input.tobLocal.trim().length > 0 ? input.tobLocal : "12:00";

  await vedaDB.exec`
    INSERT INTO veda_profiles (
      profile_id, user_id, display_name, dob, tob_local, pob_text, tz_iana,
      lat, lon, birth_time_input_mode, birth_time_window_code, birth_nakshatra_hint, birth_time_notes, birth_time_certainty, language_code, language_mode, calendar_mode,
      is_guest_profile, rectification_completed, created_at, updated_at
    ) VALUES (
      ${profileId}, ${input.userId}, ${input.displayName}, ${encryptPII(input.dob)}, ${encryptPII(safeTobLocal)}, ${encryptPII(input.pobText)}, ${input.tzIana},
      ${input.lat ?? null}, ${input.lon ?? null}, ${input.birthTimeInputMode ?? (input.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time")},
      ${input.birthTimeWindowCode ?? null}, ${input.birthNakshatraHint ?? null}, ${input.birthTimeNotes ?? null},
      ${input.birthTimeCertainty}, 'en', 'auto', 'civil',
      ${input.isGuestProfile}, false, NOW(), NOW()
    )
  `;

  await vedaDB.exec`
    INSERT INTO veda_score_snapshots (
      profile_id, psa, pcs, validated_count, year_coverage, diversity_score, future_unlocked, updated_at
    ) VALUES (
      ${profileId}, 0, 0, 0, 0, 0, false, NOW()
    )
    ON CONFLICT (profile_id) DO NOTHING
  `;

  return profileId;
};

export const getProfile = async (profileId: string): Promise<ProfileRecord | null> => {
  const row = await vedaDB.queryRow<Record<string, any>>`
    SELECT * FROM veda_profiles
    WHERE profile_id = ${profileId} AND deleted_at IS NULL
  `;
  return row ? mapProfile(row) : null;
};

export const getProfileByUser = async (profileId: string, userId: string): Promise<ProfileRecord | null> => {
  const row = await vedaDB.queryRow<Record<string, any>>`
    SELECT * FROM veda_profiles
    WHERE profile_id = ${profileId} AND user_id = ${userId} AND deleted_at IS NULL
  `;
  return row ? mapProfile(row) : null;
};

export const listProfilesByUser = async (userId: string): Promise<ProfileRecord[]> => {
  const rows = await vedaDB.queryAll<Record<string, any>>`
    SELECT * FROM veda_profiles
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY created_at ASC
  `;
  return rows.map(mapProfile);
};

export const updateProfileLanguage = async (
  profileId: string,
  languageCode: LanguageCode,
  languageMode: LanguageMode,
): Promise<void> => {
  await vedaDB.exec`
    UPDATE veda_profiles
    SET language_code = ${languageCode}, language_mode = ${languageMode}, updated_at = NOW()
    WHERE profile_id = ${profileId} AND deleted_at IS NULL
  `;
};

export const updateProfileCity = async (
  profileId: string,
  city: string,
  lat: number,
  lon: number,
): Promise<void> => {
  await vedaDB.exec`
    UPDATE veda_profiles
    SET current_city = ${encryptPII(city)}, current_lat = ${lat}, current_lon = ${lon}, updated_at = NOW()
    WHERE profile_id = ${profileId} AND deleted_at IS NULL
  `;
};

export const updateProfileCalendarMode = async (
  profileId: string,
  calendarMode: CalendarMode,
): Promise<void> => {
  await vedaDB.exec`
    UPDATE veda_profiles
    SET calendar_mode = ${calendarMode}, updated_at = NOW()
    WHERE profile_id = ${profileId} AND deleted_at IS NULL
  `;
};

export const setProfileRisk = async (profileId: string, riskLevel: RiskLevel): Promise<void> => {
  await vedaDB.exec`
    UPDATE veda_profiles
    SET birth_time_risk_level = ${riskLevel}, updated_at = NOW()
    WHERE profile_id = ${profileId}
  `;
};

export const saveRectification = async (input: {
  profileId: string;
  windowStart: string;
  windowEnd: string;
  confidence: number;
  effectiveTobLocal: string;
  answers: unknown;
}): Promise<{ rectRunId: string; traceKey: string }> => {
  const rectRunId = makeId("rct");
  const traceKey = `rectification/${input.profileId}/${rectRunId}.json`;

  const trace = {
    rectRunId,
    profileId: input.profileId,
    answers: input.answers,
    output: {
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      confidence: input.confidence,
      effectiveTobLocal: input.effectiveTobLocal,
    },
    createdAt: nowIso(),
  };

  await artifactsBucket.upload(traceKey, Buffer.from(JSON.stringify(trace, null, 2)), {
    contentType: "application/json",
  });

  await vedaDB.exec`
    INSERT INTO veda_rectification_runs (
      rect_run_id, profile_id, window_start, window_end, confidence,
      effective_tob_local, solver_trace_key, created_at
    ) VALUES (
      ${rectRunId}, ${input.profileId}, ${input.windowStart}, ${input.windowEnd}, ${input.confidence},
      ${input.effectiveTobLocal}, ${traceKey}, NOW()
    )
  `;

  await vedaDB.exec`
    UPDATE veda_profiles
    SET rectified_tob_local = ${encryptPII(input.effectiveTobLocal)}, rectification_completed = true, updated_at = NOW()
    WHERE profile_id = ${input.profileId}
  `;

  return { rectRunId, traceKey };
};

export const saveStoryRun = async (input: {
  profileId: string;
  mode: "quick5y" | "full15y";
  engineVersion: string;
  years: number[];
  feed: unknown;
  claims: Array<{
    claimId: string;
    year: number;
    text: string;
    weightClass: "event" | "decision" | "descriptor" | "stabilization";
    confidenceScore: number;
    templateCode: string;
    triggerFlags: string[];
  }>;
}): Promise<{ runId: string; feedKey: string }> => {
  const runId = makeId("run");
  const feedKey = `story/${input.profileId}/${runId}.json`;
  const yearsJson = JSON.stringify(input.years);

  await artifactsBucket.upload(feedKey, Buffer.from(JSON.stringify(input.feed, null, 2)), {
    contentType: "application/json",
  });

  await vedaDB.exec`
    INSERT INTO veda_engine_runs (run_id, profile_id, mode, engine_version, years_json, feed_key, created_at)
    VALUES (${runId}, ${input.profileId}, ${input.mode}, ${input.engineVersion}, ${yearsJson}::jsonb, ${feedKey}, NOW())
  `;

  for (const claim of input.claims) {
    const triggerFlagsJson = JSON.stringify(claim.triggerFlags);
    await vedaDB.exec`
      INSERT INTO veda_claims (
        claim_id, run_id, profile_id, year, text, weight_class,
        confidence_score, template_code, trigger_flags, created_at
      ) VALUES (
        ${claim.claimId}, ${runId}, ${input.profileId}, ${claim.year}, ${claim.text}, ${claim.weightClass},
        ${claim.confidenceScore}, ${claim.templateCode}, ${triggerFlagsJson}::jsonb, NOW()
      )
    `;
  }

  return { runId, feedKey };
};

export const savePhaseJourneyRun = async (input: {
  profileId: string;
  mode: "quick5y" | "full15y";
  engineVersion: string;
  startUtc: string;
  endUtc: string;
  asOfUtc: string;
  feed: unknown;
  segments: Array<{
    phaseSegmentId: string;
    level: "md" | "ad" | "pd";
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
  }>;
}): Promise<{ phaseRunId: string; feedKey: string }> => {
  const phaseRunId = makeId("phr");
  const feedKey = `phase/${input.profileId}/${phaseRunId}.json`;

  await artifactsBucket.upload(feedKey, Buffer.from(JSON.stringify(input.feed, null, 2)), {
    contentType: "application/json",
  });

  await vedaDB.exec`
    INSERT INTO veda_phase_runs (phase_run_id, profile_id, source_mode, engine_version, start_utc, end_utc, as_of_utc, created_at)
    VALUES (${phaseRunId}, ${input.profileId}, ${input.mode}, ${input.engineVersion}, ${input.startUtc}, ${input.endUtc}, ${input.asOfUtc}, NOW())
  `;

  for (const segment of input.segments) {
    await vedaDB.exec`
      INSERT INTO veda_phase_segments (
        phase_segment_id, phase_run_id, profile_id, level, md_lord, ad_lord, pd_lord,
        start_utc, end_utc, ord, confidence_band, created_at
      ) VALUES (
        ${segment.phaseSegmentId}, ${phaseRunId}, ${input.profileId}, ${segment.level}, ${segment.mdLord}, ${segment.adLord ?? null}, ${segment.pdLord ?? null},
        ${segment.startUtc}, ${segment.endUtc}, ${segment.ord}, ${segment.confidenceBand}, NOW()
      )
    `;

    for (const highlight of segment.highlights) {
      await vedaDB.exec`
        INSERT INTO veda_phase_highlights (
          phase_highlight_id, phase_segment_id, profile_id, title, detail, trigger_type, trigger_ref, created_at
        ) VALUES (
          ${highlight.phaseHighlightId}, ${segment.phaseSegmentId}, ${input.profileId}, ${highlight.title}, ${highlight.detail}, ${highlight.triggerType}, ${highlight.triggerRef ?? null}, NOW()
        )
      `;
    }
  }

  return { phaseRunId, feedKey };
};

export const saveNarrativeRun = async (input: {
  profileId: string;
  phaseRunId: string;
  engineVersion: string;
  provider: string;
  promptVersion: string;
  languageCode: string;
  explanationMode: "simple" | "traditional";
  groundingPassed: boolean;
  blocks: Array<{
    phaseSegmentId: string;
    title: string;
    body: string;
    actionLine: string;
    cautionLine: string;
    timingRef: string;
    whyFactors: Record<string, unknown>;
  }>;
}): Promise<string> => {
  const narrativeRunId = makeId("nrr");
  await vedaDB.exec`
    INSERT INTO veda_narrative_runs (
      narrative_run_id, profile_id, phase_run_id, engine_version, provider, prompt_version,
      language_code, explanation_mode, grounding_passed, created_at
    ) VALUES (
      ${narrativeRunId}, ${input.profileId}, ${input.phaseRunId}, ${input.engineVersion}, ${input.provider}, ${input.promptVersion},
      ${input.languageCode}, ${input.explanationMode}, ${input.groundingPassed}, NOW()
    )
  `;

  for (const block of input.blocks) {
    const narrativeBlockId = makeId("nrb");
    await vedaDB.exec`
      INSERT INTO veda_narrative_blocks (
        narrative_block_id, narrative_run_id, phase_segment_id, block_type, title, body, action_line, caution_line, timing_ref, why_factors, created_at
      ) VALUES (
        ${narrativeBlockId}, ${narrativeRunId}, ${block.phaseSegmentId}, 'phase_segment', ${block.title}, ${block.body},
        ${block.actionLine}, ${block.cautionLine}, ${block.timingRef}, ${JSON.stringify(block.whyFactors)}::jsonb, NOW()
      )
    `;
  }

  return narrativeRunId;
};

export const getRun = async (runId: string) =>
  vedaDB.queryRow<{ run_id: string; profile_id: string }>`
    SELECT run_id, profile_id FROM veda_engine_runs WHERE run_id = ${runId}
  `;

export const getClaim = async (claimId: string) =>
  vedaDB.queryRow<{
    claim_id: string;
    run_id: string;
    profile_id: string;
    year: number;
    weight_class: "event" | "decision" | "descriptor" | "stabilization";
    trigger_flags: string[];
  }>`
    SELECT claim_id, run_id, profile_id, year, weight_class, trigger_flags
    FROM veda_claims
    WHERE claim_id = ${claimId}
  `;

export const upsertValidation = async (input: {
  profileId: string;
  runId: string;
  claimId: string;
  label: ValidationLabel;
  topics?: string[];
  direction?: "better" | "worse";
  confidenceLevel?: ConfidenceLevel;
  quarter?: 1 | 2 | 3 | 4;
  wrongReason?: string;
  note?: string;
}): Promise<void> => {
  const validationId = makeId("val");
  const topicsJson = input.topics ? JSON.stringify(input.topics) : null;
  await vedaDB.exec`
    INSERT INTO veda_validations (
      validation_id, profile_id, run_id, claim_id, label, topics,
      direction, confidence_level, quarter, wrong_reason, note, created_at, updated_at
    ) VALUES (
      ${validationId}, ${input.profileId}, ${input.runId}, ${input.claimId}, ${input.label}, ${topicsJson}::jsonb,
      ${input.direction ?? null}, ${input.confidenceLevel ?? null}, ${input.quarter ?? null},
      ${input.wrongReason ?? null}, ${input.note ?? null}, NOW(), NOW()
    )
    ON CONFLICT (profile_id, run_id, claim_id) DO UPDATE SET
      label = EXCLUDED.label,
      topics = EXCLUDED.topics,
      direction = EXCLUDED.direction,
      confidence_level = EXCLUDED.confidence_level,
      quarter = EXCLUDED.quarter,
      wrong_reason = EXCLUDED.wrong_reason,
      note = EXCLUDED.note,
      updated_at = NOW()
  `;
};

export const recomputeScores = async (profileId: string): Promise<ScoreRow> => {
  const rows = await vedaDB.queryAll<{
    year: number;
    weight_class: "event" | "decision" | "descriptor" | "stabilization";
    label: ValidationLabel;
    confidence_level: ConfidenceLevel | null;
    trigger_flags: string[];
  }>`
    SELECT c.year, c.weight_class, v.label, v.confidence_level, c.trigger_flags
    FROM veda_validations v
    JOIN veda_claims c ON c.claim_id = v.claim_id
    WHERE v.profile_id = ${profileId}
  `;

  if (rows.length === 0) {
    const score: ScoreRow = {
      profileId,
      psa: 0,
      pcs: 0,
      validatedCount: 0,
      yearCoverage: 0,
      diversityScore: 0,
      futureUnlocked: false,
      updatedAt: nowIso(),
    };

    await vedaDB.exec`
      INSERT INTO veda_score_snapshots (
        profile_id, psa, pcs, validated_count, year_coverage, diversity_score, future_unlocked, updated_at
      ) VALUES (${profileId}, 0, 0, 0, 0, 0, false, NOW())
      ON CONFLICT (profile_id) DO UPDATE SET
        psa = EXCLUDED.psa,
        pcs = EXCLUDED.pcs,
        validated_count = EXCLUDED.validated_count,
        year_coverage = EXCLUDED.year_coverage,
        diversity_score = EXCLUDED.diversity_score,
        future_unlocked = EXCLUDED.future_unlocked,
        updated_at = NOW()
    `;

    return score;
  }

  let total = 0;
  let triggerHits = 0;
  const years = new Set<number>();
  const classes = new Set<string>();

  for (const row of rows) {
    total += scoreClaim(row.weight_class, row.label, row.confidence_level ?? undefined);
    years.add(row.year);
    classes.add(row.weight_class);
    if (row.label !== "false" && row.trigger_flags.length > 0) triggerHits += 1;
  }

  const validatedCount = rows.length;
  const yearCoverage = years.size;
  const diversityScore = round2((classes.size / 4) * 100);
  const psa = round2((total / Math.max(1, validatedCount)) * 100);
  const pcs = round2(Math.min(100, (triggerHits / Math.max(1, validatedCount)) * 100));

  const profile = await getProfile(profileId);
  const inputMode =
    profile?.birthTimeInputMode ?? (profile?.birthTimeCertainty === "uncertain" ? "unknown" : "exact_time");
  const rectificationBlocked = inputMode !== "exact_time" && !(profile?.rectificationCompleted ?? false);
  const futureUnlocked = validatedCount >= 10 && yearCoverage >= 4 && diversityScore >= 50 && psa >= 75 && !rectificationBlocked;

  await vedaDB.exec`
    INSERT INTO veda_score_snapshots (
      profile_id, psa, pcs, validated_count, year_coverage, diversity_score, future_unlocked, updated_at
    ) VALUES (
      ${profileId}, ${psa}, ${pcs}, ${validatedCount}, ${yearCoverage}, ${diversityScore}, ${futureUnlocked}, NOW()
    )
    ON CONFLICT (profile_id) DO UPDATE SET
      psa = EXCLUDED.psa,
      pcs = EXCLUDED.pcs,
      validated_count = EXCLUDED.validated_count,
      year_coverage = EXCLUDED.year_coverage,
      diversity_score = EXCLUDED.diversity_score,
      future_unlocked = EXCLUDED.future_unlocked,
      updated_at = NOW()
  `;

  return {
    profileId,
    psa,
    pcs,
    validatedCount,
    yearCoverage,
    diversityScore,
    futureUnlocked,
    updatedAt: nowIso(),
  };
};

export const getScores = async (profileId: string): Promise<ScoreRow> => {
  const row = await vedaDB.queryRow<{
    profile_id: string;
    psa: number;
    pcs: number;
    validated_count: number;
    year_coverage: number;
    diversity_score: number;
    future_unlocked: boolean;
    updated_at: string;
  }>`
    SELECT profile_id, psa, pcs, validated_count, year_coverage, diversity_score, future_unlocked, updated_at
    FROM veda_score_snapshots
    WHERE profile_id = ${profileId}
  `;

  if (!row) {
    return recomputeScores(profileId);
  }

  return {
    profileId: row.profile_id,
    psa: row.psa,
    pcs: row.pcs,
    validatedCount: row.validated_count,
    yearCoverage: row.year_coverage,
    diversityScore: row.diversity_score,
    futureUnlocked: row.future_unlocked,
    updatedAt: row.updated_at,
  };
};

export const getEntitlements = async (userId: string) => {
  const row = await vedaDB.queryRow<{
    user_id: string;
    plan_code: "basic" | "pro" | "family";
    trial_active: boolean;
    pro_enabled: boolean;
    family_enabled: boolean;
    expires_at: string | null;
    updated_at: string;
  }>`
    SELECT user_id, plan_code, trial_active, pro_enabled, family_enabled, expires_at, updated_at
    FROM veda_entitlements
    WHERE user_id = ${userId}
  `;
  return row;
};

export const recordConsent = async (input: {
  userId: string;
  purposeCode: string;
  policyVersion: string;
}): Promise<string> => {
  const consentId = makeId("cns");
  await vedaDB.exec`
    INSERT INTO veda_consents (consent_id, user_id, purpose_code, policy_version, accepted_at)
    VALUES (${consentId}, ${input.userId}, ${input.purposeCode}, ${input.policyVersion}, NOW())
  `;
  return consentId;
};

export const requestDeletion = async (input: {
  userId: string;
  reason?: string;
}): Promise<string> => {
  const requestId = makeId("del");
  await vedaDB.exec`
    INSERT INTO veda_deletion_requests (request_id, user_id, reason, requested_at, status)
    VALUES (${requestId}, ${input.userId}, ${input.reason ?? null}, NOW(), 'requested')
  `;
  return requestId;
};

export const getConsentStatus = async (userId: string) => {
  const latestConsent = await vedaDB.queryRow<{
    consent_id: string;
    purpose_code: string;
    policy_version: string;
    accepted_at: string;
  }>`
    SELECT consent_id, purpose_code, policy_version, accepted_at
    FROM veda_consents
    WHERE user_id = ${userId}
    ORDER BY accepted_at DESC
    LIMIT 1
  `;

  const consentCount = await vedaDB.queryRow<{ count: number }>`
    SELECT COUNT(*)::int AS count FROM veda_consents WHERE user_id = ${userId}
  `;

  const latestDeletion = await vedaDB.queryRow<{
    request_id: string;
    status: string;
    requested_at: string;
  }>`
    SELECT request_id, status, requested_at
    FROM veda_deletion_requests
    WHERE user_id = ${userId}
    ORDER BY requested_at DESC
    LIMIT 1
  `;

  return {
    userId,
    consentCount: consentCount?.count ?? 0,
    latestConsent,
    latestDeletionRequest: latestDeletion,
  };
};

export const getRectificationPrompts = async (languageCode: LanguageCode): Promise<Array<{ promptId: string; text: string }>> => {
  const rows = await vedaDB.queryAll<{ prompt_id: string; text: string }>`
    SELECT prompt_id, text
    FROM veda_rectification_prompts
    WHERE language_code = ${languageCode} AND active = true
    ORDER BY prompt_id
  `;

  if (rows.length > 0) {
    return rows.map((row) => ({ promptId: row.prompt_id, text: row.text }));
  }

  const fallback = await vedaDB.queryAll<{ prompt_id: string; text: string }>`
    SELECT prompt_id, text
    FROM veda_rectification_prompts
    WHERE language_code = 'en' AND active = true
    ORDER BY prompt_id
  `;

  return fallback.map((row) => ({ promptId: row.prompt_id, text: row.text }));
};
