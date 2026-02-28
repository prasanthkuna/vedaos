export type Id = string;

export type BirthTimeCertainty = "verified" | "confident" | "uncertain";
export type LanguageCode = "en" | "hi" | "te" | "ta" | "kn" | "ml";
export type LanguageMode = "auto" | "manual";
export type CalendarMode = "civil" | "vedic_sunrise";
export type RiskLevel = "safe" | "medium" | "high";
export type ClaimClass = "event" | "decision" | "descriptor" | "stabilization";
export type ValidationLabel = "true" | "somewhat" | "false";
export type ConfidenceLevel = "high" | "medium" | "low";
export type PlanCode = "basic" | "pro" | "family";

export type User = {
  userId: Id;
  createdAt: string;
};

export type Profile = {
  profileId: Id;
  userId: Id;
  displayName: string;
  dob: string;
  tobLocal: string;
  pobText: string;
  tzIana: string;
  lat?: number;
  lon?: number;
  birthTimeCertainty: BirthTimeCertainty;
  languageCode: LanguageCode;
  languageMode: LanguageMode;
  calendarMode: CalendarMode;
  currentCity?: string;
  currentLat?: number;
  currentLon?: number;
  isGuestProfile: boolean;
  birthTimeRiskLevel?: RiskLevel;
  rectifiedTobLocal?: string;
  rectificationCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Claim = {
  claimId: Id;
  runId: Id;
  profileId: Id;
  year: number;
  text: string;
  weightClass: ClaimClass;
  confidenceScore: number;
  templateCode: string;
  triggerFlags: string[];
};

export type StoryRun = {
  runId: Id;
  profileId: Id;
  mode: "quick5y" | "full15y";
  engineVersion: string;
  years: number[];
  claimIds: Id[];
  createdAt: string;
};

export type ValidationRecord = {
  validationId: Id;
  profileId: Id;
  runId: Id;
  claimId: Id;
  label: ValidationLabel;
  topics?: string[];
  direction?: "better" | "worse";
  confidenceLevel?: ConfidenceLevel;
  quarter?: 1 | 2 | 3 | 4;
  wrongReason?: string;
  note?: string;
  createdAt: string;
};

export type ScoreSnapshot = {
  profileId: Id;
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  futureUnlocked: boolean;
  updatedAt: string;
};

export type Entitlement = {
  userId: Id;
  planCode: PlanCode;
  trialActive: boolean;
  proEnabled: boolean;
  familyEnabled: boolean;
  expiresAt?: string;
  updatedAt: string;
};

export type ConsentRecord = {
  consentId: Id;
  userId: Id;
  purposeCode: string;
  policyVersion: string;
  acceptedAt: string;
};

export type DeletionRequest = {
  requestId: Id;
  userId: Id;
  reason?: string;
  requestedAt: string;
  status: "requested" | "in_progress" | "completed";
};
