# AI Job Tracker — Frontend

Next.js 16 / React 19 dashboard for tracking job applications: login/signup,
a job board with search/filter/sort, per-status stats and a chart, and a
per-job detail page. Talks to the NestJS API in `../backend`.

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if not localhost:4000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/` redirects to
`/login`; `/dashboard` and `/dashboard/job/[id]` require an authenticated
session (enforced client-side by `components/ProtectedRoute.tsx`).

## Structure

* `app/login`, `app/signup` — auth pages, call `lib/api.ts`
* `app/dashboard` — job board (`page.tsx`) and its components
* `app/dashboard/job/[id]` — single job detail view
* `lib/api.ts` — typed fetch wrapper for the backend API
* `lib/types.ts`, `lib/job-status.ts` — shared `Job` type and the single
  source of truth for status values/colors

## Scripts

* `npm run dev` — start the dev server
* `npm run build` / `npm run start` — production build/run
* `npm run lint` — eslint
