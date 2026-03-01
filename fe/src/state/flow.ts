import { create } from "zustand";
import type { HomeV2DTO, JourneyV2DTO, MonthlyDTO, ScoreDTO, StoryFeed, WeeklyDTO } from "../api/types";

export type ConsentState = {
  age18: boolean;
  generate: boolean;
  personalization: boolean;
  analytics: boolean;
};

type FlowState = {
  risk?: "safe" | "medium" | "high";
  rectificationRequired: boolean;
  nextStep?: "proceed" | "rectification_required" | "rectification_optional";
  atmakaraka?: string;
  quickProofEligible: boolean;
  proRequired: boolean;
  story?: StoryFeed;
  homeV2?: HomeV2DTO;
  journeyV2?: JourneyV2DTO["journey"];
  weekly?: WeeklyDTO;
  monthly?: MonthlyDTO;
  scores?: ScoreDTO;
  rectification?: {
    rectRunId: string;
    windowStart: string;
    windowEnd: string;
    confidence: number;
    effectiveTobLocal: string;
  };
  consent: ConsentState;
  setRisk: (risk?: "safe" | "medium" | "high") => void;
  setRectificationRequired: (required: boolean) => void;
  setNextStep: (nextStep?: "proceed" | "rectification_required" | "rectification_optional") => void;
  setAtmakaraka: (planet?: string) => void;
  setQuickProofEligible: (eligible: boolean) => void;
  setProRequired: (required: boolean) => void;
  setStory: (story?: StoryFeed) => void;
  setHomeV2: (homeV2?: HomeV2DTO) => void;
  setJourneyV2: (journeyV2?: JourneyV2DTO["journey"]) => void;
  setWeekly: (weekly?: WeeklyDTO) => void;
  setMonthly: (monthly?: MonthlyDTO) => void;
  setScores: (scores?: ScoreDTO) => void;
  setRectification: (rect?: FlowState["rectification"]) => void;
  patchConsent: (patch: Partial<ConsentState>) => void;
  resetFlow: () => void;
};

const defaultConsent: ConsentState = {
  age18: false,
  generate: true,
  personalization: true,
  analytics: false,
};

export const useFlowStore = create<FlowState>((set) => ({
  rectificationRequired: false,
  quickProofEligible: false,
  proRequired: false,
  consent: defaultConsent,
  setRisk: (risk) => set({ risk }),
  setRectificationRequired: (rectificationRequired) => set({ rectificationRequired }),
  setNextStep: (nextStep) => set({ nextStep }),
  setAtmakaraka: (atmakaraka) => set({ atmakaraka }),
  setQuickProofEligible: (quickProofEligible) => set({ quickProofEligible }),
  setProRequired: (proRequired) => set({ proRequired }),
  setStory: (story) => set({ story }),
  setHomeV2: (homeV2) => set({ homeV2 }),
  setJourneyV2: (journeyV2) => set({ journeyV2 }),
  setWeekly: (weekly) => set({ weekly }),
  setMonthly: (monthly) => set({ monthly }),
  setScores: (scores) => set({ scores }),
  setRectification: (rectification) => set({ rectification }),
  patchConsent: (patch) => set((s) => ({ consent: { ...s.consent, ...patch } })),
  resetFlow: () =>
    set({
      risk: undefined,
      rectificationRequired: false,
      nextStep: undefined,
      atmakaraka: undefined,
      quickProofEligible: false,
      proRequired: false,
      story: undefined,
      homeV2: undefined,
      journeyV2: undefined,
      weekly: undefined,
      monthly: undefined,
      scores: undefined,
      rectification: undefined,
      consent: defaultConsent,
    }),
}));
