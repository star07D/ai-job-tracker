# Rolio — repo guide for agents

Monorepo, npm workspaces. **Run all commands from the repo root.**

```
apps/backend    NestJS 11 + Prisma 5 + PostgreSQL + JWT/Passport   (port 4000)
apps/frontend   Next.js 16 + React 19 + Tailwind 3                 (port 3000)
```

## Commands

| Task | Command |
|---|---|
| Install | `npm install` (root) |
| Run both | `npm run dev` |
| Run one | `npm run dev:backend` / `npm run dev:frontend` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Tests (both) | `npm test` — backend Jest, then frontend Vitest |
| One side | `npm run test:backend` / `npm run test:frontend` |
| Any workspace script | `npm run <script> -w backend` / `-w frontend` |

## Conventions

- **Backend**: standard NestJS module/controller/service layout. Config comes from
  `@nestjs/config` `ConfigService` — do not read `process.env` directly in app code.
  Every job/user query is scoped to the authenticated `userId`. DTOs use `class-validator`.
  Job status is one of `apps/backend/src/jobs/job-status.ts`.
- **Frontend**: Next 16 App Router, all client components. Auth token in `localStorage`;
  API calls go through `apps/frontend/lib/api.ts` (which redirects to `/login` on 401).
  Status values/colours live once in `apps/frontend/lib/job-status.ts`. Design tokens are
  CSS variables in `app/globals.css` (light on `:root`, dark on `.dark`); style through
  the Tailwind aliases (`bg-surface`, `text-fg-muted`, `text-accent`, …) and the
  primitives in `components/ui/*`, not ad-hoc colours. Theme via `next-themes`.
  **Read `apps/frontend/AGENTS.md` before writing frontend code** — this Next.js version
  has breaking changes vs. older training data.
- Env files are git-ignored; only `*.example` variants are committed.
- The two apps' original git histories are archived in `.git-archive/` (bundles).
