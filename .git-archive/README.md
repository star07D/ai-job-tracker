# `.git-archive/`

Before this project was consolidated into a single repository, `apps/backend` and
`apps/frontend` were two independent git repositories. This directory keeps their complete
original history as git bundles so nothing is lost.

| Bundle | Original repo | Tip commit |
|---|---|---|
| `backend.bundle` | `apps/backend` | `ff26094` — *docs: bring README in line with the actual API surface* |
| `frontend.bundle` | `apps/frontend` | `77f18b1` — *feat: add kanban board view to the dashboard* |

Recover a history:

```bash
git clone .git-archive/backend.bundle  ../ai-job-tracker-backend-history
git clone .git-archive/frontend.bundle ../ai-job-tracker-frontend-history
```

See `HISTORY.md` for the full commit logs and branch tips as they were at archive time.
