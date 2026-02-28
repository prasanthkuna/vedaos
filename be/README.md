# Backend (veda-be)

Bun-first backend implementing the Phase-1 API contract from `trd.md`.

## Services

- `profiles`
- `engine`
- `validation`
- `billing`
- `compliance`

## Run

```bash
bun install
bun run dev
```

Server starts at `http://localhost:4000` by default.

## Health

- `GET /health`
- `GET /ready`
- `GET /api/version`

## Implemented API Endpoints

### Profiles
- `POST /profiles.create`
- `GET /profiles.get`
- `PATCH /profiles.updateLanguage`
- `PATCH /profiles.updateCurrentCity`
- `PATCH /profiles.updateCalendarMode`

### Engine
- `POST /engine.assessRisk`
- `POST /engine.getAtmakarakaPrimer`
- `GET /engine.getRectificationPrompts`
- `POST /engine.submitRectification`
- `POST /engine.generateStory`
- `POST /engine.generateForecast12m`
- `POST /engine.generateWeekly`

### Validation
- `POST /validation.validateClaim`
- `GET /validation.getScores`

### Billing
- `POST /billing.startTrial`
- `POST /billing.verifyPurchase`
- `POST /billing.webhook`
- `GET /billing.entitlements`

### Compliance
- `POST /compliance.recordConsent`
- `POST /compliance.requestDeletion`
- `GET /compliance.getConsentStatus`

## Notes

- Persistence is currently in-memory to keep development fast.
- Request/response bodies are validated via `zod`.
- Scoring and unlock rules follow TRD v2 defaults.
- Next step to productionize: wire Postgres repositories and durable billing/compliance logs.
