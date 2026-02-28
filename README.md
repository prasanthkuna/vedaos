# VEDA OS

Monorepo containing:
- `be/` - Backend services (TypeScript, Bun-first workflow)
- `fe/` - Frontend mobile app scaffold (Expo + React Native)

## Quick Start

### Backend
```bash
cd be
bun install
bun run dev
```

### Frontend
```bash
cd fe
npm install
npm run start
```

## Repo Standards
- Keep `main` releasable.
- Use feature flags for incomplete modules.
- Validate inputs with shared schemas before business logic.
- Never log sensitive birth details.
