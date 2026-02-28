import { api } from "encore.dev/api";
import * as handlers from "../src/services/compliance/handlers";
import { bridge } from "../lib/bridge";

export const recordConsent = api(
  { expose: true, method: "POST", path: "/compliance.recordConsent" },
  async (params: { userId: string; purposeCode: string; policyVersion: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.recordConsent,
      method: "POST",
      path: "/compliance.recordConsent",
      body: params,
    }),
);

export const requestDeletion = api(
  { expose: true, method: "POST", path: "/compliance.requestDeletion" },
  async (params: { userId: string; reason?: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.requestDeletion,
      method: "POST",
      path: "/compliance.requestDeletion",
      body: params,
    }),
);

export const getConsentStatus = api(
  { expose: true, method: "GET", path: "/compliance.getConsentStatus" },
  async (params: { userId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.getConsentStatus,
      method: "GET",
      path: "/compliance.getConsentStatus",
      query: params,
    }),
);
