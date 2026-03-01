# VEDA OS V2 Upgrades TODO (Ordered, Pro Plan)

## 0. Scope Lock
- [ ] Freeze new feature additions until this V2 plan is implemented.
- [ ] Keep billing deferred (as decided) and focus on core Jyotish quality + UX.
- [ ] Use Bun-only workflows for all BE/FE/testing scripts.

## 1. Product Direction Lock (Non-Negotiables)
- [ ] Shift from "score/validation app" to "AI Jyotish companion" with deterministic Vedic core.
- [ ] Remove user-facing internal metrics (PSA/PCS/diversity/coverage).
- [ ] Make timeline phase-wise (MD/AD/PD), not arbitrary year buckets.
- [ ] Rectification must be mandatory only when birth time is uncertain/missing mode.
- [ ] Exact/Confident time users must never be forced into rectification due to risk alone.
- [ ] Narratives must be grounded and non-generic.
- [ ] Minimize user input strictly: infer from Google/Clerk where possible; use pickers/chips over free text.
- [ ] Add monthly guidance surface (theme, best/caution dates, monthly upaya, phase shifts).

## 2. UX Information Architecture (V2)
- [ ] Replace current IA with 5 top-level surfaces:
  - [ ] Home (Now + Today)
  - [ ] My Journey (15-year phase narrative)
  - [ ] This Week (timing windows + practical guidance)
  - [ ] Remedies (sattvic + behavior)
  - [ ] Profile/Preferences
- [ ] Remove scoreboard-centric navigation from primary flow.

## 3. Home Screen Spec (Spotify/Netflix Feel, Astrology-first)
- [ ] Build Home with this exact card order:
  - [ ] Today's Cosmic Snapshot (Rashi, Nakshatra, active phase)
  - [ ] Now Active Phase (MD/AD/PD with start/end date)
  - [ ] Today's Windows (support/caution time windows)
  - [ ] Today's Upaya (single actionable remedy)
  - [ ] Upcoming Shift (next meaningful phase change)
- [ ] Keep copy short, cinematic, and user-action oriented.
- [ ] No dense technical dumps on first view.

## 4. Birth-Time and Rectification Logic (Vedic-Accurate Gating)
- [ ] Introduce input-mode model in profile:
  - [ ] `exact_time`
  - [ ] `six_window_approx`
  - [ ] `nakshatra_only`
  - [ ] `unknown`
- [ ] Add rectification policy:
  - [ ] Required for `six_window_approx`, `nakshatra_only`, `unknown`
  - [ ] Optional/improvement-only for `exact_time`
- [ ] Keep risk as informational for exact/confident users.
- [ ] Ensure BE unlock rules depend on uncertainty mode, not high-risk alone.

## 5. Backend Domain and Data Model Upgrades
- [ ] Add migration for birth-time input model fields.
- [ ] Add migration for phase-first storage:
  - [ ] `phase_runs`
  - [ ] `phase_segments` (MD/AD/PD with date ranges)
  - [ ] `phase_highlights`
- [ ] Add narrative storage with versioning:
  - [ ] `narrative_runs`
  - [ ] `narrative_blocks`
  - [ ] `prompt_version`
- [ ] Add localization/glossary tables:
  - [ ] `vedic_glossary_entries`
  - [ ] `localized_content_blocks`
- [ ] Backfill strategy:
  - [ ] Existing `tob_local` users default to `exact_time` unless explicit uncertainty exists.

## 6. Backend API Contract Overhaul (Phase-First, User-Clear)
- [ ] Replace "year points" payloads with "phase segments" payloads.
- [ ] Expose API fields needed by UI only (no internal scoring artifacts).
- [ ] Add `nextStep` semantics in responses:
  - [ ] `proceed`
  - [ ] `rectification_required`
  - [ ] `rectification_optional`
- [ ] Keep deterministic facts in response for explainability:
  - [ ] active phase refs
  - [ ] date windows
  - [ ] key transit triggers
- [ ] Maintain strict response typing to avoid empty-body regressions.

## 7. Deterministic Jyotish Core (Truth Layer)
- [ ] Keep all chart math deterministic in BE (no AI for calculation).
- [ ] Ensure context builder includes:
  - [ ] MD/AD/PD
  - [ ] house/lord involvement
  - [ ] transit interactions
  - [ ] uncertainty flags
  - [ ] confidence boundaries
- [ ] Record "why factors" for each generated narrative block.

## 8. Gemini Integration Plan (Renderer, Not Oracle)
- [ ] Implement 2-stage pipeline:
  - [ ] Stage A: deterministic phase context JSON
  - [ ] Stage B: Gemini narrative generation from context
- [ ] Add strict output contract:
  - [ ] phase meaning
  - [ ] likely manifestation
  - [ ] caution
  - [ ] action/upaya
  - [ ] timing reference
- [ ] Add anti-generic validator:
  - [ ] reject if no phase/transit grounding
  - [ ] reject generic templates
  - [ ] regenerate if non-compliant
- [ ] Persist prompt + output versions for audit and tuning.

## 9. Copy and Verbiage System (Mass Comprehension)
- [ ] Build "3-layer explanation" standard for every major term:
  - [ ] Vedic term
  - [ ] Simple meaning
  - [ ] Why it matters now
- [ ] Every prediction line must be understandable by a 15-year-old in simple mode.
- [ ] Avoid fear-heavy or fatalistic wording.
- [ ] Convert all screen copy to short, clear, action-first lines.

## 10. Glossary Program (EN + TE First, Scalable)
- [ ] Launch glossary infrastructure now (not later):
  - [ ] `key`
  - [ ] `vedic_term`
  - [ ] `simple_line`
  - [ ] `why_it_matters`
  - [ ] `example_line`
  - [ ] `tone_level`
  - [ ] `language_code`
  - [ ] `aliases`
  - [ ] `do_not_translate`
  - [ ] review metadata
- [ ] Build in phased content volume:
  - [ ] Phase 1: 120 terms
  - [ ] Phase 2: 300 terms
  - [ ] Phase 3: 500+ terms
- [ ] Languages:
  - [ ] English + Telugu now
  - [ ] Hindi + others later without architecture changes

## 11. Localization as Infrastructure (Clarified)
- [ ] Keep all content key-based from day 1.
- [ ] Prompt templates must be language-specific.
- [ ] No hard-coded English astrology text in FE.
- [ ] Enable "Simple" and "Traditional" explanation modes.
- [ ] Ensure design supports longer Telugu strings and wrapping rules.

## 12. Frontend Design System Rebuild (100x UX)
- [ ] Create centralized design tokens:
  - [ ] color roles
  - [ ] typography scale
  - [ ] spacing
  - [ ] elevation/motion
- [ ] Replace current visual style with premium streaming-style presentation.
- [ ] Remove repetitive bordered cards and dense utility UI.
- [ ] Use fewer, stronger cards with clear hierarchy and purpose.
- [ ] Keep components reusable and minimal (no redundant UI code).

## 13. Frontend Flow Changes
- [ ] Onboarding:
  - [ ] capture birth-time input mode directly
  - [ ] route by mode (not generic risk)
- [ ] Exact-time flow:
  - [ ] skip mandatory rectification
  - [ ] continue to Atmakaraka/Now phase
- [ ] Uncertain-time flow:
  - [ ] run rectification
  - [ ] show progress and confidence clearly
- [ ] Replace year cards with phase narrative feed.

## 14. Quality, Testing, and Release Gates
- [ ] Keep Bun smoke API suite as release gate.
- [ ] Add deterministic contract tests for all critical BE endpoints.
- [ ] Add content quality checks:
  - [ ] non-generic output checks
  - [ ] grounding key checks
  - [ ] language readability checks
- [ ] Manual UX QA on:
  - [ ] exact-time user
  - [ ] uncertain-time user
  - [ ] Telugu language mode

## 15. Observability and Analytics (Post Core Stabilization)
- [ ] Add Sentry after core flow stabilization.
- [ ] Add PostHog after final IA is live.
- [ ] Track meaningful events only:
  - [ ] phase view
  - [ ] weekly open
  - [ ] remedy completion
  - [ ] session continuation

## 16. Deployment and Rollout Sequence
- [ ] Deploy BE schema + API v2 first (backward-compatible phase if needed).
- [ ] Run smoke tests on deployed staging.
- [ ] Switch FE to v2 endpoints/flow flags.
- [ ] Internal dogfood in EN + TE.
- [ ] Controlled beta rollout.
- [ ] Full rollout after quality thresholds pass.

## 17. Immediate Next 10 Execution Tasks
- [ ] Finalize V2 API contracts (phase payloads, no score exposure).
- [ ] Define birth-time input mode schema and migration.
- [ ] Implement uncertainty-based rectification gating across BE.
- [ ] Implement phase-segment generation for 15-year journey.
- [ ] Build Gemini context builder + grounded prompt templates.
- [ ] Build anti-generic response validator.
- [ ] Create glossary DB + initial 120 EN/TE entries.
- [ ] Build new Home + Journey FE screens on new design system.
- [ ] Replace risk/score surfaces with simple explanatory language.
- [ ] Run full smoke + UX QA and prepare beta.

## 18. Success Criteria (Must Hit)
- [ ] Exact-time users are never forced to rectify.
- [ ] Uncertain users get guided rectification with clear reason.
- [ ] Past journey is phase-wise, not year-wise.
- [ ] User-facing language is understandable without Vedic background.
- [ ] AI output is specific, grounded, and non-generic.
- [ ] Premium UI feel is consistent across home and journey surfaces.
