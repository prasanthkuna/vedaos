import { Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";

export const startTrial = api(
  { expose: true, method: "POST", path: "/billing/start-trial" },
  async (params: { authorization?: Header<"Authorization">; userId?: string; platform: "ios" | "android" }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    return {
      userId,
      deferred: true,
      message: "Billing integration is intentionally deferred for rollout +1 week.",
    };
  },
);

export const verifyPurchase = api(
  { expose: true, method: "POST", path: "/billing/verify-purchase" },
  async (params: {
    authorization?: Header<"Authorization">;
    userId?: string;
    platform: "ios" | "android";
    receiptOrToken: string;
  }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    return {
      userId,
      deferred: true,
      message: "Billing integration is intentionally deferred for rollout +1 week.",
    };
  },
);

export const webhook = api(
  { expose: true, method: "POST", path: "/billing/webhook" },
  async (_params: { eventType?: string; platform?: "ios" | "android"; userId?: string; status?: string }) => ({
    accepted: true,
    deferred: true,
  }),
);

export const entitlements = api(
  { expose: true, method: "GET", path: "/billing/entitlements" },
  async (params: { authorization?: Header<"Authorization">; userId?: string }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    return {
      userId,
      planCode: "basic" as const,
      trialActive: false,
      proEnabled: false,
      familyEnabled: false,
      deferred: true,
    };
  },
);
