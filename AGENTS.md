# AGENTS.md

## Running the app (Base44 dev environment)

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- Single service `web` (node:22) runs `tsx watch server.ts`, which starts the Express API **and** mounts Vite in middleware mode on port **3000** (`server.ts`). There is no separate frontend/backend port — everything is one origin.
- Source is bind-mounted from the repo root into `/app`; `node_modules` lives in a named volume and is installed at container start. Edits hot-reload (Express/tsx restarts; Vite HMR for the React app).
- Health check: `GET /api/health` → 200. Verify with `curl -s localhost:3000/api/health`.
- Database is SQLite, created automatically under `data/` on first boot (Node's experimental `node:sqlite`). No migration step is needed.

## Quirks

- `node:sqlite` prints an `ExperimentalWarning` on startup — expected, harmless.
- Vite logs a postcss warning: `@import must precede all other statements` in `src/index.css`. Cosmetic; the Google Fonts import still loads.
- There is no repo `.env` in the sandbox. Secrets come from `/run/base44/app.env` (wired via compose `env_file`). Do not create a repo-root `.env`.

## Optional integrations

- Facebook publishing (`server/facebookService.ts`) works in mock mode when `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN` are unset. These are **optional** and not required to boot; without them the automation UI reports no credentials configured.
- `GEMINI_API_KEY` is documented in `.env.example` but is not referenced by the server code.
