import { api } from "encore.dev/api";
import * as handlers from "../src/services/engine/handlers";
import { bridge } from "../lib/bridge";

export const assessRisk = api(
  { expose: true, method: "POST", path: "/engine.assessRisk" },
  async (params: { profileId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.assessRisk,
      method: "POST",
      path: "/engine.assessRisk",
      body: params,
    }),
);

export const getAtmakarakaPrimer = api(
  { expose: true, method: "POST", path: "/engine.getAtmakarakaPrimer" },
  async (params: { profileId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.getAtmakarakaPrimer,
      method: "POST",
      path: "/engine.getAtmakarakaPrimer",
      body: params,
    }),
);

export const getRectificationPrompts = api(
  { expose: true, method: "GET", path: "/engine.getRectificationPrompts" },
  async (params: { engineVersion?: string; languageCode?: "en" | "hi" | "te" | "ta" | "kn" | "ml" }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.getRectificationPrompts,
      method: "GET",
      path: "/engine.getRectificationPrompts",
      query: params,
    }),
);

export const submitRectification = api(
  { expose: true, method: "POST", path: "/engine.submitRectification" },
  async (params: {
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
  }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.submitRectification,
      method: "POST",
      path: "/engine.submitRectification",
      body: params,
    }),
);

export const generateStory = api(
  { expose: true, method: "POST", path: "/engine.generateStory" },
  async (params: { profileId: string; mode: "quick5y" | "full15y" }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.generateStory,
      method: "POST",
      path: "/engine.generateStory",
      body: params,
    }),
);

export const generateForecast12m = api(
  { expose: true, method: "POST", path: "/engine.generateForecast12m" },
  async (params: { profileId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.generateForecast12m,
      method: "POST",
      path: "/engine.generateForecast12m",
      body: params,
    }),
);

export const generateWeekly = api(
  { expose: true, method: "POST", path: "/engine.generateWeekly" },
  async (params: { profileId: string; weekStartUtc: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.generateWeekly,
      method: "POST",
      path: "/engine.generateWeekly",
      body: params,
    }),
);
