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
