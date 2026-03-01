# Backend (veda-be)

Encore backend for VEDA OS using:
- Encore SQL DB (`db.ts`)
- Encore Object Storage (`storage.ts`)
- Clerk token verification (`Authorization: Bearer <token>`)
- PII encryption at rest (`PIIEncryptionKey`)

## Setup

```bash
bun install
encore secret set --type dev,local NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
encore secret set --type dev,local CLERK_SECRET_KEY
encore secret set --type dev,local PIIEncryptionKey
encore secret set --type dev,local OpenAIAPIKey
```

AI provider defaults:
- `AI_PROVIDER=openai` (default)
- `OPENAI_MODEL=gpt-5`
- `GEMINI_MODEL=gemini-2.5-flash`
- `GROK_MODEL=grok-4-0709`
- Optional provider env vars (only needed if selected): `GEMINI_API_KEY`, `XAI_API_KEY`

## Run and Check

```bash
encore run
encore check
bun run typecheck
```

## API Groups

- Profiles: create/get/update
- Engine: risk, Atmakaraka primer, rectification, story, forecast, weekly card
- Validation: claim feedback and score retrieval
- Compliance: consent and deletion requests
- Billing: intentionally deferred placeholders for rollout +1 week
- Legacy in-memory Bun server path removed

## Current Status

- Data is persisted in Encore Postgres.
- Story/rectification artifacts are stored in Encore object storage.
- Billing verification and webhooks are stubs by design for this week.
- MVP deterministic engine is active for v2 flows:
  - sidereal graha positions, nakshatra/rashi, MD/AD/PD phase timeline, transit-aware weekly windows
  - AI remains renderer over deterministic context
- Next phase precision upgrades are tracked in [BE_MVP_STATUS_NEXT_PHASE.md](../BE_MVP_STATUS_NEXT_PHASE.md).
