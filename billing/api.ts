import { api } from "encore.dev/api";
import * as handlers from "../src/services/billing/handlers";
import { bridge } from "../lib/bridge";

export const startTrial = api(
  { expose: true, method: "POST", path: "/billing.startTrial" },
  async (params: { userId: string; platform: "ios" | "android" }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.startTrial,
      method: "POST",
      path: "/billing.startTrial",
      body: params,
    }),
);

export const verifyPurchase = api(
  { expose: true, method: "POST", path: "/billing.verifyPurchase" },
  async (params: { userId: string; platform: "ios" | "android"; receiptOrToken: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.verifyPurchase,
      method: "POST",
      path: "/billing.verifyPurchase",
      body: params,
    }),
);

export const webhook = api(
  { expose: true, method: "POST", path: "/billing.webhook" },
  async (params: { eventType?: string; platform?: "ios" | "android"; userId?: string; status?: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.webhook,
      method: "POST",
      path: "/billing.webhook",
      body: params,
    }),
);

export const entitlements = api(
  { expose: true, method: "GET", path: "/billing.entitlements" },
  async (params: { userId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.entitlements,
      method: "GET",
      path: "/billing.entitlements",
      query: params,
    }),
);
