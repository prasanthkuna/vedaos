export type StoryPoint = {
  claimId: string;
  text: string;
  weightClass: "event" | "decision" | "descriptor" | "stabilization";
  confidenceScore: number;
};

export type StoryFeed = {
  mode: "quick5y" | "full15y";
  years: Array<{ year: number; points: StoryPoint[] }>;
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
};

export type ScoreDTO = {
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  futureUnlocked?: boolean;
};
