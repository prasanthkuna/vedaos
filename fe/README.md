# Frontend (veda-fe)

Mobile app for VEDA OS (Expo Router + TypeScript, Bun scripts only).

## Setup

1. Copy `.env.example` to `.env`
2. Set `EXPO_PUBLIC_API_BASE_URL` to your Encore API base URL
3. Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for Clerk provider boot
4. Sign in through Clerk in-app to obtain authenticated session token

## Run

```bash
bun install
bun run start
```

## Implemented in this pass

- Onboarding profile creation
- Engine integration: risk, Atmakaraka, quick/full story
- Claim validation loop with live score refresh
- Weekly card + forecast triggers
- Compliance consent endpoint integration
- TRD stack foundations: Zustand store, TanStack Query mutations, i18next (EN/HI/TE), Clerk provider shell
- Mobile-first UI optimized for direct device testing
