import { z } from "zod";

export const languageCodeSchema = z.enum(["en", "hi", "te", "ta", "kn", "ml"]);
export const languageModeSchema = z.enum(["auto", "manual"]);
export const calendarModeSchema = z.enum(["civil", "vedic_sunrise"]);
export const birthTimeCertaintySchema = z.enum(["verified", "confident", "uncertain"]);
export const validationLabelSchema = z.enum(["true", "somewhat", "false"]);

export const createProfileBodySchema = z.object({
  userId: z.string().min(1).optional(),
  displayName: z.string().min(1),
  dob: z.string().min(4),
  tobLocal: z.string().min(1),
  pobText: z.string().min(1),
  tzIana: z.string().min(1),
  lat: z.number().optional(),
  lon: z.number().optional(),
  birthTimeCertainty: birthTimeCertaintySchema,
  isGuestProfile: z.boolean().optional(),
});

export const profileIdQuerySchema = z.object({
  profileId: z.string().min(1),
});

export const updateLanguageBodySchema = z.object({
  profileId: z.string().min(1),
  languageCode: languageCodeSchema,
  languageMode: languageModeSchema,
});

export const updateCurrentCityBodySchema = z.object({
  profileId: z.string().min(1),
  cityText: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
});

export const updateCalendarModeBodySchema = z.object({
  profileId: z.string().min(1),
  calendarMode: calendarModeSchema,
});

export const profileIdBodySchema = z.object({
  profileId: z.string().min(1),
});

export const rectificationPromptsQuerySchema = z.object({
  engineVersion: z.string().min(1).default("v0.1"),
  languageCode: languageCodeSchema.default("en"),
});

export const rectificationAnswerSchema = z.object({
  promptId: z.string().min(1),
  yn: z.boolean().optional(),
  year: z.number().int().optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  rangeStartYear: z.number().int().optional(),
  rangeEndYear: z.number().int().optional(),
  textValue: z.string().optional(),
});

export const submitRectificationBodySchema = z.object({
  profileId: z.string().min(1),
  answers: z.array(rectificationAnswerSchema).min(1),
});

export const generateStoryBodySchema = z.object({
  profileId: z.string().min(1),
  mode: z.enum(["quick5y", "full15y"]),
});

export const generateWeeklyBodySchema = z.object({
  profileId: z.string().min(1),
  weekStartUtc: z.string().datetime(),
});

export const validateClaimBodySchema = z.object({
  profileId: z.string().min(1),
  runId: z.string().min(1),
  claimId: z.string().min(1),
  label: validationLabelSchema,
  topics: z.array(z.string()).max(2).optional(),
  direction: z.enum(["better", "worse"]).optional(),
  confidenceLevel: z.enum(["high", "medium", "low"]).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  wrongReason: z.string().optional(),
  note: z.string().optional(),
});

export const getScoresQuerySchema = z.object({
  profileId: z.string().min(1),
});

export const startTrialBodySchema = z.object({
  userId: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export const verifyPurchaseBodySchema = z.object({
  userId: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  receiptOrToken: z.string().min(1),
});

export const entitlementsQuerySchema = z.object({
  userId: z.string().min(1),
});

export const recordConsentBodySchema = z.object({
  userId: z.string().min(1),
  purposeCode: z.string().min(1),
  policyVersion: z.string().min(1),
});

export const requestDeletionBodySchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
});

export const consentStatusQuerySchema = z.object({
  userId: z.string().min(1),
});
