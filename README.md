# AeroFocus

AeroFocus is a self-aware scroll tracker that turns doomscrolling into a visible habit, a little public shame, and a surprisingly motivating competition.

[Website](https://example.com) • [Web App](https://example.com)

[![Expo](https://img.shields.io/badge/Expo-React%20Native-000000?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Postgres](https://img.shields.io/badge/Postgres-Drizzle-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Why AeroFocus?

Your thumb is busy. Your life is waiting.

AeroFocus makes attention consumption visible. Instead of pretending your scrolling is harmless, it turns it into a darkly playful scorecard:

- track the “brain decay” effect of doomscrolling
- monitor simulated scroll volume and session time
- compare your focus against friends in live battle mode
- set your watch list of the apps stealing your attention
- use self-awareness instead of vague productivity guilt

## Features

- Dark, high-contrast mobile UI for focus and habit reflection
- Onboarding flow for choosing your target apps
- Simulated scroll tracking with “brain status” progression
- Daily metrics and attention scorecards
- Friend battle system with leaderboards and roast-style messages
- Type-safe API contract generated from OpenAPI specs
- App permission-aware flow designed to explain access clearly before activation

## Quick start

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm run typecheck
```

## Project structure

```text
AeroFocus/
├── artifacts/
│   ├── aero-focus/       # Expo / React Native app
│   ├── api-server/       # Express API
│   └── mockup-sandbox/   # UI/mock exploration
├── lib/
│   ├── api-client-react/
│   ├── api-spec/
│   ├── api-zod/
│   └── db/
├── scripts/              # repo tools and automation
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── replit.md
├── README.md
└── pnpm-lock.yaml
```

## Run the app

```bash
cd artifacts/aero-focus
pnpm install
pnpm run dev
```

## Product tone

AeroFocus is intentionally a little brutal. It is designed to feel sharp, honest, and slightly self-aware rather than polished-corporate or fluffy. The idea is simple: if your thumb is stealing your attention, the app should say it plainly.

## Permission model

This product is designed to be transparent about device access. The simulator-first experience makes it clear when tracking is simulated and when a real permission request would occur, so users understand the difference between a demo and real OS-level monitoring.

## Status

- Mobile app: in active development
- API layer: scaffolded and connected
- Simulation layer: working and product-facing
- Documentation: refined for launch-ready storytelling

## License

MIT
