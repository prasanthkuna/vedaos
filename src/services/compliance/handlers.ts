import { json, parseJson, parseQuery } from "../../lib/http";
import { makeId } from "../../lib/id";
import { store } from "../../store/memory";
import { consentStatusQuerySchema, recordConsentBodySchema, requestDeletionBodySchema } from "../../schemas/api";

const nowIso = () => new Date().toISOString();

export const recordConsent = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, recordConsentBodySchema);
  store.ensureUser(body.userId);

  const record = {
    consentId: makeId("cns"),
    userId: body.userId,
    purposeCode: body.purposeCode,
    policyVersion: body.policyVersion,
    acceptedAt: nowIso(),
  };

  const list = store.consents.get(body.userId) ?? [];
  list.push(record);
  store.consents.set(body.userId, list);

  return json({ ok: true, consentId: record.consentId });
};

export const requestDeletion = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, requestDeletionBodySchema);
  store.ensureUser(body.userId);

  const record = {
    requestId: makeId("del"),
    userId: body.userId,
    reason: body.reason,
    requestedAt: nowIso(),
    status: "requested" as const,
  };

  const list = store.deletions.get(body.userId) ?? [];
  list.push(record);
  store.deletions.set(body.userId, list);

  return json({ ok: true, requestId: record.requestId, status: record.status });
};

export const getConsentStatus = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const query = parseQuery(url, consentStatusQuerySchema);

  const consents = store.consents.get(query.userId) ?? [];
  const deletions = store.deletions.get(query.userId) ?? [];

  return json({
    userId: query.userId,
    consentCount: consents.length,
    latestConsent: consents[consents.length - 1] ?? null,
    latestDeletionRequest: deletions[deletions.length - 1] ?? null,
  });
};
