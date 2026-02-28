import { json, parseJson, parseQuery } from "../../lib/http";
import { store } from "../../store/memory";
import { entitlementsQuerySchema, startTrialBodySchema, verifyPurchaseBodySchema } from "../../schemas/api";

const nowIso = () => new Date().toISOString();

const trialEndsAt = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString();
};

export const startTrial = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, startTrialBodySchema);
  store.ensureUser(body.userId);

  const ent = store.entitlements.get(body.userId);
  if (!ent) {
    return json({ error: "user_not_found" }, 404);
  }

  ent.planCode = "pro";
  ent.trialActive = true;
  ent.proEnabled = true;
  ent.updatedAt = nowIso();
  ent.expiresAt = trialEndsAt();
  store.entitlements.set(body.userId, ent);

  return json({ trialEndsAt: ent.expiresAt });
};

export const verifyPurchase = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, verifyPurchaseBodySchema);
  store.ensureUser(body.userId);

  const ent = store.entitlements.get(body.userId);
  if (!ent) {
    return json({ error: "user_not_found" }, 404);
  }

  ent.planCode = "pro";
  ent.trialActive = false;
  ent.proEnabled = true;
  ent.updatedAt = nowIso();
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  ent.expiresAt = d.toISOString();
  store.entitlements.set(body.userId, ent);

  return json({ ok: true, verified: true, expiresAt: ent.expiresAt });
};

export const webhook = async (_req: Request): Promise<Response> => {
  // Placeholder for provider callbacks. Kept idempotent and non-failing for now.
  return json({ ok: true });
};

export const entitlements = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const query = parseQuery(url, entitlementsQuerySchema);
  const ent = store.entitlements.get(query.userId);

  if (!ent) {
    return json({ error: "user_not_found" }, 404);
  }

  return json(ent);
};
