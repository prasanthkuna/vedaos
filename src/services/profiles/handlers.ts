import { makeId } from "@/lib/id";
import { json, parseJson, parseQuery } from "@/lib/http";
import { store } from "@/store/memory";
import {
  createProfileBodySchema,
  profileIdQuerySchema,
  updateCalendarModeBodySchema,
  updateCurrentCityBodySchema,
  updateLanguageBodySchema,
} from "@/schemas/api";

const nowIso = () => new Date().toISOString();

export const createProfile = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, createProfileBodySchema);
  const user = store.ensureUser(body.userId);

  const profileId = makeId("pro");
  const timestamp = nowIso();
  const profile = {
    profileId,
    userId: user.userId,
    displayName: body.displayName,
    dob: body.dob,
    tobLocal: body.tobLocal,
    pobText: body.pobText,
    tzIana: body.tzIana,
    lat: body.lat,
    lon: body.lon,
    birthTimeCertainty: body.birthTimeCertainty,
    languageCode: "en" as const,
    languageMode: "auto" as const,
    calendarMode: "civil" as const,
    isGuestProfile: body.isGuestProfile ?? false,
    rectificationCompleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.profiles.set(profileId, profile);
  store.ensureScore(profileId);

  return json({ profileId, userId: user.userId }, 201);
};

export const getProfile = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const query = parseQuery(url, profileIdQuerySchema);
  const profile = store.profiles.get(query.profileId);

  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  const entitlements = store.entitlements.get(profile.userId) ?? null;
  return json({ ...profile, entitlements });
};

export const updateLanguage = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, updateLanguageBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  profile.languageCode = body.languageCode;
  profile.languageMode = body.languageMode;
  profile.updatedAt = nowIso();
  store.profiles.set(profile.profileId, profile);

  return json({ ok: true });
};

export const updateCurrentCity = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, updateCurrentCityBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  profile.currentCity = body.cityText;
  profile.currentLat = body.lat;
  profile.currentLon = body.lon;
  profile.updatedAt = nowIso();
  store.profiles.set(profile.profileId, profile);

  return json({ ok: true });
};

export const updateCalendarMode = async (req: Request): Promise<Response> => {
  const body = await parseJson(req, updateCalendarModeBodySchema);
  const profile = store.profiles.get(body.profileId);
  if (!profile) {
    return json({ error: "profile_not_found" }, 404);
  }

  profile.calendarMode = body.calendarMode;
  profile.updatedAt = nowIso();
  store.profiles.set(profile.profileId, profile);

  return json({ ok: true });
};
