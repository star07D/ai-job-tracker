# Rolio

**Live:** <https://ai-job-tracker-frontend-opal.vercel.app>
*(the API is on a free tier that sleeps when idle — the first request after a quiet spell takes ~30s)*

A job-application tracker: register/login, per-user job CRUD with a list **and** kanban
board, a pipeline overview with per-stage stats and a chart, a per-job detail page with a
recruiter/hiring-manager contact card, follow-up reminders (a "next step" + due date per
role, surfaced in a dashboard "Needs attention" strip) with an optional daily email
digest, staleness flags on applications that have gone quiet in a stage, and two AI
touches — interview prep per role, and autofilling a new application from a pasted job
description. Light and dark themes.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/dashboard-dark.png">
  <img alt="Rolio dashboard — applications list, follow-up reminders, and pipeline stats" src="docs/dashboard-light.png">
</picture>

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
| `npm test` | backend (Jest) + frontend (Vitest) suites |
| `npm run test:backend` / `npm run test:frontend` | one suite only |
| `npm run e2e` | Playwright browser journey (needs Docker for a throwaway Postgres) |

Per-workspace scripts still work with `-w`, e.g. `npm run start:dev -w backend`.

## Design

Frontend visual system — "Editorial × Electric":

- **Type:** Fraunces (display), Hanken Grotesk (UI), IBM Plex Mono (data/labels)
- **Colour:** cool near-neutral greys + one electric ultramarine accent, used solid
- **Theme:** light + dark on CSS variables (`app/globals.css`), toggled via `next-themes`
- **Primitives:** `apps/frontend/components/ui/*` (button, input, select, card, dialog,
  badge, dropdown, …)

## AI features

Two things, both on **Google Gemini's free tier**:

- **Interview prep** — the job-detail page generates prep tailored to a role: likely
  questions, talking points, what to research, questions to ask — from the job's details
  and your notes.
- **Autofill from a job description** — paste a posting into the "Add application" dialog
  and it fills in the role, company, location, salary and a few notes for you to review.

![AI-generated interview prep on the job-detail page](docs/job-prep-light.png)

It runs on **Google Gemini's free tier** (Flash models — no credit card). Set it up:

1. Get a free key at <https://aistudio.google.com/apikey>
2. Add it to `apps/backend/.env`: `GEMINI_API_KEY=...` (optionally `GEMINI_MODEL=`)
3. Restart. Without the key the feature shows an "not set up" message and nothing else
   is affected.

The provider is behind an interface (`apps/backend/src/prep/prep.types.ts`) — swapping in
Claude/OpenAI is one line in `prep.module.ts`. Note: Google may use free-tier prompts to
improve its products.

## Email digest

Opt in from the account menu (top right → **Settings**) and once a day you'll get an
email with any follow-ups that are due or overdue and any applications that have gone
quiet — each linking straight to the job. Off by default.

It runs on **Resend's free tier**, sending to your own account email (no domain
verification needed for that). Render's free plan has no cron, so the schedule lives in
GitHub Actions (`.github/workflows/email-digest.yml`), which calls a secret-protected
`POST /internal/digest` once a day. Set it up:

1. Get a free key at <https://resend.com/api-keys>
2. Add `RESEND_API_KEY` to the Render service's env vars
3. Generate any random string, add it as `DIGEST_SECRET` on Render **and** as a GitHub
   Actions repo secret (Settings → Secrets and variables → Actions)
4. Add a `DIGEST_URL` repo secret: `https://<your-render-service>.onrender.com/internal/digest`
5. Turn the toggle on in Settings. Test the schedule anytime from the Actions tab
   ("Email digest" → Run workflow) instead of waiting for the next scheduled run.

Without `RESEND_API_KEY`/`DIGEST_SECRET` set, the endpoint is disabled — nothing else is
affected, and the in-app "Needs attention" strip still works as before.

## Auth

Short-lived access tokens + refresh-token rotation, not a long-lived JWT in `localStorage`:

- The **access token** (15 min) comes back from login/signup in the response body and is
  kept in memory only — never `localStorage` — so it isn't readable by an injected script.
  It's gone on a full page reload by design.
- The **refresh token** lives in an **httpOnly, `SameSite` cookie** scoped to `/auth`
  (`Secure` + `SameSite=None` in production; plain `SameSite=Lax` on localhost), so
  frontend JS never touches it either. Each use **rotates** it — the old one is revoked in
  the database the moment a new one is issued, so a replayed/stolen token is rejected.
- A silent `POST /auth/refresh` on page load (and once, automatically, after any 401)
  recovers the session from that cookie — that's what makes losing the in-memory token on
  reload invisible to you as a user.
- **Logout** revokes that session's refresh token server-side, not just the cookie.

## Layout

```
apps/backend    NestJS API — auth, jobs, users, prep (AI), Prisma schema + migrations
apps/frontend   Next.js app — see apps/frontend/AGENTS.md for Next 16 rules
.git-archive    pre-consolidation git history of the two original repos (bundles)
```

## Known gaps / deferred work

- `GET /jobs` filtering, sorting and pagination are done client-side.
- Refresh tokens aren't pruned once expired/revoked — the rows just linger (harmless,
  since expiry/revocation is checked on every use, just not swept up).

## Deploying

Frontend → **Vercel**, API → **Render** (`render.yaml`), database → **Supabase** (already
provisioned). Both hosts auto-redeploy on push to `main`. See **[DEPLOYING.md](DEPLOYING.md)**,
or run the guided script:

```bash
bash scripts/deploy-wizard.sh
```
