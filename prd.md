# VEDA OS - PRD v2 (India-first, Trust-first Jyotish)

## 1) Product Vision

Build a Jyotish product that earns trust by validating real past patterns before asking users to pay for future guidance.

## 2) Core Promise

"Validate your past first. Then use your confirmed patterns to map the future."

## 3) Target Users

1. Skeptical but curious Indians (18-40) who reject generic astrology.
2. Believers (25-55) who want timing windows and practical actions.
3. Family decision-makers who compare outcomes across close relatives.

## 4) Product Principles

1. Trust over theatrics: no guarantee language.
2. Specificity over Barnum statements.
3. Explainability over black-box claims.
4. Cultural relevance without fear-based prompts.
5. Compliance-by-design for India launch.

## 5) Phase 1 Scope (Must Ship)

### A) Onboarding and First Trust Moment

- Welcome copy: "Validate past -> unlock future" with non-guarantee disclaimer.
- Birth details: DOB, TOB, POB, timezone, optional lat/lon.
- Atmakaraka intro card before timeline (resonance check).
- Quick Proof Mode first: show last 5 years first.
- Expand to full 15-year timeline after initial validations.

### B) Birth Time Reliability

- Risk classification: safe, medium-risk, high-risk.
- High-risk requires rectification before full-scoring eligibility.
- Baseline rectification is free for all high-risk users.

### C) Rectification (Fast Cultural Anchors)

- Memory-friendly anchors: job shifts, relocations, exams, family milestones, major financial pressure windows.
- Avoid stigma-prone, medical, or mental-health prompts.
- Output: time window start/end, effective TOB, confidence, and solver trace.

### D) Story Feed (Single Surface)

- Past section: 15-year timeline cards after Quick Proof expansion.
- Each year supports mixed point types:
  - event
  - decision
  - descriptor
  - stabilization (neutral year card)
- If multiple dasha windows overlap, show mini-segments with tighter timing.
- Tri-state validation: true, somewhat, false.
- Why drawer:
  - Free: concise why-lite bullets.
  - Pro: full evidence explanation in plain language.

### E) Scoring and Unlock

- PSA (Past Score Accuracy): weighted by claim class and validation label.
- PCS (Pattern Confidence Score): pattern consistency from validated triggers.
- Unlock guardrails are quality-based, not only count-based:
  - minimum validated count
  - minimum year coverage
  - minimum evidence diversity across claim types

### F) Present and Future Experience

- Future 12 months forecast (Pro).
- Weekly Present Card (Pro) includes:
  - weekly theme
  - high-friction/low-friction windows
  - muhurtha-lite do/avoid windows
  - optional upaya suggestion

### G) Plans (Phase 1)

- Basic (free)
- Pro (trial + paid)
- Family (paid add-on, phased)
- One free guest profile in Basic/Trial for trust testing on sibling/spouse/parent.

## 6) Non-goals (Phase 1)

- Human astrologer marketplace.
- 16-varga depth workflows for beginners.
- Medical, legal, or guaranteed financial outcomes.
- Fully custom ritual commerce.

## 7) Core Engine Requirements

### 7.1 Deterministic Astrology Computation

- D1 base chart.
- Vimshottari dasha computed through MD/AD/PD.
- Transit backbone for major outcome context: Saturn, Jupiter, Rahu, Ketu.
- Weekly trigger layer: Moon and Mars transits.
- Optional D9 and D10 confirmations for high-impact relationship/career claims.

### 7.2 Calendar and Time Model

- Support both modes:
  - civil mode (default)
  - vedic sunrise mode (optional user preference)
- Compute local sunrise using location and timezone when vedic mode is enabled.

### 7.3 Claim Generator v3 (Anti-Barnum)

- Do not force minimum event count per year.
- Generate stabilization card when event confidence is low.
- Use double-transit (Saturn + Jupiter co-support) as confidence boost, not strict gate.
- Enforce specificity thresholds and banned-phrase filters.
- Enforce uniqueness across adjacent years.

### 7.4 Explainability

Each claim must retain evidence:
- dasha slice ids (AD/PD)
- transit hit ids
- trigger flags
- template code and version
- confidence and specificity scores

### 7.5 Calibration

Calibration does not change core math.
Calibration adjusts interpretation branch weights and narrative selection based on validated user history.

## 8) Data, Privacy, and Compliance (India-first)

- Explicit consent capture by purpose.
- Consent ledger with timestamps and versioned policy text.
- Age gate: 18+.
- Data minimization and retention policy by data type.
- PII encryption at rest (mandatory).
- Deletion SLA and soft-delete lifecycle.
- Raw birth details never logged in application logs.

## 9) Language Strategy

### 9.1 Launch Languages

- Launch set: English, Hindi, Telugu.
- Next wave: Tamil, Kannada, Malayalam after template quality threshold is met.

### 9.2 Selection Rules

1. manual user choice
2. device locale
3. one-time regional suggestion if device locale is English

## 10) Monetization and Billing

### 10.1 Basic (Free)

- Timeline + validations
- PSA visibility
- Why-lite
- one guest profile

### 10.2 Pro

- Full why drawer
- PCS + pattern summary
- Future 12 months
- Weekly present card with muhurtha-lite windows
- Optional upaya recommendations (behavioral/spiritual, non-guaranteed)
- Advanced rectification refinements

### 10.3 Billing Requirements (Phase 1)

- Apple IAP and Google Play Billing support from initial release.
- Transparent trial, renewal, and cancellation messaging.
- Entitlement reconciliation via server webhooks and receipt verification.

## 11) Analytics and Success Metrics

- Time to first validation.
- Validation depth (count + year coverage).
- PSA and PCS distributions by cohort.
- Trial start and paid conversion.
- Weekly card D7 and D30 retention.
- Guest-profile-to-paid conversion uplift.

## 12) Risks and Mitigations

1. Birth time uncertainty
   - Risk model + free baseline rectification + confidence windows.
2. Over-claiming and trust loss
   - Stabilization cards + specificity filters + evidence-backed explanations.
3. Compliance and perception risk
   - non-guarantee copy + policy-safe prompts + consent and deletion controls.
4. Funnel fatigue
   - 5-year quick proof before full 15-year expansion.

## 13) Open Decisions to Lock

- Exact unlock thresholds for count, coverage, and diversity.
- Pro pricing and annual discount strategy.
- Upaya catalog scope for Phase 1.
- Family plan packaging and pricing.

## 14) Acceptance Criteria (Phase 1)

- User can complete onboarding, risk assessment, and free baseline rectification when required.
- User sees Atmakaraka intro and Quick Proof timeline before full expansion.
- Engine computes MD/AD/PD slices and produces explainable claims.
- Stabilization year appears when event confidence is low.
- Weekly card uses Moon/Mars trigger layer over major transit context.
- Unlock logic uses count + coverage + diversity guardrails.
- Billing is production-ready with app-store compliant subscriptions.
- Data controls include consent ledger, encryption, and deletion workflow.
