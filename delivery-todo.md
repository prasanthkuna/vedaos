# VEDA OS - Day-1 Testable + Always Prod-Ready TODO

## 0) Delivery Rules (non-negotiable)

- Keep `main` always releasable.
- No feature merges without tests and runbooks.
- Use feature flags for incomplete features; never ship half-finished flows without gating.
- Every PR must pass CI (lint, typecheck, unit, integration, contract tests).
- Every backend change must include observability (logs + metrics + alert threshold).
- Every data model change must include migration + rollback notes.

## 1) Definition of Done (applies to every task)

A task is complete only if all are true:

- Code implemented and peer-reviewed.
- Unit tests added/updated.
- Integration/API tests added for behavior changes.
- Contract tests updated for request/response DTO changes.
- Feature flag (if partial rollout required).
- Structured logs and metrics added.
- Error handling and retry behavior defined.
- Security/privacy impact reviewed.
- Runbook updated (`how to operate`, `how to rollback`).

## 2) Repo and Environments Setup (Day 1-2)

### 2.1 Project bootstrap

- [ ] Create monorepo layout from TRD (`apps/mobile`, `services/*`, `packages/*`).
- [ ] Add shared TypeScript config and lint rules.
- [ ] Add pre-commit hooks (`lint-staged`, format, typecheck).
- [ ] Add `.env.example` for each service.

### 2.2 Environment strategy

- [ ] Create `dev`, `stage`, `prod` configs.
- [ ] Define immutable environment variables and secret naming convention.
- [ ] Add smoke endpoint per service (`/health`, `/ready`).

### 2.3 CI pipeline (must exist before feature work)

- [ ] CI job 1: lint + typecheck.
- [ ] CI job 2: unit tests + coverage gates.
- [ ] CI job 3: integration/API tests.
- [ ] CI job 4: contract tests for shared DTOs.
- [ ] CI job 5: migration dry-run on ephemeral DB.
- [ ] CI job 6: mobile build sanity check.

Exit criteria:
- [ ] One sample PR proves full CI pass and environment promotion works.

## 3) Data and Schema Foundation (Day 2-4)

### 3.1 Base schema

- [ ] Create all Phase 1 tables from TRD (`users`, `profiles`, `engine_runs`, `dasha_slices`, `transit_hits`, `claims`, `validations`, etc.).
- [ ] Add compliance tables (`consents`, `policy_versions`, `deletion_requests`).
- [ ] Add billing tables (`billing_customers`, `billing_subscriptions`, `billing_events`, `entitlements`).

### 3.2 Data safety

- [ ] Add required indexes (profile_id, run_id, created_at, language_code).
- [ ] Add PII encryption strategy and key rotation plan.
- [ ] Add soft-delete and retention policy columns.

### 3.3 Migration quality

- [ ] Write forward and rollback steps for each migration.
- [ ] Add migration verification script.

Exit criteria:
- [ ] Fresh DB bootstrap < 10 minutes.
- [ ] Rollback tested on stage.

## 4) Shared Contracts and Test Harness (Day 3-5)

### 4.1 Shared types

- [ ] Implement `packages/shared-types` with Zod schemas for all DTOs.
- [ ] Version DTOs (`v1`) and define backward-compatibility policy.

### 4.2 Test harness

- [ ] Build seeded test fixture generator for profile/chart/claims.
- [ ] Build deterministic clock and timezone test utilities.
- [ ] Add golden-file testing pattern for timeline outputs.

Exit criteria:
- [ ] Contract tests fail on any breaking DTO change.

## 5) Engine v1 Build (Day 5-10)

### 5.1 Deterministic compute core

- [ ] Implement D1 + Vimshottari MD/AD/PD slice generation.
- [ ] Implement transit layers:
  - [ ] major context (Saturn/Jupiter/Rahu/Ketu)
  - [ ] weekly triggers (Moon/Mars)
- [ ] Implement civil + optional vedic sunrise mode.

### 5.2 Risk and rectification

- [ ] Implement risk classifier (`safe`, `medium`, `high`).
- [ ] Implement baseline rectification flow for high-risk users.
- [ ] Persist solver trace and effective TOB window.

### 5.3 Claim generation

- [ ] Implement classes: event/decision/descriptor/stabilization.
- [ ] Implement stabilization-card logic for low confidence years.
- [ ] Implement double-transit as confidence booster.
- [ ] Add anti-Barnum filters (banned phrases + specificity threshold).

### 5.4 Explainability

- [ ] Persist evidence payload for each claim (slice ids, transit ids, flags, template version).

Engine test checklist:
- [ ] Deterministic replay test: same input -> same output.
- [ ] Cross-timezone regression tests.
- [ ] Boundary tests around date rollover and sunrise mode.
- [ ] Performance target for 15-year generation met.

Exit criteria:
- [ ] `engine.generateStory(mode=quick5y|full15y)` stable with >95% deterministic test pass in CI.

## 6) Scoring and Unlock System (Day 8-11)

- [ ] Implement PSA weights (including stabilization weight).
- [ ] Implement PCS pattern consistency model.
- [ ] Implement unlock guardrails:
  - [ ] validated count
  - [ ] year coverage
  - [ ] evidence diversity
  - [ ] rectification-complete gate for high-risk users
- [ ] Add score snapshoting and historical trend tracking.

Test checklist:
- [ ] Unit tests for all score formulas.
- [ ] Property-based tests for edge cases (all false, sparse years, repeated labels).
- [ ] Integration tests for unlock boundary conditions.

Exit criteria:
- [ ] Unlock behavior matches PRD acceptance rules exactly.

## 7) API Services and Reliability (Day 9-13)

- [ ] Implement `profiles`, `engine`, `validation`, `billing`, `compliance` endpoints from TRD.
- [ ] Add idempotency keys for write endpoints.
- [ ] Add retry-safe behavior for external integrations.
- [ ] Add API rate limiting and abuse controls.

Test checklist:
- [ ] Endpoint happy-path tests.
- [ ] Endpoint failure-path tests (timeouts, malformed input, duplicate submit).
- [ ] API contract tests wired to mobile app stubs.

Exit criteria:
- [ ] Stage API passes end-to-end test suite.

## 8) Mobile App MVP Flows (Day 10-15)

### 8.1 Core flows

- [ ] Onboarding: birth details -> risk -> rectification -> Atmakaraka primer.
- [ ] Quick Proof 5-year feed and expansion to full 15-year feed.
- [ ] Claim validation UX (true/somewhat/false).
- [ ] Why-lite/free and Why-full/pro gating.

### 8.2 Pro retention loop

- [ ] Weekly card UI with theme, friction/support windows, muhurtha-lite, upaya.
- [ ] Current city capture and edit flow.

### 8.3 Quality

- [ ] Offline/poor-network behavior for critical screens.
- [ ] Crash-safe state restore in onboarding and story feed.
- [ ] Accessibility baseline (font scaling, contrast, tap targets).

Test checklist:
- [ ] E2E tests for onboarding and validation funnel.
- [ ] Snapshot tests for key story components.

Exit criteria:
- [ ] First-time user can reach first validation in <= 3 minutes in test runs.

## 9) Billing and Entitlements (Day 13-16)

- [ ] Integrate Apple IAP and Google Play Billing.
- [ ] Implement server-side receipt/token verification.
- [ ] Implement webhook processing for renewals/cancel/refunds.
- [ ] Implement trial messaging, renewal messaging, cancellation UX.
- [ ] Implement entitlement reconciliation and backfill jobs.

Test checklist:
- [ ] Sandbox purchase tests on iOS and Android.
- [ ] Refund/cancel/retry simulation tests.
- [ ] Entitlement desync recovery tests.

Exit criteria:
- [ ] Paid path is fully operational in stage using sandbox stores.

## 10) Compliance and Privacy Hardening (Day 14-17)

- [ ] Consent capture at onboarding with policy versioning.
- [ ] Age-gate (18+) and graceful rejection flow for underage users.
- [ ] Data export and account deletion workflow.
- [ ] PII logging audit and redaction checks.
- [ ] Retention enforcement job.

Test checklist:
- [ ] Consent required before processing personal data.
- [ ] Deletion request completes within SLA target.
- [ ] No raw birth details in logs (automated log scan test).

Exit criteria:
- [ ] Compliance checklist signed by engineering + product.

## 11) Observability and Operations (Day 15-18)

- [ ] Add dashboards: latency, error rate, cache hit, unlock rate, conversion, retention.
- [ ] Add alerts with actionable thresholds per service.
- [ ] Create runbooks:
  - [ ] engine degradation
  - [ ] billing webhook backlog
  - [ ] DB saturation
  - [ ] app crash spike
- [ ] Add on-call rotation and escalation matrix.

Exit criteria:
- [ ] Synthetic monitoring detects and alerts within agreed SLO window.

## 12) Load, Security, and Chaos Testing (Day 17-20)

- [ ] Baseline load test for story generation and validation APIs.
- [ ] Spike test for weekly card generation windows.
- [ ] Security tests: authZ/authN checks, injection tests, rate-limit abuse.
- [ ] Chaos tests: DB failover simulation, queue delay simulation, third-party webhook delay.

Exit criteria:
- [ ] Meets performance SLOs and recovery objectives.

## 13) Release Readiness Gates (Go/No-Go)

All must be green:

- [ ] Product acceptance criteria from PRD met.
- [ ] TRD technical acceptance criteria met.
- [ ] CI success rate > 95% over last 20 runs.
- [ ] No P0/P1 open defects.
- [ ] Billing and entitlement flows verified on both platforms.
- [ ] Runbooks validated in stage drill.
- [ ] Rollback plan tested in stage.

## 14) Day-1 Production Launch Checklist

- [ ] Feature flags configured for controlled rollout.
- [ ] Start with 5-10% user rollout cohort.
- [ ] Real-time monitoring war room active for first 48 hours.
- [ ] Daily incident and conversion review for first 7 days.
- [ ] Hotfix branch + emergency release protocol pre-approved.

## 15) Post-Launch (First 30 Days)

- [ ] Weekly quality review of false validations and claim drift.
- [ ] Recalibrate thresholds using observed PSA/PCS distributions.
- [ ] A/B test Quick Proof copy and unlock thresholds.
- [ ] Prioritize top 10 churn reasons from telemetry.
- [ ] Decide Phase 1.1 language rollout based on quality metrics.

## 16) Ownership Matrix (fill before sprint start)

- [ ] Product owner:
- [ ] Tech lead:
- [ ] Backend owner:
- [ ] Mobile owner:
- [ ] Data/ML owner:
- [ ] DevOps/SRE owner:
- [ ] Compliance owner:

## 17) Tracking Format

Use this for daily execution updates:

```md
## YYYY-MM-DD
- Completed:
- In progress:
- Blockers:
- Risks:
- Next 24h:
```
