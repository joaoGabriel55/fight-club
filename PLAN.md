# Fight Club — Development Plan

> Martial arts class management made simple. Privacy-first.

---

## 1. Product Vision

Fight Club is a web app that makes it easy for martial arts teachers to manage their classes and students — and for students to stay connected with their progress. Think of it as a lightweight, purpose-built tool for dojos, academies, and fight gyms that don't need (or want) a bloated all-in-one platform.

**Core value proposition:** One link to join. One place to manage everything.

### Privacy Commitment

Fight Club follows **privacy-by-design** principles. Martial arts students — including minors — trust their teachers with sensitive personal data (weight, health, contact info). The app treats that trust seriously:

- **Data minimization:** Collect only what's necessary. No tracking, no analytics cookies, no third-party data sharing.
- **Purpose limitation:** Every field has a clear purpose. No "nice-to-have" data collection.
- **Consent-driven:** Students opt in to data sharing. Teachers only see what's needed for their role.
- **Right to erasure:** Students can leave a class and request full data deletion at any time.
- **Encryption at rest and in transit:** All sensitive fields encrypted in the database. All traffic over HTTPS.
- **Data isolation:** Teachers only see their own students. Students only see their own data. No cross-class data leakage.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    BROWSER (Client — SPA)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          TanStack Router (SPA mode — no SSR)            │  │
│  │                                                         │  │
│  │  TanStack Router ─── TanStack Query ─── React Hook Form │  │
│  │  Zod Schemas ─── Tailwind CSS                           │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │ REST API (JSON over HTTPS)         │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────┼────────────────────────────────────┐
│              AdonisJS 6 (API Server)                          │
│                                                              │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              MIDDLEWARE CHAIN                             │ │
│  │  RateLimit │ Auth │ Bouncer │ AuditLog │ InputSanitize   │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              CONTROLLERS (HTTP Layer)                     │ │
│  │  AuthController │ ClassController │ StudentController     │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              SERVICES (Business Logic)                    │ │
│  │  AuthService │ ClassService │ FeedbackService │ etc.      │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              MODELS (Lucid ORM)                           │ │
│  │  User │ Class │ Enrollment │ Feedback │ Announcement      │ │
│  │  BeltLevel │ Invitation │ Notification │ AuditLog         │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                         │                                     │
│  ┌──────────────────────▼──────────────────────────────────┐ │
│  │              AdonisJS Features                            │ │
│  │  Auth (Access Tokens) │ VineJS Validation │ Mailer        │ │
│  │  Events + Listeners │ Scheduler │ Middleware │ Bouncer     │ │
│  │  Encryption │ Hash │ Limiter                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────┬───────────┬───────────────────────────┘
                       │           │
                  ┌────▼────┐ ┌───▼────┐
                  │PostgreSQL│ │ Redis  │
                  │(encrypted│ │ (cache │
                  │ at rest) │ │ /queue)│
                  └─────────┘ └────────┘
```

### Why this architecture?

- **AdonisJS 6** is the TypeScript equivalent of Laravel — batteries-included with ORM, auth, mail, validation, events, encryption, and testing built in. It avoids the "glue 20 packages together" problem of Express.
- **TanStack Router (SPA mode)** provides type-safe file-based routing, first-class TanStack Query integration, and a mature developer experience — without the complexity and instability risks of TanStack Start's SSR/server functions. The backend is AdonisJS; there's no need for a second server runtime on the frontend.
- **SPA + API separation** means the frontend builds to static files (HTML + JS + CSS). Serve from any CDN or static file server. No Node.js process in production. Simpler deployment, fewer moving parts, less attack surface.
- **Privacy-by-design** is enforced at every layer: encrypted sensitive columns, Bouncer authorization policies, audit logging, data minimization in API responses, and right-to-erasure endpoints.

---

## 3. Privacy Architecture

### 3.1 Data Classification

Every field in the system is classified into one of three tiers:

| Tier | Classification | Examples | Handling |
|------|---------------|----------|----------|
| **P0 — Public** | Safe to display to class members | First name, belt level, class name | No special handling |
| **P1 — Internal** | Visible only to the user + their teacher | Weight, height, birth date, feedback | Encrypted at rest, access-controlled |
| **P2 — Secret** | Visible only to the user themselves | Email, password hash, full name | Encrypted at rest, never exposed in list endpoints |

### 3.2 Privacy Controls in the Backend

| Principle | Implementation |
|-----------|---------------|
| **Data minimization** | API responses use serializers that strip fields by context. A teacher listing students sees `first_name` + `belt_level`, not `email` + `birth_date`. |
| **Purpose limitation** | `weight` and `height` are only collected if the student chooses to fill them. They're nullable, not required. |
| **Consent tracking** | `student_profiles.data_consent_at` timestamp. Students must accept a data policy on first enrollment. Revocable. |
| **Encryption at rest** | Sensitive columns (`birth_date`, `weight_kg`, `height_cm`, `email`) encrypted using AdonisJS `@adonisjs/encryption`. Decrypted only at read time in authorized contexts. |
| **Token opacity** | Auth uses opaque access tokens (not JWTs). No user data in the token payload. Tokens are stored hashed in the DB. |
| **Invitation privacy** | Invitation links contain a random UUID token — they don't leak the class name, teacher name, or any PII in the URL. |
| **Audit trail** | Every data access and modification to P1/P2 fields is logged in an `audit_logs` table (who, what, when, IP). |
| **Right to erasure** | `DELETE /api/v1/auth/me` triggers a cascade: anonymize user record, delete profiles, remove from enrollments, delete feedback received, purge notifications. Audit logs are retained with anonymized user reference. |
| **Session hygiene** | Tokens expire after a configurable TTL. Logout revokes the token server-side. No refresh tokens stored in localStorage — token is stored in memory with a secure httpOnly cookie fallback. |
| **Rate limiting** | Auth endpoints rate-limited to prevent brute force. Per-IP and per-user limits. |
| **Input sanitization** | All text inputs sanitized (strip HTML/scripts) before storage. VineJS handles validation; a custom middleware handles sanitization. |
| **CORS strict mode** | Only the known frontend origin is allowed. No wildcard. |
| **No analytics/tracking** | No Google Analytics, no Mixpanel, no third-party scripts. No cookies except the auth session. |

### 3.3 Data Retention Policy

| Data | Retention | On Deletion |
|------|-----------|-------------|
| User account | Until user deletes | Anonymized (name → "Deleted User", email → hashed) |
| Enrollment records | Until student leaves or account deleted | Hard delete |
| Feedback | Until enrollment ends or account deleted | Hard delete |
| Belt progress | Until enrollment ends or account deleted | Hard delete |
| Notifications | 90 days | Auto-purge via scheduled job |
| Audit logs | 1 year | Retained with anonymized user_id |
| Invitation tokens | Until expiry (configurable, default 7 days) | Auto-purge expired tokens daily |

---

## 4. Data Model

### Entity-Relationship Diagram

```
┌──────────────────┐     ┌──────────────┐     ┌───────────────┐
│      User        │     │    Class     │     │  Enrollment   │
├──────────────────┤     ├──────────────┤     ├───────────────┤
│ id (PK, UUID)    │──┐  │ id (PK, UUID)│──┐  │ id (PK, UUID) │
│ first_name       │  │  │ teacher_id   │◄─┘  │ class_id (FK) │
│ last_name  [ENC] │  │  │ name         │  ┌─▶│ student_id(FK)│
│ email      [ENC] │  │  │ martial_art  │  │  │ status        │
│ password_hash    │  │  │ has_belt     │  │  │ joined_at     │
│ birth_date [ENC] │  │  │ description  │  │  │ consent_at    │
│ profile_type     │  │  │ created_at   │  │  └───────────────┘
│ avatar_url       │  │  │ updated_at   │  │
│ created_at       │  │  └──────────────┘  │  ┌───────────────┐
│ updated_at       │  │                    │  │ ClassSchedule │
│ deleted_at (soft)│  │  ┌──────────────┐  │  ├───────────────┤
└──────┬───────────┘  │  │  Invitation  │  │  │ id (PK, UUID) │
       │              │  ├──────────────┤  │  │ class_id (FK) │
       │              │  │ id (PK, UUID)│  │  │ day_of_week   │
       │              │  │ class_id(FK) │  │  │ start_time    │
       │              │  │ token (UQ)   │  │  │ end_time      │
       │              │  │ expires_at   │  │  └───────────────┘
       │              │  │ is_active    │  │
       │              │  │ max_uses     │  │  ┌───────────────┐
       │              │  │ use_count    │  │  │ Announcement  │
       │              │  └──────────────┘  │  ├───────────────┤
       │              │                    │  │ id (PK, UUID) │
       │              │  ┌──────────────┐  │  │ class_id (FK) │
       │              └─▶│StudentProfile│  │  │ author_id(FK) │
       │                 ├──────────────┤  │  │ title         │
       │                 │ user_id (FK) │  │  │ content       │
       │                 │ weight [ENC] │  │  │ created_at    │
       │                 │ height [ENC] │  │  └───────────────┘
       │                 │ consent_at   │  │
       │                 └──────────────┘  │  ┌───────────────┐
       │                                   │  │   Feedback    │
       │  ┌───────────────┐                │  ├───────────────┤
       │  │TeacherProfile │                │  │ id (PK, UUID) │
       │  ├───────────────┤                │  │ enrollment_id │
       └─▶│ user_id (FK)  │                │  │ teacher_id(FK)│
          │ fight_exp     │                │  │ content [ENC] │
          └───────────────┘                │  │ created_at    │
                                           │  └───────────────┘
       ┌───────────────┐                   │
       │  BeltProgress │                   │  ┌───────────────┐
       ├───────────────┤                   │  │  AuditLog     │
       │ id (PK, UUID) │                   │  ├───────────────┤
       │ enrollment_id │◄──────────────────┘  │ id (PK, UUID) │
       │ belt_name     │                      │ user_id       │
       │ awarded_at    │                      │ action        │
       │ awarded_by(FK)│                      │ resource_type │
       └───────────────┘                      │ resource_id   │
                                              │ ip_address    │
       ┌───────────────┐                      │ metadata(JSON)│
       │ Notification  │                      │ created_at    │
       ├───────────────┤                      └───────────────┘
       │ id (PK, UUID) │
       │ user_id (FK)  │
       │ type          │
       │ title         │
       │ body          │
       │ read_at       │
       │ data (JSON)   │
       │ created_at    │
       │ expires_at    │
       └───────────────┘
```

**[ENC]** = encrypted at rest using AdonisJS encryption.

### Key Design Decisions

1. **UUIDs instead of sequential IDs:** All primary keys are UUIDs. This prevents enumeration attacks (e.g., guessing `/students/1`, `/students/2`). No information leakage through URL patterns.
2. **`profile_type` on User, not separate tables for auth:** A single `users` table handles authentication. Extended attributes live in `student_profiles` and `teacher_profiles` (one-to-one).
3. **`has_belt_system` on Class:** Not all martial arts have belts. Boxing, MMA, Muay Thai don't. BJJ, Karate, Taekwondo do. This flag toggles belt-related features per class.
4. **`Enrollment` as a pivot:** This is the central relationship — a student belongs to a class through an enrollment. Belt progress, feedback, and notifications are all tied to enrollments. The `consent_at` field tracks when the student accepted the data policy for that specific class.
5. **`ClassSchedule` is separate from `Class`:** A class can meet on multiple days (e.g., Mon/Wed/Fri 7pm). Each schedule entry is a row.
6. **`Invitation` with expiring tokens and usage limits:** Teachers generate shareable links with UUID tokens. Tokens have both an expiration date and a max usage count to prevent uncontrolled sharing.
7. **Soft deletes on Users:** `deleted_at` enables account deactivation while preserving referential integrity. The anonymization process clears PII but keeps the row so foreign keys don't break.
8. **`AuditLog` table:** Every sensitive operation (login, data access, profile update, belt award, feedback sent) is logged. This supports accountability and incident investigation.
9. **Nullable optional fields:** `weight_kg`, `height_cm`, `fight_experiences` are all nullable. Students are never forced to share body data.
10. **Notification expiration:** Notifications have an `expires_at` field. A scheduled job purges expired notifications, preventing indefinite data accumulation.

---

## 5. AdonisJS Backend — Feature Mapping

This section maps every feature to the specific AdonisJS modules that will be used.

### 5.1 Authentication & Authorization

| Feature | AdonisJS Module | Details |
|---|---|---|
| User registration/login | `@adonisjs/auth` | API token-based auth (opaque access tokens, no JWT — no PII in tokens) |
| Password hashing | `@adonisjs/hash` | Argon2 via built-in hash driver |
| Role-based access | `@adonisjs/bouncer` | Policies: `ClassPolicy`, `FeedbackPolicy`, `EnrollmentPolicy` |
| Middleware guards | Auth middleware | `auth.use('api')` on protected routes |
| Field encryption | `@adonisjs/encryption` | Encrypt/decrypt P1 and P2 fields |

### 5.2 Data Layer

| Feature | AdonisJS Module | Details |
|---|---|---|
| ORM | `@adonisjs/lucid` | Models, migrations, seeders, factories |
| Validation | `VineJS` | Request validation on every controller action |
| Database | PostgreSQL driver | Via `pg` driver in Lucid config |
| Serialization | Custom serializers | Strip sensitive fields based on requester's role and relationship |

### 5.3 Communication & Events

| Feature | AdonisJS Module | Details |
|---|---|---|
| Payment reminders | `@adonisjs/mail` | Scheduled email via Resend or SMTP driver |
| Event system | `@adonisjs/events` | `StudentEnrolled`, `FeedbackSent`, `BeltAwarded`, `AnnouncementCreated` |
| Listeners | Event listeners | `SendWelcomeEmail`, `CreateNotification`, `SendPaymentReminder`, `WriteAuditLog` |
| Scheduling | `@adonisjs/scheduler` or cron | Payment reminders, expired token cleanup, notification purge |

### 5.4 API Structure

| Feature | AdonisJS Module | Details |
|---|---|---|
| REST routes | Router | Resource routes: `router.resource('classes', ClassesController)` |
| API versioning | Route groups | `/api/v1/` prefix |
| Rate limiting | `@adonisjs/limiter` | Auth: 5 attempts/min per IP. API: 100 req/min per user. |
| Error handling | Exception handler | Consistent JSON errors. Never leak stack traces, DB details, or internal paths. |
| CORS | `@adonisjs/cors` | Strict: only the known frontend origin. No wildcards. |
| Input sanitization | Custom middleware | Strip HTML/scripts from all text inputs before they reach the controller. |

### 5.5 Privacy & Security

| Feature | AdonisJS Module | Details |
|---|---|---|
| Audit logging | Custom service + model | `AuditLogService.log(user, action, resource)` called in event listeners |
| Data anonymization | Custom service | `UserAnonymizer.anonymize(user)` on account deletion |
| Token cleanup | Scheduler | Daily job: purge expired invitations, revoked tokens, old notifications |
| Helmet headers | `@adonisjs/static` + custom | `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` |

### 5.6 Testing

| Feature | AdonisJS Module | Details |
|---|---|---|
| Unit/integration tests | `@japa/runner` | Adonis's built-in test runner |
| API tests | `@japa/api-client` | HTTP assertions for every endpoint |
| Database testing | Test utils | Transactions + `RefreshDatabase` trait |
| Factories | Lucid factories | `UserFactory`, `ClassFactory`, etc. |
| Privacy tests | Custom test suite | Verify: field encryption, data isolation between teachers, anonymization on delete |

---

## 6. API Endpoints

### Auth
```
POST   /api/v1/auth/register          → Register new user
POST   /api/v1/auth/login             → Login (returns opaque access token)
DELETE /api/v1/auth/logout             → Revoke token server-side
GET    /api/v1/auth/me                 → Current user profile (own data only)
PUT    /api/v1/auth/me                 → Update profile
DELETE /api/v1/auth/me                 → Delete account + anonymize all data
```

### Classes (Teacher)
```
POST   /api/v1/classes                 → Create class
GET    /api/v1/classes                 → List teacher's own classes only
GET    /api/v1/classes/:id             → Class details (teacher must own it)
PUT    /api/v1/classes/:id             → Update class
DELETE /api/v1/classes/:id             → Delete class (soft delete, preserve audit)
GET    /api/v1/classes/:id/students    → List enrolled students (minimal: name + belt)
DELETE /api/v1/classes/:id/students/:studentId → Remove student from class
```

### Schedules
```
POST   /api/v1/classes/:classId/schedules      → Add schedule
PUT    /api/v1/classes/:classId/schedules/:id   → Update schedule
DELETE /api/v1/classes/:classId/schedules/:id   → Remove schedule
```

### Invitations (Teacher)
```
POST   /api/v1/classes/:classId/invitations     → Generate invite link (with expiry + max uses)
GET    /api/v1/classes/:classId/invitations      → List active invitations
DELETE /api/v1/invitations/:id                   → Revoke invitation
```

### Enrollment (Student)
```
POST   /api/v1/join/:token             → Join class via invitation link (requires consent)
GET    /api/v1/enrollments             → My enrollments (student sees own only)
DELETE /api/v1/enrollments/:id         → Leave class + delete enrollment data
```

### Announcements
```
POST   /api/v1/classes/:classId/announcements       → Create announcement
GET    /api/v1/classes/:classId/announcements        → List announcements (enrolled members only)
GET    /api/v1/announcements                         → All my announcements (student, across own classes)
DELETE /api/v1/classes/:classId/announcements/:id    → Delete announcement
```

### Feedback (Teacher → Student)
```
POST   /api/v1/enrollments/:enrollmentId/feedback    → Send feedback (teacher must own the class)
GET    /api/v1/enrollments/:enrollmentId/feedback     → Feedback history (teacher or the student themselves)
GET    /api/v1/feedback                               → My feedback (student sees own only)
```

### Belt Progress
```
POST   /api/v1/enrollments/:enrollmentId/belts       → Award belt (teacher must own class, class must have belt system)
GET    /api/v1/enrollments/:enrollmentId/belts        → Belt history (teacher or the student themselves)
```

### Notifications
```
GET    /api/v1/notifications                  → List my notifications (own only)
PUT    /api/v1/notifications/:id/read         → Mark as read (own only)
PUT    /api/v1/notifications/read-all         → Mark all as read (own only)
```

### Privacy
```
GET    /api/v1/privacy/my-data                → Export all personal data (GDPR-style data portability)
DELETE /api/v1/privacy/my-data                → Full data erasure request
GET    /api/v1/privacy/policy                 → Return current privacy policy text
```

---

## 7. Frontend Architecture — DDD Approach (SPA)

### 7.1 Why SPA Instead of SSR

TanStack Start supports SSR via server functions and Nitro, but for Fight Club, SPA mode is the right choice:

- **No SEO requirement.** This is a private, auth-gated app. Search engines don't need to crawl dashboards.
- **Simpler deployment.** The frontend builds to static files (HTML + JS + CSS). Serve from any CDN or static server. No Node.js process in production.
- **Reduced attack surface.** No server-side rendering means no server functions exposed, no server-side state to protect, fewer vectors for SSRF or data leakage.
- **Stability.** TanStack Router in SPA mode is battle-tested and stable. The SSR layer (TanStack Start) is still RC. Avoiding it removes the biggest risk in the stack.
- **No duplicate backend.** AdonisJS already handles all server logic. Adding server functions in TanStack Start would split business logic across two runtimes — a maintenance burden for a solo developer.

### 7.2 Folder Structure

```
frontend/
├── src/
│   ├── routes/                          # TanStack Router file-based routes
│   │   ├── __root.tsx                   # Root layout
│   │   ├── index.tsx                    # Landing page
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── join.$token.tsx              # Join class via invite
│   │   ├── _authenticated.tsx           # Auth layout (redirect if not logged in)
│   │   ├── _authenticated/
│   │   │   ├── dashboard.tsx
│   │   │   ├── classes/
│   │   │   │   ├── index.tsx            # List classes
│   │   │   │   ├── new.tsx              # Create class (teacher)
│   │   │   │   ├── $classId.tsx         # Class detail layout
│   │   │   │   ├── $classId/
│   │   │   │   │   ├── students.tsx     # Students list (teacher)
│   │   │   │   │   ├── announcements.tsx
│   │   │   │   │   ├── schedules.tsx
│   │   │   │   │   └── invitations.tsx
│   │   │   ├── feedback/
│   │   │   │   └── index.tsx            # My feedback (student)
│   │   │   ├── profile/
│   │   │   │   └── index.tsx
│   │   │   ├── notifications/
│   │   │   │   └── index.tsx
│   │   │   └── privacy/
│   │   │       └── index.tsx            # Data export, deletion request
│   │
│   ├── domains/                         # DDD: Domain modules
│   │   ├── auth/
│   │   │   ├── schemas/                 # Zod schemas
│   │   │   │   ├── login.schema.ts
│   │   │   │   └── register.schema.ts
│   │   │   ├── hooks/                   # Domain-specific hooks
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useRegister.ts
│   │   │   ├── services/                # API calls (TanStack Query)
│   │   │   │   └── auth.service.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── components/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── RegisterForm.tsx
│   │   │       └── ConsentCheckbox.tsx
│   │   │
│   │   ├── classes/
│   │   │   ├── schemas/
│   │   │   │   ├── class.schema.ts
│   │   │   │   └── schedule.schema.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useClasses.ts
│   │   │   │   ├── useCreateClass.ts
│   │   │   │   └── useClassStudents.ts
│   │   │   ├── services/
│   │   │   │   └── classes.service.ts
│   │   │   ├── types/
│   │   │   │   └── class.types.ts
│   │   │   └── components/
│   │   │       ├── ClassCard.tsx
│   │   │       ├── ClassForm.tsx
│   │   │       ├── ScheduleManager.tsx
│   │   │       └── StudentList.tsx
│   │   │
│   │   ├── enrollments/
│   │   │   ├── schemas/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── components/
│   │   │       └── ConsentDialog.tsx     # Data consent before joining
│   │   │
│   │   ├── feedback/
│   │   │   ├── schemas/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── components/
│   │   │
│   │   ├── announcements/
│   │   │   ├── schemas/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── components/
│   │   │
│   │   ├── belts/
│   │   │   ├── schemas/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── components/
│   │   │       └── BeltTimeline.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── components/
│   │   │       └── NotificationBell.tsx
│   │   │
│   │   └── privacy/
│   │       ├── hooks/
│   │       │   ├── useExportData.ts
│   │       │   └── useDeleteAccount.ts
│   │       ├── services/
│   │       │   └── privacy.service.ts
│   │       └── components/
│   │           ├── DataExportButton.tsx
│   │           └── DeleteAccountDialog.tsx
│   │
│   ├── shared/                          # Cross-domain shared code
│   │   ├── components/
│   │   │   ├── ui/                      # Design system primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   └── feedback/
│   │   │       ├── Toast.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useMediaQuery.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts            # Fetch wrapper with token injection
│   │   │   ├── query-client.ts          # TanStack Query client config
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── api.types.ts             # Generic API response types
│   │
│   ├── styles/
│   │   └── globals.css                  # Tailwind directives
│   │
│   ├── main.tsx                         # SPA entry point
│   └── routeTree.gen.ts                 # Auto-generated by TanStack Router
│
├── tests/
│   ├── unit/                            # Vitest component tests
│   │   ├── domains/
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.test.tsx
│   │   │   ├── classes/
│   │   │   │   └── ClassCard.test.tsx
│   │   │   └── ...
│   │   └── shared/
│   │       └── ui/
│   │           └── Button.test.tsx
│   └── e2e/                             # Playwright tests
│       ├── auth.spec.ts
│       ├── class-management.spec.ts
│       ├── enrollment.spec.ts
│       ├── feedback-flow.spec.ts
│       └── privacy-deletion.spec.ts
│
├── index.html                           # SPA entry HTML
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── Dockerfile
└── package.json
```

### 7.3 DDD Conventions

Each domain module follows this pattern:

- **`schemas/`** — Zod schemas for form validation and API response parsing. Shared between form validation (React Hook Form) and runtime type checking.
- **`services/`** — API call functions. Pure functions that call the backend and return typed data. No React dependencies.
- **`hooks/`** — TanStack Query wrappers (`useQuery`, `useMutation`) that consume services. Handles caching, invalidation, optimistic updates.
- **`types/`** — TypeScript interfaces/types for the domain. Derived from Zod schemas where possible (`z.infer<typeof schema>`).
- **`components/`** — React components scoped to the domain. They use domain hooks and schemas internally.

### 7.4 Form Pattern (Zod + React Hook Form + TanStack Query)

```typescript
// domains/classes/schemas/class.schema.ts
import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().min(3, 'Class name must be at least 3 characters'),
  martial_art: z.string().min(1, 'Select a martial art'),
  has_belt_system: z.boolean().default(false),
  description: z.string().optional(),
  schedules: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
  })).min(1, 'Add at least one schedule'),
})

export type CreateClassInput = z.infer<typeof createClassSchema>
```

```typescript
// domains/classes/hooks/useCreateClass.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { classesService } from '../services/classes.service'
import type { CreateClassInput } from '../schemas/class.schema'

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClassInput) => classesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
```

### 7.5 Auth Token Handling (Privacy-Safe)

```typescript
// shared/lib/api-client.ts
// Token stored in memory — NOT in localStorage (prevents XSS data exfiltration)
let accessToken: string | null = null

export function setToken(token: string) { accessToken = token }
export function clearToken() { accessToken = null }

export async function apiClient(path: string, options: RequestInit = {}) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
  }

  return response
}
```

---

## 8. Key Screens

### Teacher View
1. **Dashboard** — Overview: total students, upcoming classes today, recent feedback sent, unread notifications
2. **My Classes** — Card grid of classes with student count, schedule, and quick actions
3. **Class Detail** — Tabbed view: Students | Announcements | Schedules | Invitations
4. **Student Profile (within class)** — Belt timeline, feedback history, send new feedback. Only shows data the student consented to share.
5. **Create/Edit Class** — Multi-step form: info → schedules → belt config

### Student View
1. **Dashboard** — Upcoming classes, recent announcements, belt progress summary
2. **My Classes** — List of enrolled classes with next session
3. **Class Feed** — Announcements + personal feedback in a timeline
4. **My Progress** — Belt timeline with award dates, teacher comments
5. **Join Class** — Clean page when visiting invite link. Shows consent dialog explaining what data will be shared with the teacher, then enrolls.
6. **Privacy Center** — Export personal data (JSON download), request account deletion, review consents

---

## 9. AI Integration (Bonus Points)

To score the AI bonus, the app should embed AI as a user-facing feature:

### 9.1 AI-Powered Feedback Assistant (Primary)
When a teacher writes feedback for a student, an AI assistant can:
- **Suggest feedback** based on the student's belt level and martial art
- **Improve tone** — make feedback more constructive and encouraging
- **Translate** feedback to the student's preferred language

Implementation: A "Suggest with AI" button on the feedback form that calls Claude API (via the AdonisJS backend as a proxy) with context about the student's level, martial art, and previous feedback.

**Privacy note:** Only anonymized student context (belt level, martial art, time in class) is sent to the AI. No PII (name, email, birth date) is included in the prompt.

### 9.2 Smart Announcement Drafting
Teachers can describe what they want to announce in natural language, and AI generates a polished announcement. Example: teacher types "class canceled friday because of tournament" → AI generates a clear, formatted announcement.

### 9.3 AI in Development Process (for the Demo)
Document how AI was used throughout:
- Architecture decisions through AI conversation
- Code generation with Claude Code
- Test generation
- Schema design validation
- Documentation writing

---

## 10. Docker Setup

### 10.1 Development (`docker-compose.dev.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: fightclub
      POSTGRES_PASSWORD: fightclub_dev
      POSTGRES_DB: fightclub_dev
    ports:
      - "5432:5432"
    volumes:
      - pg_data_dev:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    command: node ace serve --watch

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:3333
    depends_on:
      - backend
    command: npm run dev

volumes:
  pg_data_dev:
```

### 10.2 Production (`docker-compose.prod.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - pg_data_prod:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3333:3333"
    env_file: .env
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: always

volumes:
  pg_data_prod:
```

### 10.3 Backend Dockerfiles

**`backend/Dockerfile.dev`**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3333
CMD ["node", "ace", "serve", "--watch"]
```

**`backend/Dockerfile`** (production)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node ace build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/build ./
RUN npm ci --omit=dev
EXPOSE 3333
CMD ["node", "bin/server.js"]
```

### 10.4 Frontend Dockerfiles (SPA — Static Build)

**`frontend/Dockerfile.dev`**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**`frontend/Dockerfile`** (production — Nginx serving static files)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`frontend/nginx.conf`**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback: all routes → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No caching for index.html (so new deploys are picked up)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## 11. Sprint Plan (10 working days)

Given the competition runs from **30/03 to 10/04** (10 working days + weekends), here's the sprint breakdown:

### Sprint 1: Foundation (Days 1–3) — Mar 30 to Apr 1

**Goal:** Backend running with auth, frontend scaffolded, Docker working.

| Day | Backend | Frontend |
|-----|---------|----------|
| Day 1 (Mon) | Project scaffold, Docker setup, DB config, migrations (users with UUID PKs, student_profiles, teacher_profiles, audit_logs). Encryption config. | Vite + TanStack Router SPA scaffold, Tailwind, DDD folder structure, api-client (in-memory token), query-client |
| Day 2 (Tue) | Auth: register, login, logout, me, delete account. Argon2 hashing, opaque tokens, middleware. VineJS validators. Rate limiting on auth routes. | Auth domain: Zod schemas, login/register forms (RHF), auth service, useAuth hook, ConsentCheckbox component |
| Day 3 (Wed) | Classes + Schedules: CRUD, Bouncer policies, migrations. Factories + seeders. Audit logging middleware. | Classes domain: list, create form, class card component. Routing setup with auth guard. |

**Deliverable:** User can register, log in, and create a class with schedules. Auth tokens in memory, UUIDs in URLs.

---

### Sprint 2: Core Features (Days 4–6) — Apr 2 to Apr 4

**Goal:** Full enrollment flow, announcements, feedback.

| Day | Backend | Frontend |
|-----|---------|----------|
| Day 4 (Thu) | Invitations: generate token with expiry + max uses. Enrollment: join via token (requires consent), list, leave + data cleanup. | Join flow: `join.$token.tsx` page with ConsentDialog. Invitation management UI for teachers. |
| Day 5 (Fri) | Announcements CRUD. Feedback CRUD (content encrypted at rest). Events: `AnnouncementCreated`, `FeedbackSent`. Serializers: strip PII from student lists. | Announcements domain: timeline, create form. Feedback domain: send form, history view. |
| Day 6 (Sat) | Belt progress: award, history. Notifications model + creation via event listeners. Notification expiry field. | Belt timeline component. Student progress view. Notification bell + list. |

**Deliverable:** Complete teacher-student interaction loop working end-to-end, with consent gating and data isolation.

---

### Sprint 3: Polish & AI (Days 7–8) — Apr 6 to Apr 7

**Goal:** AI features, payment reminders, privacy center, UX polish.

| Day | Backend | Frontend |
|-----|---------|----------|
| Day 7 (Mon) | AI feedback endpoint (Claude API proxy — anonymized context only). Payment reminder scheduler + mailer. Privacy endpoints: data export, account deletion. | AI feedback assistant UI. Payment reminder config for teachers. Dashboard for both roles. |
| Day 8 (Tue) | AI announcement drafting endpoint. Scheduled jobs: token cleanup, notification purge. Security headers middleware. | AI announcement drafting UI. Privacy center page. Responsive polish. Empty states. Loading states. Error handling. |

**Deliverable:** AI features working. Privacy center functional. App feels polished.

---

### Sprint 4: Testing & Deploy (Days 9–10) — Apr 8 to Apr 9

**Goal:** Tests, deployment, README, final polish.

| Day | Backend | Frontend |
|-----|---------|----------|
| Day 9 (Wed) | Japa tests: auth, classes, enrollment, feedback, belts, data isolation, privacy/deletion. Factory-driven test data. | Vitest: key components (forms, cards, consent). Playwright: auth flow, create class, join class, send feedback, delete account. |
| Day 10 (Thu) | Deploy to Render (or VPS). CI with GitHub Actions. Seed production data for demo. HTTPS enforcement. | Deploy frontend (Nginx static or Render Static Site). README with screenshots, setup instructions, env vars, privacy policy. Final bug fixes. |

**Deliverable:** App deployed, tested, and documented.

---

### Buffer: Apr 10 (Fri) — Submission Deadline

Final touches, README review, make sure deploy is solid, record backup video just in case.

---

## 12. Testing Strategy

### Backend (Japa)

| Category | What to Test | Examples |
|----------|-------------|---------|
| Unit | Services, validators, policies | `ClassService.create()`, VineJS rules, Bouncer policies |
| Integration | Full HTTP request → DB → response | `POST /api/v1/classes` returns 201, `GET /api/v1/feedback` returns only student's own |
| Auth | Token lifecycle, role guards | Expired token → 401, student can't create class → 403 |
| Edge cases | Invalid input, duplicate enrollment, expired invitation | Join with expired token → 410, join same class twice → 409 |
| **Privacy** | Data isolation, encryption, anonymization | Teacher A can't see Teacher B's students. Deleted user has no PII in DB. Data export contains all user data. Student list doesn't leak email/birth_date. |

### Frontend (Vitest + Playwright)

| Category | Tool | What to Test |
|----------|------|-------------|
| Component | Vitest + React Testing Library | Form validation, conditional rendering, empty states, consent checkbox |
| Hook | Vitest | Query/mutation hooks with MSW mocking |
| E2E | Playwright | Full flows: register → create class → invite → join (with consent) → send feedback → check belt → delete account |

### Critical E2E Scenarios
1. **Teacher flow:** Register → Create class → Add schedules → Generate invite → Share link
2. **Student flow:** Open invite link → Accept consent → Register → Join class → View announcements → Check belt
3. **Feedback loop:** Teacher selects student → Writes feedback → Uses AI suggest → Sends → Student sees it
4. **Belt progression:** Teacher awards belt → Student sees updated timeline → Notification appears
5. **Privacy flow:** Student exports data → Downloads JSON → Deletes account → Verify data anonymized

---

## 13. Environment Variables

```env
# Backend (.env)
NODE_ENV=production
PORT=3333
HOST=0.0.0.0
APP_KEY=<generated — used for encryption>
APP_URL=https://api.fightclub.app

# Database
DB_CONNECTION=pg
DB_HOST=postgres
DB_PORT=5432
DB_USER=fightclub
DB_PASSWORD=<secret>
DB_DATABASE=fightclub

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Auth
TOKEN_EXPIRY=7d

# Mail (Resend)
MAIL_DRIVER=resend
RESEND_API_KEY=<secret>
MAIL_FROM=noreply@fightclub.app

# AI (never send PII to this service)
ANTHROPIC_API_KEY=<secret>

# Security
CORS_ORIGIN=https://fightclub.app
RATE_LIMIT_AUTH=5/min
RATE_LIMIT_API=100/min

# Frontend (.env)
VITE_API_URL=https://api.fightclub.app
VITE_APP_NAME=Fight Club
```

---

## 14. Commit Strategy

Follow conventional commits with small, frequent pushes:

```
feat(auth): add user registration with VineJS validation and UUID PKs
feat(auth): implement opaque token login with rate limiting
feat(privacy): add data export and account anonymization endpoints
feat(classes): add class CRUD with Bouncer policies
feat(enrollment): implement consent-gated enrollment via invite token
feat(frontend): scaffold TanStack Router SPA with auth domain
feat(feedback): add AI-powered feedback suggestions (anonymized context)
feat(audit): add audit logging middleware for sensitive operations
test(auth): add Japa tests for registration, login, and deletion
test(privacy): verify data isolation between teachers
test(e2e): add Playwright flow for enrollment with consent
fix(enrollment): handle duplicate enrollment gracefully
docs(readme): add setup instructions, privacy policy, and screenshots
chore(docker): configure Nginx SPA build for production
```

Aim for **4–6 commits per day**, each representing a meaningful, working increment.

---

## 15. Deployment Plan

### Option A: Render (Free Tier — Recommended for Competition)
- **Backend:** Web Service (Docker) — free tier
- **Frontend:** Static Site — free tier (Render serves static files natively, no Nginx needed)
- **Database:** PostgreSQL managed — free tier (90 days)
- **Redis:** Not available on free tier — use in-memory fallback or Redis Cloud free tier
- **HTTPS:** Automatic on Render

### Option B: VPS (Hetzner/DigitalOcean)
- Single VPS with Docker Compose
- Nginx reverse proxy for both services
- Let's Encrypt SSL via Certbot
- ~€4/month

### CI/CD
- GitHub Actions: lint → test → build → deploy on push to `main`
- Branch protection: no direct pushes to `main`

---

## 16. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AdonisJS unfamiliarity | Medium | Follow official docs closely. Use `node ace` generators. |
| AI feature scope creep | Medium | Keep it to one endpoint (feedback suggest). Don't build a chat. |
| Docker networking issues | Low | Test compose locally on Day 1. Keep services simple. |
| Time pressure | High | Cut scope from bottom up: notifications → payment reminders → AI extras. Core flow (auth + classes + enrollment + feedback) is non-negotiable. |
| Privacy compliance complexity | Medium | Focus on the four essentials: encryption, data isolation, consent, and deletion. Audit logging is a bonus. |

### Must-Have vs Nice-to-Have

**Must-Have (non-negotiable for a working demo):**
- Auth (register, login, delete account)
- Class CRUD with schedules
- Invitation link + enrollment with consent
- Announcements
- Feedback
- Belt progress
- Data isolation (teacher sees only own students)
- UUIDs (no sequential IDs)
- Responsive UI

**Nice-to-Have (cut if time is short):**
- Payment date reminders (email)
- AI feedback assistant
- AI announcement drafting
- Notification system
- Email notifications
- Profile avatar upload
- Full audit logging
- Data export (JSON download)
- Field-level encryption (can defer to DB-level encryption)

---

## 17. Demo Script (10 minutes)

**Minutes 1–2: Problem & Solution**
> "Managing a martial arts class today means WhatsApp groups, spreadsheets, and memory. Fight Club replaces all of that with one app — and it takes privacy seriously because students trust their teachers with sensitive data."

**Minutes 3–5: Live Demo — Teacher Flow**
- Create a BJJ class with Mon/Wed/Fri schedule
- Generate an invitation link (show: expiry, max uses)
- Show student list after enrollment (show: minimal data, no email visible)
- Send personalized feedback with AI assistant
- Award a blue belt

**Minutes 5–7: Live Demo — Student Flow**
- Open invite link, see consent dialog, register, auto-enroll
- View class announcements
- Check belt progression timeline
- Read teacher feedback
- Visit privacy center, export data

**Minutes 7–9: AI in Development + Privacy**
- Show Claude Code session: architecture decisions, code generation
- Show a specific prompt that solved a hard problem
- Explain privacy-by-design: UUIDs, encryption, consent, data isolation
- Show test generation with AI

**Minute 10: Wrap Up**
> "One link to join. One place to manage everything. Your data, your control. Fight Club."
