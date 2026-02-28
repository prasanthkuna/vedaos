import { withErrorBoundary, json } from "./http";
import * as profiles from "../services/profiles/handlers";
import * as engine from "../services/engine/handlers";
import * as validation from "../services/validation/handlers";
import * as billing from "../services/billing/handlers";
import * as compliance from "../services/compliance/handlers";

type Handler = (req: Request) => Promise<Response>;

const key = (method: string, path: string) => `${method.toUpperCase()} ${path}`;

const routes = new Map<string, Handler>([
  [key("POST", "/profiles.create"), profiles.createProfile],
  [key("GET", "/profiles.get"), profiles.getProfile],
  [key("PATCH", "/profiles.updateLanguage"), profiles.updateLanguage],
  [key("PATCH", "/profiles.updateCurrentCity"), profiles.updateCurrentCity],
  [key("PATCH", "/profiles.updateCalendarMode"), profiles.updateCalendarMode],

  [key("POST", "/engine.assessRisk"), engine.assessRisk],
  [key("POST", "/engine.getAtmakarakaPrimer"), engine.getAtmakarakaPrimer],
  [key("GET", "/engine.getRectificationPrompts"), engine.getRectificationPrompts],
  [key("POST", "/engine.submitRectification"), engine.submitRectification],
  [key("POST", "/engine.generateStory"), engine.generateStory],
  [key("POST", "/engine.generateForecast12m"), engine.generateForecast12m],
  [key("POST", "/engine.generateWeekly"), engine.generateWeekly],

  [key("POST", "/validation.validateClaim"), validation.validateClaim],
  [key("GET", "/validation.getScores"), validation.getScores],

  [key("POST", "/billing.startTrial"), billing.startTrial],
  [key("POST", "/billing.verifyPurchase"), billing.verifyPurchase],
  [key("POST", "/billing.webhook"), billing.webhook],
  [key("GET", "/billing.entitlements"), billing.entitlements],

  [key("POST", "/compliance.recordConsent"), compliance.recordConsent],
  [key("POST", "/compliance.requestDeletion"), compliance.requestDeletion],
  [key("GET", "/compliance.getConsentStatus"), compliance.getConsentStatus],
]);

export const router = async (req: Request): Promise<Response> =>
  withErrorBoundary(async () => {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "veda-be", status: "healthy" });
    }

    if (url.pathname === "/ready") {
      return json({ ok: true, service: "veda-be", status: "ready" });
    }

    if (url.pathname === "/api/version") {
      return json({ name: "veda-be", version: "0.2.0" });
    }

    const handler = routes.get(key(req.method, url.pathname));
    if (!handler) {
      return json({ error: "not_found" }, 404);
    }

    return handler(req);
  });
