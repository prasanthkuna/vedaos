# VEDA OS UX Screens (PRD v2 + TRD v2 Aligned)

## Global Rules

- Single-surface product: Story Feed is home; all other screens support it.
- No guarantee language. Use pattern, window, likelihood.
- Anti-Barnum: prefer falsifiable points; if low confidence, emit stabilization year.
- Birth chart base is fixed by POB + TOB. Weekly timing uses current city only.
- Launch languages: EN, HI, TE. TA/KN/ML later after template QA.
- Time model: Civil default; Vedic sunrise optional in Settings.
- Billing is deferred in current build. Keep paywall UI present but purchase actions disabled with "Coming soon".

## State Standards (All Screens)

Each screen must define these states:

- `loading`: skeleton or clear spinner.
- `empty`: no data yet, clear CTA.
- `error`: readable message + retry button.
- `success`: primary screen content.

Each screen must define:

- `entry condition`
- `exit condition`
- `required backend data`
- `fallback if backend fails`

## Flow A: New User (Safe/Medium Risk)

### 1) Welcome

- Goal: expectation + compliance framing.
- UI: "Validate past -> unlock future", disclaimer, Start CTA.
- Entry: app first launch.
- Exit: Start tapped.
- Backend: none.

### 2) Age Gate + Consent

- Goal: India-first compliance.
- UI: 18+ confirmation + purpose-based consent toggles.
- Entry: Welcome completed.
- Exit: mandatory consent accepted.
- Backend:
  - `POST /compliance.recordConsent`
- Fallback: allow local pending state and retry.

### 3) Birth Details

- Goal: collect minimum required chart inputs.
- Fields: DOB picker, TOB picker (only for exact mode), birth-time input mode chips, POB city picker (+ tz/lat/lon auto from city).
- Do not ask display name in onboarding; derive from Google/Clerk and allow rename in Settings.
- Entry: consent completed.
- Exit: valid form submit.
- Backend:
  - `POST /profiles.create`
  - `POST /engine.assessRisk`

### 4) Birth-Time Reliability

- Goal: trust badge before story.
- UI: Safe / Medium / High with one-line explanation.
- Entry: risk response available.
- Exit:
  - Safe/Medium: Continue
  - High: Fix Accuracy
- Backend: risk payload from assess endpoint.

### 5) Atmakaraka Intro

- Goal: resonance hook.
- UI: Atmakaraka planet + 3 plain traits + CTA.
- Entry: risk flow completed.
- Exit: See Last 5 Years.
- Backend:
  - `POST /engine.getAtmakarakaPrimer`

### 6) Quick Proof (Last 5 Years)

- Goal: fast validation loop and earned expansion.
- UI: 5 years only, tri-state validation, why-lite drawer.
- Sticky metrics: PSA, PCS, validated count, year coverage, diversity.
- Entry: Atmakaraka completed.
- Exit:
  - Continue validating
  - Expand when guardrails pass
- Backend:
  - `POST /engine.generateStory` with `mode=quick5y`
  - `POST /validation.validateClaim`
  - `GET /validation.getScores`

### 7) Expand Confirmation

- Goal: expansion feels earned.
- Entry: quick proof guardrails pass.
- Exit: Expand to 15 years.
- Backend: use score unlock object from validation endpoints.

## Flow B: High-Risk Rectification

### 5B) Rectification (Free Baseline)

- Goal: lock usable time window with memory-safe anchors.
- Anchors: job shift, exam, relocation, family responsibility, financial pressure, stability range.
- Entry: risk = high.
- Exit: Lock and Continue.
- Backend:
  - `GET /engine.getRectificationPrompts`
  - `POST /engine.submitRectification`

## Core Surface: Story Feed

### 8) Story Feed (15 Years)

- Sections:
  - Past (15-year timeline)
  - Present weekly card (Pro-gated)
  - Future 12m (Pro-gated)
- Entry: expansion confirmed.
- Exit: validate claims, open weekly/future, settings/profile.
- Backend:
  - `POST /engine.generateStory` with `mode=full15y`
  - `POST /validation.validateClaim`
  - `GET /validation.getScores`

### 8.1 Past Year Card

- Supports mixed claim types:
  - event
  - decision
  - descriptor
  - stabilization
- Optional mini-segments when multiple windows overlap.

### 8.2 Stabilization Year Card

- Trigger: yearly event confidence low.
- Includes neutral points and still supports validation (low weight).

### 8.3 Validation Interaction

- Labels: True / Somewhat / False.
- Follow-ups:
  - topics (max 2)
  - better/worse
  - confidence
  - optional quarter
  - wrong reason on False

### 8.4 Why Drawer

- Basic: why-lite bullets.
- Pro: expanded evidence narrative (still plain language).

## Pro Features (Billing Deferred in Current Build)

### 9) Current City Picker

- Goal: weekly timing personalization.
- Trigger: first weekly open or settings edit.
- Backend:
  - `PATCH /profiles.updateCurrentCity`

### 10) Weekly Present Card

- Goal: retention loop.
- Content:
  - weekly theme
  - friction/support windows
  - muhurtha-lite windows
  - optional upaya
- Backend:
  - `POST /engine.generateWeekly`
- Current build behavior:
  - if backend returns `pro_required`, show paywall stub.

### 10.1 Monthly View

- Goal: compact month-level action layer.
- Content:
  - month theme
  - best dates
  - caution dates
  - monthly upaya
  - phase shifts in current month
- Backend:
  - `POST /engine.generateMonthly`

### 11) Future 12 Months

- Goal: forecast blocks in story style.
- Backend:
  - `POST /engine.generateForecast12m`
- Current build behavior:
  - if backend returns `pro_required`, show paywall stub.

## Trust and Monetization Screens

### 12) Scoreboard

- Goal: conversion via proof.
- UI: PSA, PCS, pattern summary, coverage/diversity.

### 13) Paywall (Deferred Purchase Actions)

- Show Basic / Pro / Family value.
- Keep purchase buttons disabled until billing rollout.
- Copy: "Billing rollout in progress. Pro access enabled by entitlement."

## Profile and Settings

### 14) Profiles

- My profile + one guest profile in Basic/Trial.
- Backend:
  - `POST /profiles.create` with `isGuestProfile=true`
  - `GET /profiles.get`

### 15) Settings

- Language mode.
- Time model: Civil / Vedic sunrise.
- Current city edit.
- Privacy controls: consent and deletion.
- Backend:
  - `PATCH /profiles.updateLanguage`
  - `PATCH /profiles.updateCalendarMode`
  - `PATCH /profiles.updateCurrentCity`
  - `POST /compliance.recordConsent`
  - `POST /compliance.requestDeletion`
  - `GET /compliance.getConsentStatus`

## Guardrails and Unlock Logic

### Quick Proof -> Full Timeline

- minimum validations
- minimum year coverage
- minimum claim-type diversity
- high-risk must complete baseline rectification

### Future Unlock (Pro)

- quality-based unlock:
  - count
  - coverage
  - diversity
- plus entitlement gate

## Ship Order

1. Welcome
2. Age Gate + Consent
3. Birth Details
4. Birth-Time Reliability
5. Rectification (high-risk only)
6. Atmakaraka Intro
7. Quick Proof (5 years)
8. Expand to 15 years
9. Full Story Feed
10. Scoreboard
11. Paywall stub (billing deferred)
12. Current City Picker
13. Weekly Present Card
14. Future 12 Months
15. Profiles
16. Settings

## Backend Contract Notes for FE

- `validation.validateClaim` and `validation.getScores` should be the source of truth for unlock and progress state.
- `engine.generateStory(quick5y)` should include expansion eligibility metadata for FE gating.
- Pro-gated endpoints should return explicit machine-readable error code: `pro_required`.
- High-risk rectification-required status should be surfaced consistently from risk + score responses.
