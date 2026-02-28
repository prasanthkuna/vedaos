import { APIError, Header, api } from "encore.dev/api";
import { requireUserId } from "../src/auth/clerk";
import {
  createProfile as createProfileRow,
  ensureUser,
  getEntitlements,
  getProfileByUser,
  guestProfileCount,
  updateProfileCalendarMode,
  updateProfileCity,
  updateProfileLanguage,
} from "../src/persistence/repo";

export const create = api(
  { expose: true, method: "POST", path: "/profiles.create" },
  async (params: {
    authorization?: Header<"Authorization">;
    displayName: string;
    dob: string;
    tobLocal: string;
    pobText: string;
    tzIana: string;
    lat?: number;
    lon?: number;
    birthTimeCertainty: "verified" | "confident" | "uncertain";
    isGuestProfile?: boolean;
  }) => {
    const userId = await requireUserId(params.authorization);
    await ensureUser(userId);

    const isGuest = params.isGuestProfile ?? false;
    if (isGuest) {
      const guestCount = await guestProfileCount(userId);
      if (guestCount >= 1) {
        throw APIError.failedPrecondition("guest_profile_limit_reached");
      }
    }

    const profileId = await createProfileRow({
      userId,
      displayName: params.displayName,
      dob: params.dob,
      tobLocal: params.tobLocal,
      pobText: params.pobText,
      tzIana: params.tzIana,
      lat: params.lat,
      lon: params.lon,
      birthTimeCertainty: params.birthTimeCertainty,
      isGuestProfile: isGuest,
    });

    return { profileId };
  },
);

export const get = api(
  { expose: true, method: "GET", path: "/profiles.get" },
  async (params: { authorization?: Header<"Authorization">; profileId: string }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    const entitlements = await getEntitlements(userId);
    return { ...profile, entitlements };
  },
);

export const updateLanguage = api(
  { expose: true, method: "PATCH", path: "/profiles.updateLanguage" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; languageCode: "en" | "hi" | "te" | "ta" | "kn" | "ml"; languageMode: "auto" | "manual" }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    await updateProfileLanguage(params.profileId, params.languageCode, params.languageMode);
    return { ok: true as const };
  },
);

export const updateCurrentCity = api(
  { expose: true, method: "PATCH", path: "/profiles.updateCurrentCity" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; cityText: string; lat: number; lon: number }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    await updateProfileCity(params.profileId, params.cityText, params.lat, params.lon);
    return { ok: true as const };
  },
);

export const updateCalendarMode = api(
  { expose: true, method: "PATCH", path: "/profiles.updateCalendarMode" },
  async (params: { authorization?: Header<"Authorization">; profileId: string; calendarMode: "civil" | "vedic_sunrise" }) => {
    const userId = await requireUserId(params.authorization);
    const profile = await getProfileByUser(params.profileId, userId);
    if (!profile) throw APIError.notFound("profile_not_found");

    await updateProfileCalendarMode(params.profileId, params.calendarMode);
    return { ok: true as const };
  },
);
