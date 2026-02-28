import { apiRequest } from "../lib/api";
import type { ScoreDTO, StoryFeed } from "./types";

export const vedaApi = {
  createProfile: (token: string, body: Record<string, unknown>) =>
    apiRequest<{ profileId: string }>({
      path: "/profiles.create",
      method: "POST",
      token,
      body,
    }),

  assessRisk: (token: string, profileId: string) =>
    apiRequest<{ riskLevel: string }>({
      path: "/engine.assessRisk",
      method: "POST",
      token,
      body: { profileId },
    }),

  getAtmakaraka: (token: string, profileId: string) =>
    apiRequest<{ planet: string }>({
      path: "/engine.getAtmakarakaPrimer",
      method: "POST",
      token,
      body: { profileId },
    }),

  generateStory: (token: string, profileId: string, mode: "quick5y" | "full15y") =>
    apiRequest<{ runId: string; feed: StoryFeed }>({
      path: "/engine.generateStory",
      method: "POST",
      token,
      body: { profileId, mode },
    }),

  validateClaim: (
    token: string,
    input: { profileId: string; runId: string; claimId: string; label: "true" | "somewhat" | "false" },
  ) =>
    apiRequest<ScoreDTO>({
      path: "/validation.validateClaim",
      method: "POST",
      token,
      body: input,
    }),

  getScores: (token: string, profileId: string) =>
    apiRequest<ScoreDTO>({
      path: "/validation.getScores",
      method: "GET",
      token,
      query: { profileId },
    }),

  updateCurrentCity: (token: string, input: { profileId: string; cityText: string; lat: number; lon: number }) =>
    apiRequest<{ ok: true }>({
      path: "/profiles.updateCurrentCity",
      method: "PATCH",
      token,
      body: input,
    }),

  generateWeekly: (token: string, input: { profileId: string; weekStartUtc: string }) =>
    apiRequest<{
      weekly: { theme: string; frictionWindows: Array<{ reason: string }> };
    }>({
      path: "/engine.generateWeekly",
      method: "POST",
      token,
      body: input,
    }),

  generateForecast: (token: string, profileId: string) =>
    apiRequest<{ forecast: { summary: string } }>({
      path: "/engine.generateForecast12m",
      method: "POST",
      token,
      body: { profileId },
    }),

  recordConsent: (token: string, input: { purposeCode: string; policyVersion: string }) =>
    apiRequest<{ ok: true }>({
      path: "/compliance.recordConsent",
      method: "POST",
      token,
      body: input,
    }),
};
