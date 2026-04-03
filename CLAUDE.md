# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development environment

All services run via Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up --build      # start everything
docker-compose -f docker-compose.dev.yml down            # stop
docker-compose -f docker-compose.dev.yml down -v         # stop + wipe volumes (fresh DB)
```

After adding/removing npm packages, rebuild the affected service image:

```bash
docker-compose -f docker-compose.dev.yml up --build backend
docker-compose -f docker-compose.dev.yml up --build frontend
```

For local (non-Docker) development, copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`, then:

```bash
cd backend && npm install && node ace.js serve --hmr
cd frontend && npm install && npm run dev
```

## Backend commands (run from `backend/`)

```bash
node ace.js serve --hmr          # dev server with hot reload
node ace.js migration:run        # run pending migrations
node ace.js migration:rollback   # rollback last batch
node ace.js migration:fresh      # drop all + re-run (dev only)
node ace.js generate:key         # generate APP_KEY
npm run test                     # run all tests
node ace.js test --files="tests/functional/auth.spec.ts"  # single test file
npm run lint
npm run typecheck
```

## Frontend commands (run from `frontend/`)

```bash
npm run dev          # dev server on :3000
npm run build        # tsc + vite build
npm test             # vitest run (once)
npm run test:watch   # vitest watch mode
npm run lint         # tsc --noEmit
```

## Architecture

### Backend — AdonisJS 6

**Entry flow:** `ace.js` → registers `ts-node-maintained/register/esm` → TypeScript runs directly without pre-compilation in dev.

**Key locations:**

- `start/routes.ts` — all HTTP route definitions
- `start/kernel.ts` — middleware registration (server-wide, router-wide, named)
- `start/env.ts` — Vine-validated env schema; the canonical list of required env vars
- `start/limiter.ts` — rate limit rules
- `app/models/` — Lucid ORM models
- `app/controllers/` — route handlers
- `app/middleware/` — `auth` (named), `force_json_response`, `container_bindings`
- `app/exceptions/handler.ts` — centralised JSON error responses
- `database/migrations/` — schema history

**Auth:** Opaque access tokens via `@adonisjs/auth` with `DbAccessTokensProvider`. Tokens are stored hashed in `auth_access_tokens`. Login UID is email; passwords hashed with Scrypt. Protected routes use the named `auth` middleware.

**Privacy / encryption:** `User.lastName`, `User.email`, `User.birthDate` are encrypted at rest using AdonisJS's encryption service via `prepare`/`consume` column hooks. The `audit_logs` table records sensitive actions.

**Rate limiting:** 10 req/min global throttle (database-backed via `LIMITER_STORE=database`).

**CORS:** Strict — only the origin in `VITE_APP_URL` is allowed (set in `config/cors.ts`).

### Frontend — Vite + React 19

**Routing:** TanStack Router with file-based routes in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` — never edit that file manually. Add routes by creating files in `src/routes/`.

**Data fetching:** TanStack Query. Client config is in `src/shared/lib/query-client.ts` (1 min stale time; no retry on 401/403/404).

**API calls:** All requests go through `src/shared/lib/api-client.ts` (`apiClient<T>(path, options)`). Tokens are stored **in memory only** — never in localStorage or sessionStorage. On 401, the token is cleared and the user is redirected to `/login` via the injected `_navigateTo` callback.

**Domain structure:** `src/domains/{auth,classes,enrollments,feedback,notifications}/` — feature code lives here. Shared utilities and components go in `src/shared/`.

### Database schema (PostgreSQL)

| Table                | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `users`              | Core accounts; `profile_type` is `teacher` or `student` |
| `auth_access_tokens` | Hashed opaque tokens with expiry                        |
| `student_profiles`   | Weight, height, data consent timestamp                  |
| `teacher_profiles`   | Fight experience                                        |
| `audit_logs`         | JSONB metadata per action per user                      |
| `rate_limits`        | Database-backed rate limiter state                      |

## Environment variables

Required backend vars are validated at startup by `start/env.ts`. The full list is in `backend/.env.example`. Key vars for Docker differ from local:

| Var            | Docker value            | Local value             |
| -------------- | ----------------------- | ----------------------- |
| `HOST`         | `0.0.0.0`               | `localhost`             |
| `DB_HOST`      | `postgres`              | `127.0.0.1`             |
| `REDIS_HOST`   | `valkey`                | `127.0.0.1`             |
| `VITE_APP_URL` | `http://localhost:3000` | `http://localhost:3000` |
