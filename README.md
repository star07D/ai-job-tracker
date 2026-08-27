# Rolio

A job-application tracker: register/login, per-user job CRUD with a list **and** kanban
board, a pipeline overview with per-stage stats and a chart, and a per-job detail page.
Light and dark themes.

Monorepo with two npm workspaces:

| Workspace | Path | Stack | Port |
|---|---|---|---|
| `backend` | `apps/backend` | NestJS 11, Prisma 5 + PostgreSQL, JWT (Passport) | 4000 |
| `frontend` | `apps/frontend` | Next.js 16, React 19, Tailwind 3 | 3000 |

## Getting started

```bash
npm install                          # once, from the repo root — installs both workspaces

cp apps/backend/.env.example       apps/backend/.env         # set DATABASE_URL + JWT_SECRET
cp apps/frontend/.env.local.example apps/frontend/.env.local # set NEXT_PUBLIC_API_URL if not :4000

npm run prisma:migrate -w backend    # apply DB migrations (or: npx prisma migrate dev)
npm run dev                          # starts backend (:4000) and frontend (:3000) together
```

Open <http://localhost:3000>. `/` is the marketing page; `/dashboard` requires a session.

## Scripts (run from the repo root)

| Command | Does |
|---|---|
| `npm run dev` | backend + frontend together (via `concurrently`) |
| `npm run dev:backend` / `npm run dev:frontend` | one side only |
| `npm run build` | production build of both |
| `npm run lint` | eslint both |
| `npm test` | backend Jest suite |

Per-workspace scripts still work with `-w`, e.g. `npm run start:dev -w backend`.

## Design

Frontend visual system — "Editorial × Electric":

- **Type:** Fraunces (display), Hanken Grotesk (UI), IBM Plex Mono (data/labels)
- **Colour:** cool near-neutral greys + one electric ultramarine accent, used solid
- **Theme:** light + dark on CSS variables (`app/globals.css`), toggled via `next-themes`
- **Primitives:** `apps/frontend/components/ui/*` (button, input, select, card, dialog,
  badge, dropdown, …)

## Layout

```
apps/backend    NestJS API — auth, jobs, users, Prisma schema + migrations
apps/frontend   Next.js app — see apps/frontend/AGENTS.md for Next 16 rules
.git-archive    pre-consolidation git history of the two original repos (bundles)
```

## Known gaps / deferred work

- `GET /jobs` filtering, sorting and pagination are done client-side.
- The JWT lives in `localStorage`; moving it to an httpOnly cookie is deferred.
- No refresh tokens; access token lifetime is 7 days.
- The job-detail "Interview prep" panel is a static checklist. AI-generated prep is the
  next planned feature.
- Deployment: frontend → Vercel, backend → Render, DB already on Supabase.
