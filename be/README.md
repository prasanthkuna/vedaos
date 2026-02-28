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
```

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
