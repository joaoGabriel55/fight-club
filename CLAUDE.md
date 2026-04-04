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

**Auth:** Opaque access tokens via `@adonisjs/auth` with `DbAccessTokensProvider`. Tokens are stored hashed in `auth_access_tokens`. Login UID is email; passwords hashed with Scrypt. Protected routes use the named `auth` middleware. `CookieTokenMiddleware` (in `router.use`) reads the httpOnly `auth_token` cookie and injects it as an `Authorization` header when no header is already present, enabling cookie-based sessions without changing the auth guard.

**Privacy / encryption:** `User.lastName`, `User.email`, `User.birthDate` are encrypted at rest using AdonisJS's encryption service via `prepare`/`consume` column hooks. The `audit_logs` table records sensitive actions.

**Rate limiting:** 10 req/min global throttle (database-backed via `LIMITER_STORE=database`).

**CORS:** Strict — only the origin in `VITE_APP_URL` is allowed (set in `config/cors.ts`).

### Frontend — Vite + React 19

**Routing:** TanStack Router with file-based routes in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` — never edit that file manually. Add routes by creating files in `src/routes/`.

**Data fetching:** TanStack Query. Client config is in `src/shared/lib/query-client.ts` (1 min stale time; no retry on 401/403/404).

**API calls:** All requests go through `src/shared/lib/api-client.ts` (`apiClient<T>(path, options)`). Tokens are stored **in memory only** — never in localStorage or sessionStorage. On 401, the token is cleared and the user is redirected to `/login` via the injected `_navigateTo` callback.

**Domain structure:** `src/domains/{auth,classes,enrollments,feedback,notifications,announcements,invitations,belts}/` — feature code lives here. Shared utilities and components go in `src/shared/`.

### Database schema (PostgreSQL)

| Table                | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `users`              | Core accounts; `profile_type` is `teacher` or `student`   |
| `auth_access_tokens` | Hashed opaque tokens with expiry                          |
| `student_profiles`   | Weight, height, data consent timestamp                    |
| `teacher_profiles`   | Fight experience                                          |
| `audit_logs`         | JSONB metadata per action per user                        |
| `rate_limits`        | Database-backed rate limiter state                        |
| `classes`            | Martial arts classes; `has_belt_system` flag; soft delete |
| `class_schedules`    | Weekly schedule entries per class                         |
| `invitations`        | Join tokens with expiry and use counting                  |
| `enrollments`        | Student-class enrollment with consent tracking            |
| `announcements`      | Class announcements by teacher                            |
| `feedback`           | Teacher feedback per enrollment (encrypted content)       |
| `notifications`      | User notifications with type, title, body, expiry         |
| `belt_progress`      | Belt awards per enrollment with awarded_at and awarder    |

## Environment variables

Required backend vars are validated at startup by `start/env.ts`. The full list is in `backend/.env.example`. Key vars for Docker differ from local:

| Var            | Docker value            | Local value             |
| -------------- | ----------------------- | ----------------------- |
| `HOST`         | `0.0.0.0`               | `localhost`             |
| `DB_HOST`      | `postgres`              | `127.0.0.1`             |
| `REDIS_HOST`   | `valkey`                | `127.0.0.1`             |
| `VITE_APP_URL` | `http://localhost:3000` | `http://localhost:3000` |
| `TOKEN_EXPIRY` | `7 days`                | `7 days` (optional)     |

## Authentication (v0.2)

**Backend endpoints** — all under `/api/v1/auth`:

| Method   | Path        | Auth required | Description                         |
| -------- | ----------- | ------------- | ----------------------------------- |
| `POST`   | `/register` | No            | Create account + issue opaque token |
| `POST`   | `/login`    | No            | Verify credentials + issue token    |
| `DELETE` | `/logout`   | Yes           | Revoke current token                |
| `GET`    | `/me`       | Yes           | Return own profile (email visible)  |
| `PUT`    | `/me`       | Yes           | Update profile fields               |
| `DELETE` | `/me`       | Yes           | Anonymise account (soft-delete)     |

**Key design decisions:**

- Tokens are opaque (stored hashed in `auth_access_tokens`, never JWTs).
- `email` column is AES-encrypted (non-deterministic). A separate `email_hash` column (SHA-256 of normalised email) is used for duplicate detection and login lookups.
- Auth rate limit: 5 req/min per IP on `/register` and `/login`.
- `SanitizeInputMiddleware` strips HTML from all string inputs globally.
- `AuditLogService.log()` records `login`, `logout`, `profile_update`, `account_delete` events.

**Frontend** — domains in `src/domains/auth/`:

- Schemas: `login.schema.ts`, `register.schema.ts` (Zod)
- Services: `auth.service.ts` (`register`, `login`, `logout`, `getMe`, `updateMe`, `deleteMe`)
- Hooks: `useLogin`, `useRegister`, `useMe` (TanStack Query mutations/queries)
- Components: `LoginForm`, `RegisterForm`, `ConsentCheckbox` (React Hook Form + Zod)
- Shared hook: `src/shared/hooks/useAuth.ts`
- Token set as an **httpOnly cookie** by the backend on login/register; browser sends it automatically via `credentials: 'include'` — never touches JS storage (XSS-proof).
- `_token` is kept in-memory within the same page session (set by `setToken()` after login/register) and used for the `Authorization` header. On reload `_token` is null but the cookie carries the session.
- `_authenticated` boolean tracks whether the session is confirmed. Route guards call `GET /me` on reload to re-confirm (cookie-based), then call `markAuthenticated()`. Subsequent in-session navigations skip the `/me` call.
- `clearToken()` resets both `_token` and `_authenticated`; called on logout and on 401.
- `_authenticated.tsx` layout route guards all authenticated pages; redirects to `/login` if no token.

## Class & Schedule Management (v0.3)

**Database tables:** `classes`, `class_schedules`

**Backend endpoints** — all under `/api/v1/classes`, all require auth:

| Method   | Path                      | Description                                     |
| -------- | ------------------------- | ----------------------------------------------- |
| `POST`   | `/`                       | Create class + schedules (teacher only)         |
| `GET`    | `/`                       | List own classes (teacher only)                 |
| `GET`    | `/:id`                    | Class detail with schedules (owner only)        |
| `PUT`    | `/:id`                    | Update class metadata (owner only)              |
| `DELETE` | `/:id`                    | Soft-delete class (owner only)                  |
| `GET`    | `/:id/students`           | Enrolled students with minimal PII (owner only) |
| `POST`   | `/:classId/schedules`     | Add schedule to class                           |
| `PUT`    | `/:classId/schedules/:id` | Update schedule                                 |
| `DELETE` | `/:classId/schedules/:id` | Remove schedule                                 |

**Key design decisions:**

- No `@adonisjs/bouncer` dependency — ownership checks done inline in controllers.
- Teacher-only guard: `user.profileType !== 'teacher'` → `403` on all class endpoints.
- Ownership check: `cls.teacherId !== user.id` → `403`.
- Soft-delete: `deleted_at` timestamp set; class disappears from all list/detail queries.
- `end_time` ≤ `start_time` → `422` (validated in controller after VineJS).
- POST /classes reloads from DB after transaction so time values are normalised to `HH:MM:SS`.
- `AuditLogService.log()` records `class_created`, `class_updated`, `class_deleted` events.
- Student list (`GET /:id/students`) returns `[]` until the enrollment table is added (future ticket).

**Frontend** — domains in `src/domains/classes/`:

- Types: `class.types.ts` (Class, ClassListItem, ClassStudent, CreateClassInput, etc.)
- Schemas: `class.schema.ts` (Zod), `schedule.schema.ts` (Zod with cross-field time validation)
- Service: `classes.service.ts` (full CRUD + schedule operations)
- Hooks: `useClasses`, `useClass`, `useCreateClass`, `useUpdateClass`, `useDeleteClass`, `useClassStudents`
- Components: `ClassCard`, `ClassForm` (RHF + Zod + FormProvider), `ScheduleManager` (useFieldArray), `StudentList`
- Routes: `/classes` (list), `/classes/new` (create), `/classes/$classId` (layout with tabs + Outlet), `/classes/$classId/schedules`, `/classes/$classId/students`, `/classes/$classId/invitations`
- Teacher-only guard: student `profile_type` redirects away in the list page.

## Invitations & Enrollment (v0.4)

**Database tables:** `invitations`, `enrollments`, `notifications`

**Backend endpoints:**

| Method   | Path                                   | Auth required | Description                                                                |
| -------- | -------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| `POST`   | `/api/v1/classes/:classId/invitations` | Yes (teacher) | Generate invite link; returns `invite_url` = `${VITE_APP_URL}/join/:token` |
| `GET`    | `/api/v1/classes/:classId/invitations` | Yes (teacher) | List active non-expired invitations                                        |
| `DELETE` | `/api/v1/invitations/:id`              | Yes (teacher) | Revoke invitation (`is_active = false`)                                    |
| `GET`    | `/api/v1/invitations/:token/class`     | No            | Public: get class name + teacher from token (for join page)                |
| `POST`   | `/api/v1/join/:token`                  | Yes (student) | Join class via token; requires `{ consent: true }`                         |
| `GET`    | `/api/v1/enrollments`                  | Yes           | Student's own active enrollments with class + schedules                    |
| `DELETE` | `/api/v1/enrollments/:id`              | Yes (student) | Leave class (hard-delete enrollment row)                                   |

**Key design decisions:**

- `invite_url` = `${VITE_APP_URL}/join/${token}` — only UUID token in URL, no PII.
- Joining without `consent: true` → `422`. Expired/revoked/exhausted token → `410`. Duplicate enrollment → `409`. Teacher trying to join → `403`.
- Leave = hard delete of enrollment row (feedback + belt_progress cascade added in future tickets).
- `StudentEnrolled` event emitted on join → `CreateNotification` listener writes to `notifications` table for the teacher.
- Audit log actions: `invitation_created`, `invitation_revoked`, `student_enrolled`, `student_left`.
- `CleanupExpiredInvitationsJob` defined in `app/jobs/` but not yet scheduled (v0.8).
- Ownership checks inline in controllers (consistent with v0.3, no `@adonisjs/bouncer` dependency).
- Events registered in `start/events.ts` (preloaded in `adonisrc.ts`).

**Frontend** — domains in `src/domains/enrollments/` and `src/domains/invitations/`:

- Enrollments: `enrollment.types.ts`, `join.schema.ts`, `enrollments.service.ts`, `useJoinClass`, `useEnrollments`, `useLeaveClass`, `ConsentDialog`
- Invitations: `invitation.types.ts`, `invitations.service.ts`, `useInvitations`, `useCreateInvitation`, `useRevokeInvitation`, `InvitationManager`, `InviteLinkCard`
- Routes: `/join/$token` (public), `/enrollments` (student), `/classes/$classId/invitations` (teacher tab)
- `/join/$token` handles: unauthenticated → show register/login links; teacher → error; invalid/expired token → error; student → `ConsentDialog`.

## Announcements & Feedback (v0.5)

**Database tables:** `announcements`, `feedback` (plus `notifications` altered with `title`, `body`, `expires_at` columns)

**Backend endpoints:**

| Method   | Path                                         | Auth required | Description                                                    |
| -------- | -------------------------------------------- | ------------- | -------------------------------------------------------------- |
| `POST`   | `/api/v1/classes/:classId/announcements`     | Yes (teacher) | Create announcement (owner only). Emits `AnnouncementCreated`. |
| `GET`    | `/api/v1/classes/:classId/announcements`     | Yes           | List announcements (owner teacher or enrolled student).        |
| `GET`    | `/api/v1/announcements`                      | Yes (student) | All announcements across student's enrolled classes.           |
| `DELETE` | `/api/v1/classes/:classId/announcements/:id` | Yes (teacher) | Delete announcement (owner only).                              |
| `POST`   | `/api/v1/enrollments/:enrollmentId/feedback` | Yes (teacher) | Send feedback to enrolled student. Emits `FeedbackSent`.       |
| `GET`    | `/api/v1/enrollments/:enrollmentId/feedback` | Yes           | List feedback (class teacher or enrolled student).             |
| `GET`    | `/api/v1/feedback`                           | Yes (student) | All feedback across student's enrollments.                     |

**Key design decisions:**

- Bouncer-style policies in `app/policies/` (`AnnouncementPolicy`, `FeedbackPolicy`) encapsulate authorization logic — called from controllers.
- Feedback `content` is encrypted at rest via AdonisJS `encryption.encrypt()`/`decrypt()` in model `prepare`/`consume` hooks.
- `AnnouncementCreated` event → `CreateNotification` listener creates a notification for every active student in the class.
- `FeedbackSent` event → `CreateNotification` listener creates a notification for the recipient student (`type: 'feedback_received'`).
- `GET /api/v1/announcements` and `GET /api/v1/feedback` return `403` for teachers (student-only aggregate views).
- Announcement list returns `{ author: { first_name } }` — never exposes raw `author_id`.
- Audit log actions: `announcement_created`, `announcement_deleted`, `feedback_sent`, `feedback_viewed`.
- Events registered in `start/events.ts`; listener handles all three event types (`handle`, `handleAnnouncementCreated`, `handleFeedbackSent`).

**Frontend** — domains in `src/domains/announcements/` and `src/domains/feedback/`:

- Announcements: `announcement.types.ts`, `announcement.schema.ts`, `announcements.service.ts`, `useAnnouncements`, `useMyAnnouncements`, `useCreateAnnouncement`, `useDeleteAnnouncement`, `AnnouncementCard`, `AnnouncementForm`, `AnnouncementFeed`
- Feedback: `feedback.types.ts`, `feedback.schema.ts`, `feedback.service.ts`, `useFeedback`, `useMyFeedback`, `useSendFeedback`, `FeedbackCard`, `FeedbackForm`, `FeedbackHistory`
- Routes: `/classes/$classId/announcements` (teacher + enrolled student), `/feedback` (student aggregate view)
- Class detail layout has "Announcements" tab. Students page shows expandable feedback panel per student (teacher view).
- `StudentList` updated to include `enrollment_id` and inline feedback form/history per student row.

## Belt Progression & Notifications (v0.6)

**Database tables:** `belt_progress`

**Backend endpoints:**

| Method | Path                                      | Auth required | Description                                                              |
| ------ | ----------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `POST` | `/api/v1/enrollments/:enrollmentId/belts` | Yes (teacher) | Award belt. Requires `has_belt_system = true`. Emits `BeltAwarded`       |
| `GET`  | `/api/v1/enrollments/:enrollmentId/belts` | Yes           | Belt history (teacher or enrolled student), asc by `awarded_at`          |
| `GET`  | `/api/v1/notifications`                   | Yes           | User's non-expired notifications with `{ data, meta: { unread_count } }` |
| `PUT`  | `/api/v1/notifications/:id/read`          | Yes           | Mark single notification as read (owner only)                            |
| `PUT`  | `/api/v1/notifications/read-all`          | Yes           | Mark all user's unread notifications as read                             |

**Key design decisions:**

- `BeltPolicy` in `app/policies/belt_policy.ts`: `award()` checks teacher owns class AND `has_belt_system = true`; `view()` checks teacher or enrolled student.
- `NotificationPolicy` in `app/policies/notification_policy.ts`: ownership checks for view and markRead.
- `NotificationService` in `app/services/notification_service.ts`: shared service sets `expires_at = now() + 90 days` by default.
- `BeltAwarded` event → `CreateNotification` listener (`handleBeltAwarded`) creates notification for student with type `belt_awarded`.
- All event listeners now use `NotificationService.createNotification()` for consistent notification creation with expiry.
- Expired notifications (`expires_at < now()`) excluded from `GET /notifications`.
- Belt names are predefined: White, Yellow, Orange, Green, Blue, Purple, Brown, Black.
- Audit log action: `belt_awarded`.

**Frontend** — domains in `src/domains/belts/` and `src/domains/notifications/`:

- Belts: `belt.types.ts`, `belt.schema.ts`, `belts.service.ts`, `useBelts`, `useAwardBelt`, `BeltTimeline`, `AwardBeltForm`, `BeltBadge`
- Notifications: `notification.types.ts`, `notifications.service.ts`, `useNotifications` (60s refetch), `useMarkRead`, `useMarkAllRead`, `NotificationBell`, `NotificationPanel`, `NotificationItem`
- Routes: `/notifications` (full page view)
- `NotificationBell` added to authenticated layout header (`_authenticated.tsx`).
- `StudentList` updated with belt panel toggle (only when `has_belt_system = true`). Shows `AwardBeltForm` and `BeltTimeline` inline per student.

## AI Features & Privacy Center (v0.7)

**New dependencies:** `@anthropic-ai/sdk` (backend)

**New services:** `UserAnonymizer` (`app/services/user_anonymizer.ts`) — encapsulates all deletion/anonymization logic, used by both `DELETE /auth/me` and `DELETE /privacy/my-data`.

**New migration:** `audit_logs.user_id` made nullable to support anonymization (user_id set to null on account erasure).

**Backend endpoints:**

| Method   | Path                          | Auth required | Description                                                                    |
| -------- | ----------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `POST`   | `/api/v1/ai/improvement-tips` | Yes (student) | AI tips from Claude API based on feedback or martial art. Rate limited 10/min. |
| `GET`    | `/api/v1/privacy/my-data`     | Yes           | Export all personal data as JSON (decrypted).                                  |
| `DELETE` | `/api/v1/privacy/my-data`     | Yes           | Full account erasure via `UserAnonymizer`.                                     |
| `GET`    | `/api/v1/privacy/policy`      | No            | Privacy policy text (public).                                                  |

**Key design decisions:**

- AI prompt never contains student PII (name, email, birth_date). Only anonymized context: martial art, belt level, months enrolled, teacher feedback content, focus area.
- `focus_area` is enum-validated server-side. No free-text input from students (prompt injection prevention).
- AI rate limit: 10 requests/min per student (keyed by user ID) via `aiRateLimit` in `start/limiter.ts`.
- `UserAnonymizer.anonymize()`: sets `deleted_at`, anonymizes PII, hard-deletes enrollments + cascading feedback/belt_progress, nullifies audit log `user_id`.
- Privacy data export returns decrypted fields (user is requesting their own data).
- Audit log actions: `ai_tips_requested`, `data_export_requested`, `account_erasure_requested`.
- Environment variable: `ANTHROPIC_API_KEY` (optional, returns 503 if not set).

**Frontend** — domains in `src/domains/ai/` and `src/domains/privacy/`:

- AI: `ai.types.ts` (FOCUS_AREAS, ImprovementTipsRequest/Response), `ai.service.ts`, `useImprovementTips`, `ImprovementTipsDialog`, `GlobalAITipsDialog`
- Privacy: `privacy.service.ts` (exportMyData, eraseMyData, getPrivacyPolicy), `useExportData`, `useDeleteAccount`, `DataExportButton`, `DeleteAccountDialog`, `PrivacyPolicyViewer`
- Routes: `/privacy` (Privacy Center page with data export, account deletion, privacy policy)
- Global AI Tips button in authenticated layout (students only, floating button).
- Privacy link added to nav for both teachers and students.

## Scheduled Jobs, Security Headers & UX Polish (v0.8)

### Backend

**Security Headers Middleware** (`app/middleware/security_headers_middleware.ts`):

- Applied globally via `start/kernel.ts` (server-wide middleware).
- Sets: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- `Strict-Transport-Security` only in production.
- Generates `X-Request-ID` header (UUID) per request for traceability.

**Pagination:**

- List endpoints (`GET /classes`, `GET /notifications`, `GET /feedback`, `GET /announcements`) now return `{ data: [...], meta: { total, page, per_page } }`.
- Query params: `?page=1&per_page=20` (defaults).
- Frontend services extract `.data` from paginated responses to maintain backward compatibility with hooks.

**Scheduled Jobs** (in `app/jobs/`):

- `CleanupExpiredInvitationsJob` — deletes invitation rows where `expires_at < now()`.
- `PurgeExpiredNotificationsJob` — deletes notification rows where `expires_at < now()`.
- `PurgeExpiredTokensJob` — deletes expired auth tokens from `auth_access_tokens`.
- `PaymentReminderJob` — stub that logs reminder for each active enrollment. Ready for `@adonisjs/mail` integration.
- Import path: `#jobs/cleanup_expired_invitations_job` etc.

### Frontend

**PWA Support:**

- `public/manifest.json` — web app manifest with standalone display mode.
- `public/sw.js` — service worker with network-first navigation, cache-first assets, push notification support.
- PWA meta tags in `index.html`.

**Design System Components** (in `src/shared/components/ui/`):

- `Spinner` — SVG spinner with `sm`/`md`/`lg` sizes.
- `Button` — enhanced with `isLoading` prop (shows spinner, disables click).
- `EmptyState` — icon + message + optional description + CTA button.
- `Toast` / `ToastProvider` — global toast system with auto-dismiss (5s). Variants: `success`, `error`, `info`, `warning`. Both context hook (`useToast`) and imperative (`showToast`) API.
- `Modal` — accessible modal with focus trap, ESC to close, backdrop click to close.
- `ErrorBoundary` — class component wrapping routes, shows "Something went wrong" with retry button.

**Layout & Navigation:**

- Mobile bottom tab bar (`<nav>` fixed at bottom, visible below 768px) for PWA experience.
- AI Tips button repositioned above bottom nav on mobile.
- Content area has `pb-16` on mobile to avoid overlap with bottom nav.

**UX Enhancements:**

- Browser notification permission requested on first dashboard visit.
- API errors automatically show toast notifications (integrated in `api-client.ts`).
- Network errors show "Connection error" toast.
- Loading states use `Spinner` instead of text.
- Empty states use `EmptyState` component with icons and CTAs.
- Teacher dashboard: total students, classes, today's day, unread notifications, recent activity feed.
- Student dashboard: enrolled classes, announcements count, unread notifications, recent announcements feed.

## Deployment & Production (v1.0)

### Render.com Monorepo Deployment

**Platform:** Render.com with [monorepo support](https://render.com/docs/monorepo-support). Both services defined in `render.yaml` at the repo root.

**Services:**

| Service          | Type        | Root Dir   | Build Command                         | Start Command       |
| ---------------- | ----------- | ---------- | ------------------------------------- | ------------------- |
| `fight-club-api` | Web Service | `backend`  | `npm ci && node ace.js migration:run` | `node ace.js serve` |
| `fight-club-app` | Static Site | `frontend` | `npm ci && npm run build`             | — (serves `dist/`)  |

- Build filters ensure each service only redeploys when its own directory changes.
- Frontend SPA fallback via rewrite rule (`/* → /index.html`).

### Database Connection

`DATABASE_URL` env var (Supabase PostgreSQL connection string) takes precedence over individual `DB_*` vars. Configured in:

- `start/env.ts` — both `DATABASE_URL` and `DB_*` vars are optional (one set must be provided).
- `config/database.ts` — if `DATABASE_URL` is set, uses `connectionString` with `ssl: { rejectUnauthorized: false }` for Supabase; otherwise falls back to individual `DB_*` vars.

### CI/CD

- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — backend tests (PostgreSQL + Valkey service containers), frontend tests + build check on push to `main` and PRs.
- **CD:** Render auto-deploys on push to `main` (no deploy workflow needed).

### Demo Seeder

`backend/database/seeders/main_seeder.ts` — idempotent seeder creating demo data:

- Teacher: `teacher@demo.com` / `Demo1234!`
- Student: `student@demo.com` / `Demo1234!`
- Plus random teachers, students, classes, schedules, enrollments, announcements, feedback, belts, and notifications.

Run on production: `node ace.js db:seed` (via Render Shell).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
