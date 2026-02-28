# VEDA OS - TRD v2 (React Expo + Bun, Encore TS + Encore Cloud, Postgres)

## 1) Scope

### Phase 1 (Ship)

- Onboarding: Birth Details -> Risk -> Rectification (if required) -> Atmakaraka primer -> Quick Proof (last 5 years) -> Full Story Feed
- Story Feed: 15-year timeline, validations, PSA/PCS, why-lite/full
- Claim model supports event, decision, descriptor, and stabilization cards
- Pro unlock: Future 12m + Weekly Present Card + muhurtha-lite windows + upaya suggestions
- One free guest profile for trust testing in onboarding funnel
- Localization launch: EN, HI, TE
- Production billing in Phase 1 (Apple/Google compliant)

### Phase 1.1

- Add TA, KN, ML once template QA thresholds are met

### Phase 2

- Family multi-profile expansion
- Ask VEDA copilot
- Exports and calendar sync

## 2) Tech Stack

### Frontend

- React Native with Expo (TypeScript)
- Bun for scripts/tests
- State: Zustand + TanStack Query
- Navigation: Expo Router
- i18n: i18next + react-i18next

### Backend

- Encore TypeScript services
- Encore Cloud deployment
- Encore Postgres
- Optional Encore cache

## 3) Service Architecture

1. `profiles`
- profile CRUD
- language and preferences
- guest-profile limits

2. `engine`
- risk assessment
- rectification solver
- dasha/transit computation
- story and forecast generation
- weekly card generation

3. `validation`
- claim validation ingestion
- PSA/PCS calculation
- unlock state updates

4. `billing`
- trial lifecycle
- app store receipt validation
- entitlement state
- cancellation/renewal status sync

5. `compliance`
- consent ledger
- policy version tracking
- deletion requests and lifecycle

## 4) Data Model (Postgres)

### 4.1 Core Tables

- `veda_users`
- `veda_profiles`
- `veda_engine_runs`
- `veda_dasha_slices` (must include MD/AD/PD granularity)
- `veda_transit_hits` (include Saturn/Jupiter/Rahu/Ketu/Mars/Moon tags)
- `veda_claim_templates`
- `veda_claims`
- `veda_validations`
- `veda_score_snapshots`
- `veda_rectification_prompts`
- `veda_rectification_answers`
- `veda_rectification_runs`
- `veda_calibration_weights`
- `veda_claim_lineage`
- `veda_story_feeds` (optional materialized JSON cache)

### 4.2 New Compliance/Billing Tables

- `veda_consents` (purpose_code, policy_version, accepted_at)
- `veda_policy_versions`
- `veda_deletion_requests`
- `veda_billing_customers`
- `veda_billing_subscriptions`
- `veda_billing_events` (webhook/audit log)
- `veda_entitlements`

### 4.3 Profile Fields (minimum)

- `language_code`, `language_mode`
- `current_city`, `current_lat`, `current_lon`
- `calendar_mode` (`civil` or `vedic_sunrise`)
- `is_guest_profile`
- `birth_time_risk_level`

## 5) Core Engine Requirements

### 5.1 Inputs

- DOB, TOB, POB, timezone, lat/lon
- birth-time certainty
- current city for weekly cards
- calendar mode preference

### 5.2 Computation Units

- Canonical dasha slices: MD/AD/PD
- Transit layers:
  - Major context: Saturn, Jupiter, Rahu, Ketu
  - Weekly triggers: Moon, Mars

### 5.3 Rules

- Double-transit (Saturn + Jupiter support) increases event confidence, not hard gate.
- If yearly event confidence is low, emit stabilization card.
- Avoid forced event quotas by year.
- Apply banned-phrase and specificity filters before claim selection.

### 5.4 Calendar Logic

- Default civil day boundaries.
- Optional vedic sunrise mode for day/tithi boundaries.
- Sunrise must be location-aware and timezone-aware.

### 5.5 Explainability Artifact

Each claim stores:
- slice IDs (AD/PD)
- transit IDs
- trigger flags
- template code/version
- confidence and specificity scores

## 6) Scoring and Unlock Logic

### 6.1 PSA

- Claim class weights:
  - event: 1.0
  - decision: 0.6
  - descriptor: 0.25
  - stabilization: 0.35
- Label weights:
  - true: 1.0
  - somewhat: 0.5
  - false: 0.0
- Optional confidence multiplier from user input.

### 6.2 PCS

- Derived from repeated validated trigger patterns.
- Increases with consistency and breadth.

### 6.3 Unlock Guardrails (server-driven)

- Minimum validated count (example: >= 10)
- Minimum year coverage (example: >= 4 distinct years)
- Minimum evidence diversity (event + non-event mix)
- High-risk profiles require baseline rectification completion before full unlock eligibility.

## 7) API Design (Encore)

### 7.1 profiles service

**POST** `/profiles.create`
- body: `{ displayName, dob, tobLocal, pobText, tzIana, lat?, lon?, birthTimeCertainty, isGuestProfile? }`
- returns: `{ profileId }`

**GET** `/profiles.get`
- query: `{ profileId }`

**PATCH** `/profiles.updateLanguage`
- body: `{ profileId, languageCode, languageMode }`

**PATCH** `/profiles.updateCurrentCity`
- body: `{ profileId, cityText, lat, lon }`

**PATCH** `/profiles.updateCalendarMode`
- body: `{ profileId, calendarMode }`

### 7.2 engine service

**POST** `/engine.assessRisk`
- body: `{ profileId }`
- returns: `{ riskLevel, boundaryDistance, rectificationRequired, details }`

**POST** `/engine.getAtmakarakaPrimer`
- body: `{ profileId }`
- returns: `{ planet, narrativeKey, resonanceQuestion }`

**GET** `/engine.getRectificationPrompts`
- query: `{ engineVersion, languageCode }`

**POST** `/engine.submitRectification`
- body: `{ profileId, answers: [...] }`
- returns: `{ rectRunId, windowStart, windowEnd, confidence, effectiveTobLocal }`

**POST** `/engine.generateStory`
- body: `{ profileId, mode: "quick5y"|"full15y" }`
- returns: `{ runId, feed }`

**POST** `/engine.generateForecast12m` (Pro)
- body: `{ profileId }`

**POST** `/engine.generateWeekly` (Pro)
- body: `{ profileId, weekStartUtc }`
- requires current city

### 7.3 validation service

**POST** `/validation.validateClaim`
- body:
```ts
{
  profileId,
  runId,
  claimId,
  label: "true" | "somewhat" | "false",
  topics?: string[],
  direction?: "better" | "worse",
  confidenceLevel?: "high" | "medium" | "low",
  quarter?: 1 | 2 | 3 | 4,
  wrongReason?: string,
  note?: string
}
```
- returns: `{ psa, pcs, validatedCount, yearCoverage, diversityScore, futureUnlocked }`

**GET** `/validation.getScores`
- query: `{ profileId }`

### 7.4 billing service

**POST** `/billing.startTrial`
- body: `{ userId, platform }`

**POST** `/billing.verifyPurchase`
- body: `{ userId, platform, receiptOrToken }`

**POST** `/billing.webhook`
- provider webhook endpoint for renewal/cancel/refund events

**GET** `/billing.entitlements`
- query: `{ userId }`
- returns: `{ planCode, trialActive, proEnabled, familyEnabled, expiresAt }`

### 7.5 compliance service

**POST** `/compliance.recordConsent`
- body: `{ userId, purposeCode, policyVersion }`

**POST** `/compliance.requestDeletion`
- body: `{ userId, reason? }`

**GET** `/compliance.getConsentStatus`
- query: `{ userId }`

## 8) Story Feed DTO (Contract)

```ts
type StoryFeedDTO = {
  engineVersion: string;
  mode: "quick5y" | "full15y";
  psa: number;
  pcs: number;
  validatedCount: number;
  yearCoverage: number;
  diversityScore: number;
  years: Array<{
    year: number;
    points: Array<{
      claimId: string;
      text: string;
      weightClass: "event" | "decision" | "descriptor" | "stabilization";
      confidenceScore: number;
      whyLite?: string[];
      whyFullAvailable: boolean;
      validation?: {
        label: "true" | "somewhat" | "false";
      };
    }>;
  }>;
  present?: WeeklyDTO | null;
  future?: ForecastDTO | null;
};
```

## 9) Weekly Card Contract (Pro)

```ts
type WeeklyDTO = {
  weekStartUtc: string;
  theme: string;
  frictionWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  supportWindows: Array<{ startUtc: string; endUtc: string; reason: string }>;
  muhurthaLite?: Array<{ purpose: string; startUtc: string; endUtc: string }>;
  upaya?: { title: string; instruction: string; disclaimerKey: string } | null;
};
```

## 10) Caching and Idempotency

- Cache key: `engine_version + input_hash + calendar_mode`
- `input_hash` includes effective TOB/window, POB coords/tz, rectification run ID
- Mark feed cache stale on validation writes and material profile changes

## 11) Security and Privacy Controls

- Encrypt PII fields at rest (mandatory).
- Never log raw birth details.
- Role-based access for internal tooling.
- Audit log all data exports and deletion actions.
- Rate-limit compute-heavy endpoints.

## 12) Observability

- Structured logs with `profileId`, `runId`, `engineVersion`
- Core metrics:
  - story generation latency
  - cache hit rate
  - validation depth (count + coverage)
  - unlock rate
  - trial-to-paid conversion
  - weekly retention

## 13) Deployment

- Environments: dev, stage, prod
- Migration pipeline in Encore
- Secrets in Encore Cloud
- Feature flags for:
  - vedic sunrise mode
  - upaya module
  - muhurtha-lite module

## 14) Acceptance Criteria (Phase 1)

- Profile creation supports standard and guest profiles.
- Risk and rectification flow works; baseline rectification is available for high-risk users.
- Story generation supports quick5y and full15y modes.
- Engine computes MD/AD/PD and stores explainability evidence.
- Stabilization cards appear for low-event-confidence years.
- Weekly card uses Moon/Mars trigger layer.
- Unlock checks count + year coverage + evidence diversity.
- Billing works end-to-end with platform-compliant subscriptions.
- Consent logging, encryption, and deletion request lifecycle are operational.
