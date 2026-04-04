# Fight Club

A privacy-first martial arts class management platform for teachers and students. Teachers create classes, manage schedules, send announcements, provide feedback, and track belt progression. Students join via invitation links, view their dashboard, and receive AI-powered improvement tips — all with strong data privacy guarantees including encryption at rest, GDPR-style data export, and full account erasure.

Built as a full-stack **Nx monorepo** with a clear separation between backend API and frontend SPA, deployed to Render.com with a Supabase PostgreSQL database.

## Tech Stack

| Layer    | Technology                                                            |
| -------- | --------------------------------------------------------------------- |
| Backend  | AdonisJS 6, Lucid ORM, Japa test runner                               |
| Frontend | React 19, Vite, TanStack Router, TanStack Query, React Hook Form, Zod |
| Styling  | Tailwind CSS                                                          |
| Database | PostgreSQL 16 (Supabase in production)                                |
| Cache    | Redis / Valkey                                                        |
| AI       | Anthropic Claude API (improvement tips)                               |
| Monorepo | Nx (task orchestration, caching, affected commands)                   |
| Infra    | Docker Compose (dev), Render.com (prod), GitHub Actions (CI)          |

## Live Demo

> **URL:** _https://fight-club-app.onrender.com_ (update after first deploy)
>
> | Role    | Email              | Password    |
> | ------- | ------------------ | ----------- |
> | Teacher | `teacher@demo.com` | `Demo1234!` |
> | Student | `student@demo.com` | `Demo1234!` |
>
> The demo is seeded with sample classes, enrollments, announcements, feedback, and belt progress.

## Screenshots

> _Screenshots will be added after the first production deployment._
>
> Planned screenshots:
>
> - Teacher dashboard
> - Class detail with student list
> - Student join flow (consent dialog)
> - Feedback form with AI suggestion
> - Belt timeline
> - Privacy center

## Local Development Setup

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Node.js 20+ (for running outside Docker)

### Quick Start (Docker)

```bash
git clone https://github.com/joaoGabriel55/fight-club.git
cd fight-club

# Copy environment files
cp backend/.env.example backend/.env    # fill in APP_KEY (run: cd backend && node ace.js generate:key)
cp frontend/.env.example frontend/.env

# Start all services (PostgreSQL, Valkey, Backend, Frontend, Adminer)
docker compose -f docker-compose.dev.yml up --build

# Backend:  http://localhost:3333
# Frontend: http://localhost:3000
# Adminer:  http://localhost:8080
```

The dev compose file automatically runs migrations and seeds the database on startup.

### Local (non-Docker)

```bash
# Install all workspace dependencies from the root
npm install

# Copy environment files
cp backend/.env.example backend/.env   # fill in APP_KEY, DB_*, REDIS_*
cp frontend/.env.example frontend/.env

# Run backend
cd backend
node ace.js migration:run
node ace.js db:seed
node ace.js serve --hmr

# Frontend (separate terminal)
cd frontend
npm run dev
```

### Nx Commands

Run tasks across the monorepo using Nx:

```bash
# Run a single project target
npx nx build fight-club-frontend
npx nx test fight-club-backend
npx nx lint fight-club-backend

# Run tasks across all projects
npx nx run-many -t build test lint

# Run only affected projects (based on git changes)
npx nx affected -t build test lint

# Visualize project dependency graph
npx nx graph
```

## Running Tests

```bash
# Run all tests across the monorepo
npx nx run-many -t test

# Backend (Japa)
npx nx test fight-club-backend

# Single backend test file
cd backend && node ace.js test --files="tests/functional/auth.spec.ts"

# Frontend (Vitest)
npx nx test fight-club-frontend

# Frontend watch mode
cd frontend && npm run test:watch
```

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Required | Default       | Description                                                                                     |
| ------------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `NODE_ENV`          | Yes      | `development` | `development`, `production`, or `test`                                                          |
| `PORT`              | Yes      | `3333`        | HTTP server port                                                                                |
| `HOST`              | Yes      | `localhost`   | Bind address (`0.0.0.0` in Docker/production)                                                   |
| `APP_KEY`           | Yes      | —             | 32-char encryption key. Generate with `node ace.js generate:key`                                |
| `APP_NAME`          | Yes      | `FightClub`   | Application name                                                                                |
| `LOG_LEVEL`         | Yes      | `info`        | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`                                    |
| `VITE_APP_URL`      | Yes      | —             | Frontend origin URL for CORS (e.g. `http://localhost:3000`)                                     |
| `DATABASE_URL`      | No       | —             | Full PostgreSQL connection string (Supabase). **Takes precedence** over individual `DB_*` vars. |
| `DB_HOST`           | No\*     | —             | PostgreSQL host. \*Required if `DATABASE_URL` is not set.                                       |
| `DB_PORT`           | No\*     | —             | PostgreSQL port. \*Required if `DATABASE_URL` is not set.                                       |
| `DB_USER`           | No\*     | —             | PostgreSQL user. \*Required if `DATABASE_URL` is not set.                                       |
| `DB_PASSWORD`       | No       | —             | PostgreSQL password                                                                             |
| `DB_DATABASE`       | No\*     | —             | PostgreSQL database name. \*Required if `DATABASE_URL` is not set.                              |
| `REDIS_HOST`        | Yes      | —             | Redis/Valkey host                                                                               |
| `REDIS_PORT`        | Yes      | —             | Redis/Valkey port                                                                               |
| `REDIS_PASSWORD`    | No       | —             | Redis/Valkey password                                                                           |
| `LIMITER_STORE`     | Yes      | `database`    | Rate limiter backend: `database` or `memory`                                                    |
| `TOKEN_EXPIRY`      | No       | `7 days`      | Auth token TTL (e.g. `7 days`, `24 hours`)                                                      |
| `ANTHROPIC_API_KEY` | No       | —             | Anthropic API key for AI improvement tips. Returns 503 if unset.                                |
| `TZ`                | No       | `UTC`         | Server timezone                                                                                 |

### Frontend (`frontend/.env`)

| Variable                 | Required | Default                 | Description                        |
| ------------------------ | -------- | ----------------------- | ---------------------------------- |
| `VITE_API_URL`           | Yes      | `http://localhost:3333` | Backend API base URL               |
| `VITE_APP_NAME`          | No       | `Fight Club`            | App display name                   |
| `VITE_SUPABASE_URL`      | No       | —                       | Supabase project URL (for avatars) |
| `VITE_SUPABASE_ANON_KEY` | No       | —                       | Supabase anon key (for avatars)    |

## Privacy Policy

The privacy policy is available at the `/privacy` route in the application, or via the public API endpoint:

```
GET /api/v1/privacy/policy
```

Key privacy commitments:

- **Encryption at rest:** Student last names, emails, and birth dates are AES-encrypted in the database.
- **Data export:** Any user can export all their personal data as JSON via the Privacy Center.
- **Account erasure:** Full account deletion anonymizes PII, hard-deletes enrollments and related data, and nullifies audit log references.
- **AI privacy:** AI improvement tips never include student PII — only anonymized context (martial art, belt level, feedback content).
- **Audit logging:** Sensitive actions (login, profile changes, data exports, account deletions) are recorded in an audit log.
- **Consent tracking:** Student enrollment requires explicit data consent with timestamp.

## AI Usage Documentation

This project uses AI in two ways:

### 1. In-App AI Features

- **Student Improvement Tips:** Students can request AI-generated training tips via the Claude API. The backend sends anonymized context (martial art, belt level, months enrolled, teacher feedback, focus area) to generate personalized suggestions. No PII is ever sent to the AI provider.
- Rate limited to 10 requests/min per student.
- Gracefully degrades (503) if `ANTHROPIC_API_KEY` is not configured.

### 2. AI-Assisted Development

This project was developed with assistance from Claude (Anthropic's AI):

- **Architecture design:** Database schema, API endpoint structure, and middleware pipeline were designed collaboratively with AI assistance.
- **Code generation:** Controllers, models, migrations, services, React components, and hooks were generated with AI and reviewed/refined by the developer.
- **Test generation:** Backend (Japa) and frontend (Vitest) test suites were written with AI assistance.
- **Documentation:** This README, CLAUDE.md, and ticket specifications were drafted with AI support.
- **Security review:** Privacy features (encryption, anonymization, audit logging) were designed and reviewed with AI input.

## Deployment

### Architecture

The app is deployed as a **monorepo on Render.com** using [Render's monorepo support](https://render.com/docs/monorepo-support):

```
fight-club/
  nx.json              # Nx workspace configuration
  package.json         # Root workspace with npm workspaces
  render.yaml          # Render Blueprint — defines both services
  backend/             # AdonisJS API  -> Render Web Service (rootDir: backend)
  frontend/            # React SPA     -> Render Static Site (rootDir: frontend)
```

### Services

| Service          | Type        | Root Dir   | URL                                   |
| ---------------- | ----------- | ---------- | ------------------------------------- |
| `fight-club-api` | Web Service | `backend`  | `https://fight-club-api.onrender.com` |
| `fight-club-app` | Static Site | `frontend` | `https://fight-club-app.onrender.com` |

### Database

Production uses **Supabase PostgreSQL** (external to Render):

- Connection string set as `DATABASE_URL` environment variable in the Render dashboard.
- Supabase provides managed backups, connection pooling, and a SQL dashboard.
- Migrations run automatically during the backend build step (`npm ci && node ace.js migration:run`).

### Redis

A Render-managed Redis instance (or external provider like Upstash) provides caching and rate limiting. Configure via `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in the Render dashboard.

### render.yaml Blueprint

The `render.yaml` file at the repository root defines the entire infrastructure. Render reads it to create/update services. Key features:

- **Build filters:** Backend only redeploys when `backend/**` changes; frontend only when `frontend/**` changes.
- **SPA fallback:** Frontend uses a rewrite rule (`/* -> /index.html`) for client-side routing.
- **Security headers:** `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` set on all frontend responses.
- **Secrets:** All sensitive env vars use `sync: false` — they must be set manually in the Render dashboard, never committed to the repo.

### HTTPS

- Render provides **free managed TLS** for all services with automatic certificate provisioning.
- HTTP-to-HTTPS redirect is enforced automatically by Render.
- `Strict-Transport-Security` header is set by the backend's security headers middleware in production.

### CI/CD

- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs backend tests (with PostgreSQL + Valkey service containers), frontend tests, and build checks using Nx commands on every push to `main` and on PRs. Nx caching speeds up repeat runs.
- **CD:** Render auto-deploys on push to `main` via native Git integration — no separate deploy workflow needed.

### Seeding Production

After the first deploy, seed the production database:

```bash
# Via Render Shell (or SSH)
cd backend
node ace.js db:seed
```

The seeder is idempotent — running it multiple times will not create duplicate data.

## License

This project is for educational/portfolio purposes.
