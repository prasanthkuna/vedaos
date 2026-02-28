import { api } from "encore.dev/api";
import * as handlers from "../src/services/validation/handlers";
import { bridge } from "../lib/bridge";

export const validateClaim = api(
  { expose: true, method: "POST", path: "/validation.validateClaim" },
  async (params: {
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
  }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.validateClaim,
      method: "POST",
      path: "/validation.validateClaim",
      body: params,
    }),
);

export const getScores = api(
  { expose: true, method: "GET", path: "/validation.getScores" },
  async (params: { profileId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.getScores,
      method: "GET",
      path: "/validation.getScores",
      query: params,
    }),
);
