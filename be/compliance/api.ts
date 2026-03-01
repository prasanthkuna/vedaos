import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  ensureUser,
  getConsentStatus as getConsentStatusRepo,
  recordConsent as recordConsentRepo,
  requestDeletion as requestDeletionRepo,
} from "../src/persistence/repo";

export const recordConsent = api(
  { expose: true, method: "POST", path: "/compliance/record-consent" },
  async (params: { authorization?: Header<"Authorization">; userId?: string; purposeCode: string; policyVersion: string }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    if (userId !== authUserId) throw APIError.permissionDenied("cross_user_forbidden");

    await ensureUser(userId);
    const consentId = await recordConsentRepo({
      userId,
      purposeCode: params.purposeCode,
      policyVersion: params.policyVersion,
    });

    return { ok: true as const, consentId };
  },
);

export const requestDeletion = api(
  { expose: true, method: "POST", path: "/compliance/request-deletion" },
  async (params: { authorization?: Header<"Authorization">; userId?: string; reason?: string }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    if (userId !== authUserId) throw APIError.permissionDenied("cross_user_forbidden");

    await ensureUser(userId);
    const requestId = await requestDeletionRepo({ userId, reason: params.reason });

    return { ok: true as const, requestId, status: "requested" as const };
  },
);

export const getConsentStatus = api(
  { expose: true, method: "GET", path: "/compliance/get-consent-status" },
  async (params: { authorization?: Header<"Authorization">; userId?: string }) => {
    const authUserId = await requireUserId(params.authorization);
    const userId = params.userId ?? authUserId;
    if (userId !== authUserId) throw APIError.permissionDenied("cross_user_forbidden");

    return getConsentStatusRepo(userId);
  },
);
