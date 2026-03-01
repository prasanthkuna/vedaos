import { apiRequest } from "../lib/api";
import type { AtmakarakaPrimer, ForecastDTO, HomeV2DTO, JourneyV2DTO, MonthlyDTO, ProfileSummary, ScoreDTO, StoryResponse, WeeklyDTO } from "./types";

export const vedaApi = {
  createProfile: async (
    token: string,
    body: {
      dob: string;
      tobLocal?: string;
      pobText: string;
      tzIana: string;
      birthTimeCertainty: "verified" | "confident" | "uncertain";
      birthTimeInputMode: "exact_time" | "six_window_approx" | "nakshatra_only" | "unknown";
      birthTimeWindowCode?: string;
      birthNakshatraHint?: string;
      isGuestProfile?: boolean;
    },
  ) => {
    const response = await apiRequest<{ profileId: string }>({
      path: "/profiles/create",
      method: "POST",
      token,
      body,
    });
    if (!response || typeof response.profileId !== "string" || !response.profileId) {
      throw new Error("invalid_response: missing profileId");
    }
    return response;
  },

  listProfiles: (token: string) =>
    apiRequest<{ profiles: ProfileSummary[] }>({
      path: "/profiles/list",
      method: "GET",
      token,
      query: {},
    }),

  assessRisk: (token: string, profileId: string) =>
    apiRequest<{ riskLevel: string; rectificationRequired: boolean; nextStep: "proceed" | "rectification_required" | "rectification_optional" }>({
      path: "/engine/assess-risk",
      method: "POST",
      token,
      body: { profileId },
    }),

  getHomeV2: (token: string, profileId: string, dayStartUtc?: string) =>
    apiRequest<HomeV2DTO>({
      path: "/engine/home-v2",
      method: "GET",
      token,
      query: { profileId, dayStartUtc },
    }),

  generateJourneyV2: (
    token: string,
    input: { profileId: string; mode: "quick5y" | "full15y"; explanationMode?: "simple" | "traditional" },
  ) =>
    apiRequest<JourneyV2DTO>({
      path: "/engine/generate-journey-v2",
      method: "POST",
      token,
      body: input,
    }),

  getAtmakaraka: (token: string, profileId: string) =>
    apiRequest<AtmakarakaPrimer>({
      path: "/engine/atmakaraka-primer",
      method: "POST",
      token,
      body: { profileId },
    }),

  generateStory: (token: string, profileId: string, mode: "quick5y" | "full15y") =>
    apiRequest<StoryResponse>({
      path: "/engine/generate-story",
      method: "POST",
      token,
      body: { profileId, mode },
    }),

  validateClaim: (
    token: string,
    input: { profileId: string; runId: string; claimId: string; label: "true" | "somewhat" | "false" },
  ) =>
    apiRequest<ScoreDTO>({
      path: "/validation/validate-claim",
      method: "POST",
      token,
      body: input,
    }),

  getScores: (token: string, profileId: string) =>
    apiRequest<ScoreDTO>({
      path: "/validation/get-scores",
      method: "GET",
      token,
      query: { profileId },
    }),

  updateCurrentCity: (token: string, input: { profileId: string; cityText: string; lat: number; lon: number }) =>
    apiRequest<{ ok: true }>({
      path: "/profiles/update-current-city",
      method: "PATCH",
      token,
      body: input,
    }),

  generateWeekly: (token: string, input: { profileId: string; weekStartUtc: string }) =>
    apiRequest<{
      weekly: WeeklyDTO;
    }>({
      path: "/engine/generate-weekly",
      method: "POST",
      token,
      body: input,
    }),

  generateForecast: (token: string, profileId: string) =>
    apiRequest<{ provider?: string; promptVersion?: string; forecast: ForecastDTO }>({
      path: "/engine/generate-forecast-12m",
      method: "POST",
      token,
      body: { profileId },
    }),

  generateMonthly: (token: string, input: { profileId: string; monthStartUtc: string }) =>
    apiRequest<{ provider: string; monthStartUtc: string; monthly: MonthlyDTO }>({
      path: "/engine/generate-monthly",
      method: "POST",
      token,
      body: input,
    }),

  recordConsent: (token: string, input: { purposeCode: string; policyVersion: string }) =>
    apiRequest<{ ok: true }>({
      path: "/compliance/record-consent",
      method: "POST",
      token,
      body: input,
    }),

  getRectificationPrompts: (token: string, languageCode: "en" | "hi" | "te") =>
    apiRequest<{ prompts: Array<{ promptId: string; text: string }> }>({
      path: "/engine/rectification-prompts",
      method: "GET",
      token,
      query: { languageCode },
    }),

  submitRectification: (
    token: string,
    input: {
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
    },
  ) =>
    apiRequest<{
      rectRunId: string;
      windowStart: string;
      windowEnd: string;
      confidence: number;
      effectiveTobLocal: string;
    }>({
      path: "/engine/submit-rectification",
      method: "POST",
      token,
      body: input,
    }),

  getProfile: (token: string, profileId: string) =>
    apiRequest<{
      profileId: string;
      birthTimeRiskLevel?: "safe" | "medium" | "high";
      rectificationCompleted: boolean;
      languageCode: "en" | "hi" | "te" | "ta" | "kn" | "ml";
      calendarMode: "civil" | "vedic_sunrise";
      currentCity?: string;
      currentLat?: number;
      currentLon?: number;
      entitlements?: {
        plan_code: "basic" | "pro" | "family";
        trial_active: boolean;
        pro_enabled: boolean;
        family_enabled: boolean;
      } | null;
    }>({
      path: "/profiles/get",
      method: "GET",
      token,
      query: { profileId },
    }),

  updateLanguage: (
    token: string,
    input: {
      profileId: string;
      languageCode: "en" | "hi" | "te" | "ta" | "kn" | "ml";
      languageMode: "auto" | "manual";
    },
  ) =>
    apiRequest<{ ok: true }>({
      path: "/profiles/update-language",
      method: "PATCH",
      token,
      body: input,
    }),

  updateCalendarMode: (token: string, input: { profileId: string; calendarMode: "civil" | "vedic_sunrise" }) =>
    apiRequest<{ ok: true }>({
      path: "/profiles/update-calendar-mode",
      method: "PATCH",
      token,
      body: input,
    }),

  requestDeletion: (token: string, reason?: string) =>
    apiRequest<{ ok: true; status: "requested" }>({
      path: "/compliance/request-deletion",
      method: "POST",
      token,
      body: reason ? { reason } : {},
    }),

  getConsentStatus: (token: string) =>
    apiRequest<{
      consentCount: number;
      latestConsent?: { policy_version: string; accepted_at: string } | null;
      latestDeletionRequest?: { status: string; requested_at: string } | null;
    }>({
      path: "/compliance/get-consent-status",
      method: "GET",
      token,
      query: {},
    }),
};

