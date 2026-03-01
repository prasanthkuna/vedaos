import { createClerkClient } from "@clerk/backend";

type Method = "GET" | "POST" | "PATCH";

type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

const env = {
  apiBaseUrl: process.env.API_BASE_URL?.trim() || "https://staging-vedaos-be-oib2.encr.app",
  authToken: process.env.AUTH_TOKEN?.trim() || "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY?.trim() || "",
  expectPro: process.env.EXPECT_PRO === "true",
  displayName: process.env.TEST_DISPLAY_NAME?.trim() || "kuna",
  dob: process.env.TEST_DOB?.trim() || "1992-10-24",
  tobLocal: process.env.TEST_TOB_LOCAL?.trim() || "00:30",
  pobText: process.env.TEST_POB_TEXT?.trim() || "Gudivada",
  tzIana: process.env.TEST_TZ?.trim() || "Asia/Kolkata",
  cityText: process.env.TEST_CITY?.trim() || "Gudivada",
  cityLat: Number(process.env.TEST_CITY_LAT ?? "16.435"),
  cityLon: Number(process.env.TEST_CITY_LON ?? "80.995"),
  testUserId: process.env.TEST_USER_ID?.trim() || "",
};

const makeUrl = (path: string, query?: Record<string, string>) => {
  const url = new URL(path, env.apiBaseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  return url.toString();
};

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { nonJson: text };
  }
};

const request = async <T>(args: {
  path: string;
  method: Method;
  token: string;
  query?: Record<string, string>;
  body?: unknown;
}): Promise<T> => {
  const res = await fetch(makeUrl(args.path, args.query), {
    method: args.method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.token}`,
    },
    ...(args.body ? { body: JSON.stringify(args.body) } : {}),
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    const err = payload as ApiErrorPayload | null;
    throw new Error(`${res.status}:${err?.code ?? "unknown"}:${err?.message ?? "request_failed"}`);
  }
  return payload as T;
};

const requestExpectError = async (args: {
  path: string;
  method: Method;
  token: string;
  query?: Record<string, string>;
  body?: unknown;
}): Promise<ApiErrorPayload> => {
  const res = await fetch(makeUrl(args.path, args.query), {
    method: args.method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.token}`,
    },
    ...(args.body ? { body: JSON.stringify(args.body) } : {}),
  });
  const payload = (await parseJson(res)) as ApiErrorPayload | null;
  if (res.ok) {
    throw new Error(`expected_error_but_got_success:${args.path}`);
  }
  return payload ?? {};
};

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`assert_failed:${message}`);
};

const getToken = async () => {
  if (env.authToken) return env.authToken;
  if (!env.clerkSecretKey) {
    throw new Error("missing_auth: set AUTH_TOKEN or CLERK_SECRET_KEY");
  }
  const clerk = createClerkClient({ secretKey: env.clerkSecretKey });
  const userId = env.testUserId || (await clerk.users.getUserList({ limit: 1 })).data[0]?.id;
  if (!userId) {
    throw new Error("missing_clerk_user: set TEST_USER_ID or create one Clerk user in dashboard");
  }
  const session = await clerk.sessions.createSession({ userId });
  const token = await clerk.sessions.getToken(session.id);
  return token.jwt;
};

const run = async () => {
  const token = await getToken();
  console.log(`[smoke] base=${env.apiBaseUrl}`);

  const consentDate = "2026-03-01";
  await request<{ ok: true }>({
    path: "/compliance/record-consent",
    method: "POST",
    token,
    body: { purposeCode: "chart_generation", policyVersion: consentDate },
  });

  const created = await request<{ profileId: string }>({
    path: "/profiles/create",
    method: "POST",
    token,
    body: {
      displayName: env.displayName,
      dob: env.dob,
      tobLocal: env.tobLocal,
      pobText: env.pobText,
      tzIana: env.tzIana,
      birthTimeCertainty: "confident",
      isGuestProfile: false,
    },
  });
  assert(typeof created.profileId === "string" && created.profileId.length > 0, "profileId_missing");
  const profileId = created.profileId;
  console.log(`[smoke] profileId=${profileId}`);

  const listed = await request<{ profiles: Array<{ profileId: string }> }>({
    path: "/profiles/list",
    method: "GET",
    token,
  });
  assert(listed.profiles.some((p) => p.profileId === profileId), "profile_not_in_list");

  const risk = await request<{ riskLevel: "safe" | "medium" | "high" }>({
    path: "/engine/assess-risk",
    method: "POST",
    token,
    body: { profileId },
  });
  assert(["safe", "medium", "high"].includes(risk.riskLevel), "invalid_risk_level");

  const atmakaraka = await request<{ planet: string; narrativeKey: string; resonanceQuestion: string }>({
    path: "/engine/atmakaraka-primer",
    method: "POST",
    token,
    body: { profileId },
  });
  assert(Boolean(atmakaraka.planet), "atmakaraka_missing");

  const quick = await request<{
    runId: string;
    feed: { years: Array<{ year: number; points: Array<{ claimId: string }> }> };
  }>({
    path: "/engine/generate-story",
    method: "POST",
    token,
    body: { profileId, mode: "quick5y" },
  });
  assert(Boolean(quick.runId), "quick_run_id_missing");
  assert(quick.feed.years.length > 0, "quick_years_missing");
  const firstClaimId = quick.feed.years[0]?.points[0]?.claimId;
  assert(Boolean(firstClaimId), "quick_claim_missing");

  const homeV2 = await request<{
    nextStep: "proceed" | "rectification_required" | "rectification_optional";
    today: { nowActivePhase: { md: string; ad: string; pd: string } };
  }>({
    path: "/engine/home-v2",
    method: "GET",
    token,
    query: { profileId },
  });
  assert(["proceed", "rectification_required", "rectification_optional"].includes(homeV2.nextStep), "home_v2_next_step_invalid");
  assert(Boolean(homeV2.today.nowActivePhase.md), "home_v2_phase_missing");

  const journeyV2 = await request<{
    phaseRunId: string;
    journey: { segments: Array<{ segmentId: string; narrative: { phaseMeaning: string } }> };
  }>({
    path: "/engine/generate-journey-v2",
    method: "POST",
    token,
    body: { profileId, mode: "quick5y" },
  });
  assert(Boolean(journeyV2.phaseRunId), "journey_v2_run_missing");
  assert(journeyV2.journey.segments.length > 0, "journey_v2_segments_missing");

  const validation = await request<{
    validatedCount: number;
    unlock: { quickProofEligible: boolean };
  }>({
    path: "/validation/validate-claim",
    method: "POST",
    token,
    body: {
      profileId,
      runId: quick.runId,
      claimId: firstClaimId,
      label: "true",
    },
  });
  assert(validation.validatedCount >= 1, "validation_not_recorded");

  const scores = await request<{
    validatedCount: number;
    unlock: { quickProofEligible: boolean; reasons: string[] };
  }>({
    path: "/validation/get-scores",
    method: "GET",
    token,
    query: { profileId },
  });
  assert(scores.validatedCount >= 1, "scores_not_updated");

  await request<{ ok: true }>({
    path: "/profiles/update-current-city",
    method: "PATCH",
    token,
    body: { profileId, cityText: env.cityText, lat: env.cityLat, lon: env.cityLon },
  });

  const weekStartUtc = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
  if (env.expectPro) {
    const weekly = await request<{ weekly: { theme: string } }>({
      path: "/engine/generate-weekly",
      method: "POST",
      token,
      body: { profileId, weekStartUtc },
    });
    assert(Boolean(weekly.weekly.theme), "weekly_theme_missing");

    const forecast = await request<{ forecast: { summary: string } }>({
      path: "/engine/generate-forecast-12m",
      method: "POST",
      token,
      body: { profileId },
    });
    assert(Boolean(forecast.forecast.summary), "forecast_summary_missing");
  } else {
    const weeklyError = await requestExpectError({
      path: "/engine/generate-weekly",
      method: "POST",
      token,
      body: { profileId, weekStartUtc },
    });
    assert(weeklyError.message === "pro_required", "weekly_should_require_pro");

    const forecastError = await requestExpectError({
      path: "/engine/generate-forecast-12m",
      method: "POST",
      token,
      body: { profileId },
    });
    assert(forecastError.message === "pro_required", "forecast_should_require_pro");
  }

  const full = await request<{ runId: string; feed: { years: Array<{ year: number }> } }>({
    path: "/engine/generate-story",
    method: "POST",
    token,
    body: { profileId, mode: "full15y" },
  });
  assert(Boolean(full.runId), "full_run_missing");
  assert(full.feed.years.length === 15, "full_year_count_invalid");

  await request<{ ok: true }>({
    path: "/profiles/update-language",
    method: "PATCH",
    token,
    body: { profileId, languageCode: "te", languageMode: "manual" },
  });

  await request<{ ok: true }>({
    path: "/profiles/update-calendar-mode",
    method: "PATCH",
    token,
    body: { profileId, calendarMode: "vedic_sunrise" },
  });

  const profile = await request<{ profileId: string; languageCode: string; calendarMode: string }>({
    path: "/profiles/get",
    method: "GET",
    token,
    query: { profileId },
  });
  assert(profile.profileId === profileId, "profile_get_mismatch");
  assert(profile.languageCode === "te", "language_not_updated");
  assert(profile.calendarMode === "vedic_sunrise", "calendar_mode_not_updated");

  const consentStatus = await request<{ consentCount: number }>({
    path: "/compliance/get-consent-status",
    method: "GET",
    token,
  });
  assert(consentStatus.consentCount >= 1, "consent_count_invalid");

  console.log("[smoke] PASS");
  console.log(
    JSON.stringify(
      {
        profileId,
        quickRunId: quick.runId,
        fullRunId: full.runId,
        risk: risk.riskLevel,
        validatedCount: scores.validatedCount,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error("[smoke] FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

