import type { ClaimClass, ConfidenceLevel, ValidationLabel } from "../domain/types";

const claimWeight: Record<ClaimClass, number> = {
  event: 1.0,
  decision: 0.6,
  descriptor: 0.25,
  stabilization: 0.35,
};

const labelWeight: Record<ValidationLabel, number> = {
  true: 1.0,
  somewhat: 0.5,
  false: 0.0,
};

const confidenceWeight: Record<ConfidenceLevel, number> = {
  high: 1.0,
  medium: 0.8,
  low: 0.6,
};

export const scoreClaim = (
  weightClass: ClaimClass,
  label: ValidationLabel,
  confidenceLevel?: ConfidenceLevel,
): number => {
  const base = claimWeight[weightClass] * labelWeight[label];
  const confidence = confidenceLevel ? confidenceWeight[confidenceLevel] : 1.0;
  return base * confidence;
};

export const round2 = (value: number): number => Math.round(value * 100) / 100;
