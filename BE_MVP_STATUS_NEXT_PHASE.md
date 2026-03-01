# BE MVP Status and Next Phase Plan

## Completed In MVP (Backend)
- Deterministic astrology engine implemented in `be/src/lib/engine.ts`:
  - Sidereal graha longitudes (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
  - Lahiri ayanamsha approximation for MVP
  - Nakshatra + Pada + Rashi derivation
  - Atmakaraka derived from classical graha degrees
  - Vimshottari MD/AD/PD timeline generation from Janma Nakshatra balance
  - Phase-segment generation from real dasha timeline (quick 5y / full 15y windows)
  - Transit-aware highlight generation (Saturn/Jupiter double-transit + Moon/Mars trigger signals)
  - Personalized weekly support/friction windows using natal/transit interactions
- V2 API wiring updated:
  - `GET /engine/home-v2` now returns computed rashi/nakshatra snapshot (no static placeholder)
  - `POST /engine/generate-journey-v2` uses deterministic phase engine output
  - `POST /engine/generate-weekly` uses personalized weekly windows
  - Rectification window width now adapts by birth-time input mode
- AI bridge in place (swappable providers):
  - Default `openai`
  - Optional `gemini`, `grok`
- Iterative test ops in place:
  - `bun run db:reset:local`
  - `bun run db:reset:staging`

## Next Phase (Post-MVP)
- Precision upgrade:
  - Move ayanamsha from MVP approximation to exact Swiss Ephemeris parity
  - Add strict astronomical regression tests against reference calculator outputs
- Rectification solver depth:
  - Full `six_window_approx` optimization model
  - Full `nakshatra_only` constrained solver
  - Better answer weighting and solver trace explainability
- Deterministic truth artifact expansion:
  - Persist versioned Stage-A context JSON for every AI run
  - Add richer house/lord factor traces and evidence lineage
- Localization runtime completion:
  - Seed and serve EN + TE glossary/content blocks in runtime flows
- Quality and observability:
  - Contract tests for v2 API payloads and provider selection paths
  - AI generation telemetry (provider/model/promptVersion/failure taxonomy)
  - Readability and anti-generic scoring reports per run
- Advanced Jyotish modules:
  - D9/D10 confirmation layers for selected domains
  - Higher-resolution dasha micro-slices if needed for premium features

## Release Gate Before FE Final Switch
- Staging deploy green with new engine changes
- Smoke API pass on deployed backend with authenticated token
- FE switched only to v2 contracts (`home-v2`, `generate-journey-v2`, `generate-weekly`, `generate-forecast-12m`)
