# Fight Club

A privacy-first martial arts class management platform for teachers and students. Teachers create classes, manage schedules, send announcements, provide feedback, and track belt progression. Students join via invitation links, view their dashboard, and receive AI-powered improvement tips — all with strong data privacy guarantees including encryption at rest, GDPR-style data export, and full account erasure.

Built as a full-stack **npm workspaces** monorepo with a clear separation between backend API and frontend SPA. Deployable to Render.com, any VPS via Docker Compose, or any container platform.

## Tech Stack

| Layer    | Technology                                                            |
| -------- | --------------------------------------------------------------------- |
| Backend  | AdonisJS 6, Lucid ORM, Japa test runner                               |
| Frontend | React 19, Vite, TanStack Router, TanStack Query, React Hook Form, Zod |
| Styling  | Tailwind CSS                                                          |
| Database | PostgreSQL 16 (Supabase in production)                                |
| Cache    | Valkey (Redis-compatible)                                             |
| Jobs     | BullMQ (scheduled jobs backed by Valkey)                              |
| AI       | Anthropic Claude API (improvement tips)                               |
| Infra    | Docker Compose (dev + prod), Render.com, GitHub Actions (CI)          |

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

## Running Tests

```bash
# Backend (Japa)
cd backend && npm run test

# Single backend test file
cd backend && node ace.js test --files="tests/functional/auth.spec.ts"

# Frontend (Vitest)
cd frontend && npm test

# Frontend watch mode
cd frontend && npm run test:watch

# Frontend E2E (Playwright)
cd frontend && npm run e2e
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

### Project Structure

```
fight-club/
  package.json             # Root workspace (npm workspaces)
  render.yaml              # Render Blueprint — defines both services
  docker-compose.dev.yml   # Development environment
  docker-compose.prod.yml  # VPS production environment
  backend/                 # AdonisJS API  (Dockerfile for production)
  frontend/                # React SPA     (Dockerfile with nginx)
```

### Option 1: Render.com

Both services are defined in `render.yaml`, each built via its own Dockerfile:

| Service          | Type           | Dockerfile             | URL                                   |
| ---------------- | -------------- | ---------------------- | ------------------------------------- |
| `fight-club-api` | Docker Web Svc | `backend/Dockerfile`   | `https://fight-club-api.onrender.com` |
| `fight-club-app` | Docker Web Svc | `frontend/Dockerfile`  | `https://fight-club-app.onrender.com` |

- **Build filters:** Backend only redeploys when `backend/**` changes; frontend only when `frontend/**` changes.
- **Secrets:** All sensitive env vars use `sync: false` — set manually in the Render dashboard.
- Render provides **free managed TLS** with automatic certificate provisioning and HTTP-to-HTTPS redirect.

### Option 2: VPS / Self-hosted (Docker Compose)

For deploying to any VPS with Docker installed:

```bash
# Create .env at the repo root with required vars
cat > .env <<EOF
APP_KEY=your-32-char-key
DB_PASSWORD=your-db-password
VITE_APP_URL=https://your-domain.com
VITE_API_URL=https://api.your-domain.com
# Optional:
REDIS_PASSWORD=your-redis-password
ANTHROPIC_API_KEY=your-key
EOF

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

Services included: PostgreSQL 16, Valkey, backend (port 3333), frontend/nginx (port 80). Data is persisted in named Docker volumes (`pgdata`, `valkeydata`).

### Database

Production uses **Supabase PostgreSQL** (on Render) or local PostgreSQL (on VPS):

- **Render:** Set `DATABASE_URL` in the dashboard. Uses SSL connection to Supabase.
- **VPS:** PostgreSQL runs in the compose stack. Configure `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` in `.env`.
- Migrations run automatically during the backend Docker build (`node ace.js migration:run`).

### Valkey (Redis-compatible)

Valkey provides the backing store for BullMQ scheduled jobs and `@adonisjs/redis`. Configure via `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.

### CI/CD

- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs backend tests (with PostgreSQL + Valkey service containers), frontend tests, and build checks on every push to `main` and on PRs.
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
