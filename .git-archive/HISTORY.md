# Archived pre-consolidation git history

On 2026-08-27T15:45:13Z the separate `apps/backend` and `apps/frontend` git
repositories were merged into a single repo at the project root. Their full history is
preserved in the bundles in this directory.

Recover either history with:

```bash
git clone .git-archive/backend.bundle /tmp/ai-job-tracker-backend-history
git clone .git-archive/frontend.bundle /tmp/ai-job-tracker-frontend-history
```

## backend — branches at archive time
      features/auth-ui-upgrade ff26094 docs: bring README in line with the actual API surface
    * main                     ff26094 [origin/main] docs: bring README in line with the actual API surface

### backend log
    ff26094 (HEAD -> main, origin/main, origin/HEAD, features/auth-ui-upgrade) docs: bring README in line with the actual API surface
    e00f6bc refactor: harden backend security/config and add request validation
    99d41a7 chore: checkpoint in-progress auth/job hardening
    fc84ac7 fix auth and user specific job tracking
    908c356 add full authentication and protected dashboard
    f9b6ca2 Improved README for portfolio
    c0295a9 Initial commit - AI Job Tracker API with auth, CRUD, filters, pagination

## frontend — branches at archive time
    * features/auth-ui-upgrade 77f18b1 feat: add kanban board view to the dashboard
      master                   77f18b1 feat: add kanban board view to the dashboard

### frontend log
    77f18b1 (HEAD -> features/auth-ui-upgrade, master) feat: add kanban board view to the dashboard
    5330a51 chore: remove unused create-next-app assets, write a real README
    bcb2259 refactor: finish dashboard split and consolidate the API layer
    e12722f chore: checkpoint in-progress dashboard refactor
    61f0605  fix ui and some other features
    cc77234 Initial commit from Create Next App
