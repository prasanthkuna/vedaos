import { api } from "encore.dev/api";
import * as handlers from "../src/services/profiles/handlers";
import { bridge } from "../lib/bridge";

export const create = api(
  { expose: true, method: "POST", path: "/profiles.create" },
  async (params: {
    userId?: string;
    displayName: string;
    dob: string;
    tobLocal: string;
    pobText: string;
    tzIana: string;
    lat?: number;
    lon?: number;
    birthTimeCertainty: "verified" | "confident" | "uncertain";
    isGuestProfile?: boolean;
  }) =>
    bridge<{ profileId: string; userId: string }>({
      handler: handlers.createProfile,
      method: "POST",
      path: "/profiles.create",
      body: params,
    }),
);

export const get = api(
  { expose: true, method: "GET", path: "/profiles.get" },
  async (params: { profileId: string }) =>
    bridge<Record<string, unknown>>({
      handler: handlers.getProfile,
      method: "GET",
      path: "/profiles.get",
      query: params,
    }),
);

export const updateLanguage = api(
  { expose: true, method: "PATCH", path: "/profiles.updateLanguage" },
  async (params: { profileId: string; languageCode: "en" | "hi" | "te" | "ta" | "kn" | "ml"; languageMode: "auto" | "manual" }) =>
    bridge<{ ok: true }>({
      handler: handlers.updateLanguage,
      method: "PATCH",
      path: "/profiles.updateLanguage",
      body: params,
    }),
);

export const updateCurrentCity = api(
  { expose: true, method: "PATCH", path: "/profiles.updateCurrentCity" },
  async (params: { profileId: string; cityText: string; lat: number; lon: number }) =>
    bridge<{ ok: true }>({
      handler: handlers.updateCurrentCity,
      method: "PATCH",
      path: "/profiles.updateCurrentCity",
      body: params,
    }),
);

export const updateCalendarMode = api(
  { expose: true, method: "PATCH", path: "/profiles.updateCalendarMode" },
  async (params: { profileId: string; calendarMode: "civil" | "vedic_sunrise" }) =>
    bridge<{ ok: true }>({
      handler: handlers.updateCalendarMode,
      method: "PATCH",
      path: "/profiles.updateCalendarMode",
      body: params,
    }),
);
