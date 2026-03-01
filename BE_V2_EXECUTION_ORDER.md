# BE V2 Execution Order (Remaining)

## 0) Iterative Testing Utility (Done)
- Added Bun reset script for Encore DB:
  - `bun run db:reset:local`
  - `bun run db:reset:staging`
  - `bun run db:reset -- --yes --namespace <name>`
- Script file: `be/scripts/reset-db.ts`

## 1) Replace Placeholder Astrology Math with Real Deterministic Core
- Implement actual chart + Vimshottari MD/AD/PD computation from DOB/TOB/POB.
- Implement real transit engine for Saturn/Jupiter/Rahu/Ketu/Moon/Mars.
- Replace synthetic phase and trigger generation in `src/lib/engine.ts`.
- Persist deterministic computation artifacts for replay/audit.

## 2) Birth-Time Mode Specific Rectification Logic
- `exact_time`: never mandatory rectification.
- `six_window_approx`: run window narrowing solver over 6 slots.
- `nakshatra_only`: infer likely time window from nakshatra constraint + anchors.
- `unknown`: require baseline rectification before journey generation.

## 3) Stage-A Deterministic Context as First-Class Contract
- Create explicit versioned context DTO (`context_version`, `engine_version`).
- Persist exact context JSON used for each AI call.
- Ensure all AI prompts consume only Stage-A context.

## 4) AI Quality Guardrails (Non-Mutating)
- Keep prompt-level anti-generic constraints.
- Keep strict structural validation (JSON schema + segment mapping).
- Add failure taxonomy metrics: parse fail, missing fields, provider timeout.

## 5) Home V2 Accuracy Pass
- Replace placeholder snapshot fields (example: nakshatra string).
- Build daily snapshot from deterministic core output only.
- Include active phase and upcoming shift from real dasha timeline.

## 6) Localization Runtime Wiring (EN + TE)
- Seed glossary + content blocks in DB.
- Build read path APIs for glossary/tooltips/explanations.
- Enforce key-based text retrieval in all v2 narrative responses.

## 7) Contract Lock and Legacy Deprecation
- Freeze v2 contracts for:
  - `/engine/home-v2`
  - `/engine/generate-journey-v2`
  - `/engine/generate-weekly`
  - `/engine/generate-forecast-12m`
- Mark legacy score-centric story surfaces as deprecated for FE switch.

## 8) Test/Release Gates
- Expand smoke suite with v2 positive and failure-path cases.
- Add contract tests for provider bridge (openai/gemini/grok selection).
- Add deterministic engine snapshot tests for repeatability.

## 9) Observability
- Log per run:
  - provider, model, promptVersion, contextVersion
  - generation latency and validation outcome
- Prepare for Sentry/PostHog integration after FE stabilization.

## 10) Production Readiness Gate Before FE Final Switch
- Real deterministic core in place.
- Rectification modes fully implemented.
- V2 contracts stable.
- Smoke + contract tests green on staging.
- Data reset script documented and used for iterative validation cycles.
