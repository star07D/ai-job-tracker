# Deploying Rolio

Three pieces:

| Piece | Host | Notes |
|---|---|---|
| Database | **Supabase** | already provisioned — the `DATABASE_URL` in `apps/backend/.env` |
| API (`apps/backend`) | **Render** (free web service) | sleeps after ~15 min idle; first request then takes ~30s |
| Frontend (`apps/frontend`) | **Vercel** | |

Both hosts auto-redeploy on push to `main`.

There is a guided script that walks the dashboard steps:

```bash
bash scripts/deploy-wizard.sh
```

Or follow the manual steps below.

---

## 1. Backend → Render

Render reads [`render.yaml`](render.yaml) (a "Blueprint").

1. <https://dashboard.render.com> → **New** → **Blueprint** → connect the
   `star07D/ai-job-tracker` repo. Render finds `render.yaml` and proposes a
   service called **rolio-api**.
2. Before the first deploy, set the three secret env vars (Render will prompt for
   the `sync: false` ones):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Supabase connection string (same as `apps/backend/.env`) |
   | `JWT_SECRET` | a long random string — generate with `openssl rand -base64 48` |
   | `FRONTEND_URL` | leave as `https://placeholder` for now; update in step 3 |
   | `GEMINI_API_KEY` | *optional* — enables AI interview prep. Free key at <https://aistudio.google.com/apikey>. Leave blank to ship without it. |
3. Deploy. The build runs `prisma migrate deploy` automatically. When it's live,
   copy the service URL (e.g. `https://rolio-api.onrender.com`) and check
   `https://<that-url>/health` returns `{"status":"ok"}`.

## 2. Frontend → Vercel

1. <https://vercel.com/new> → import `star07D/ai-job-tracker`.
2. **Root Directory** → `apps/frontend`. Framework preset: Next.js (auto).
3. Environment variable:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the Render URL from step 1.3 (no trailing slash) |
4. Deploy. Copy the production URL (e.g. `https://rolio.vercel.app`).

## 3. Close the loop (CORS)

Back in Render → **rolio-api** → Environment → set `FRONTEND_URL` to the Vercel
production URL and save (this triggers a redeploy). `*.vercel.app` preview
URLs and `localhost:3000` are always allowed, so this only needs the production
origin.

## 4. Verify

- Open the Vercel URL, sign up, add an application — it should persist.
- The first API call after the backend has been idle takes ~30s (Render free
  tier cold start); subsequent calls are fast.

## Redeploying / migrations

- Push to `main` → both hosts rebuild.
- New Prisma migration: commit it under `apps/backend/prisma/migrations/`; the
  Render build runs `prisma migrate deploy` on every deploy.
