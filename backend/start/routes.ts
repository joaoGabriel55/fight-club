/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { authRateLimit, aiRateLimit } from '#start/limiter'

const AuthController = () => import('#controllers/auth_controller')
const ClassesController = () => import('#controllers/classes_controller')
const SchedulesController = () => import('#controllers/schedules_controller')
const InvitationsController = () => import('#controllers/invitations_controller')
const EnrollmentController = () => import('#controllers/enrollment_controller')
const AnnouncementsController = () => import('#controllers/announcements_controller')
const FeedbackController = () => import('#controllers/feedback_controller')
const BeltProgressController = () => import('#controllers/belt_progress_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const AiController = () => import('#controllers/ai_controller')
const PrivacyController = () => import('#controllers/privacy_controller')
const ReviewsController = () => import('#controllers/reviews_controller')

router.get('/health', async ({ response }) => {
  return response.ok({ status: 'ok' })
})

router
  .group(() => {
    // Public — rate-limited
    router.post('/register', [AuthController, 'register']).use(authRateLimit)
    router.post('/login', [AuthController, 'login']).use(authRateLimit)

    // Protected
    router
      .group(() => {
        router.delete('/logout', [AuthController, 'logout'])
        router.get('/me', [AuthController, 'me'])
        router.put('/me', [AuthController, 'updateMe'])
        router.delete('/me', [AuthController, 'deleteMe'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1/auth')

router
  .group(() => {
    router.post('/', [ClassesController, 'store'])
    router.get('/', [ClassesController, 'index'])
    router.get('/:id', [ClassesController, 'show'])
    router.put('/:id', [ClassesController, 'update'])
    router.delete('/:id', [ClassesController, 'destroy'])
    router.get('/:id/students', [ClassesController, 'students'])
    router.delete('/:classId/students/:enrollmentId', [EnrollmentController, 'removeStudent'])

    router
      .group(() => {
        router.post('/', [SchedulesController, 'store'])
        router.put('/:id', [SchedulesController, 'update'])
        router.delete('/:id', [SchedulesController, 'destroy'])
      })
      .prefix('/:classId/schedules')

    router
      .group(() => {
        router.post('/', [InvitationsController, 'store'])
        router.get('/', [InvitationsController, 'index'])
      })
      .prefix('/:classId/invitations')

    router
      .group(() => {
        router.post('/', [AnnouncementsController, 'store'])
        router.get('/', [AnnouncementsController, 'index'])
        router.delete('/:id', [AnnouncementsController, 'destroy'])
      })
      .prefix('/:classId/announcements')

    // Reviews for a class (teacher and student)
    router
      .group(() => {
        router.post('/', [ReviewsController, 'store'])
        router.get('/', [ReviewsController, 'index'])
        router.get('/summary', [ReviewsController, 'summary'])
        router.put('/:id', [ReviewsController, 'update'])
      })
      .prefix('/:classId/reviews')
  })
  .prefix('/api/v1/classes')
  .use(middleware.auth())

// Invitation revoke (outside classes prefix to avoid classId param collision)
router.delete('/api/v1/invitations/:id', [InvitationsController, 'destroy']).use(middleware.auth())

// Public: get class info from invite token (used by /join/:token page before login)
router.get('/api/v1/invitations/:token/class', [EnrollmentController, 'classFromToken'])

// Enrollment routes (authenticated)
router
  .group(() => {
    router.post('/join/:token', [EnrollmentController, 'join'])
    router.get('/enrollments', [EnrollmentController, 'index'])
    router.delete('/enrollments/:id', [EnrollmentController, 'leave'])

    // Feedback on enrollments
    router.post('/enrollments/:enrollmentId/feedback', [FeedbackController, 'store'])
    router.get('/enrollments/:enrollmentId/feedback', [FeedbackController, 'index'])

    // Belt progress on enrollments
    router.post('/enrollments/:enrollmentId/belts', [BeltProgressController, 'store'])
    router.get('/enrollments/:enrollmentId/belts', [BeltProgressController, 'index'])

    // Notifications
    router.get('/notifications', [NotificationsController, 'index'])
    router.put('/notifications/read-all', [NotificationsController, 'markAllRead'])
    router.put('/notifications/:id/read', [NotificationsController, 'markRead'])

    // Student aggregate views
    router.get('/announcements', [AnnouncementsController, 'myAnnouncements'])
    router.get('/feedback', [FeedbackController, 'myFeedback'])

    // My reviews (student)
    router.get('/my-reviews/:classId', [ReviewsController, 'myReviews'])

    // Reviews via enrollment (student)
    router.get('/enrollments/:enrollmentId/reviews', [ReviewsController, 'enrollmentReviews'])

    // AI
    router.post('/ai/improvement-tips', [AiController, 'improvementTips']).use(aiRateLimit)

    // Privacy
    router.get('/privacy/my-data', [PrivacyController, 'exportData'])
    router.delete('/privacy/my-data', [PrivacyController, 'eraseData'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

// Public privacy policy (no auth)
router.get('/api/v1/privacy/policy', [PrivacyController, 'policy'])

// Avatar proxy: serves avatar images without exposing the real storage URL.
// In dev: reads from tmp/uploads/avatars/
// In production: reverse-proxies to the real Supabase URL stored in user.avatarUrl.
router.get('/api/v1/avatars/:fileName', async ({ params, response }) => {
  const { join } = await import('node:path')
  const { existsSync } = await import('node:fs')
  const { readFile } = await import('node:fs/promises')
  const appMod = await import('@adonisjs/core/services/app')
  const app = appMod.default
  const envMod = await import('#start/env')
  const envService = envMod.default

  const { default: User } = await import('#models/user')

  // Try local file first (dev/test)
  if (envService.get('NODE_ENV') !== 'production') {
    const localPath = join(app.tmpPath(), 'uploads', 'avatars', params.fileName)
    if (existsSync(localPath)) {
      const buffer = await readFile(localPath)
      response.header('content-type', 'image/jpeg')
      response.header('cache-control', 'public, max-age=31536000, immutable')
      return response.send(buffer)
    }
  }

  // Production: find the real URL by matching the filename in avatarUrl
  // Look up any user whose avatar_url ends with this filename
  const user = await User.query()
    .whereRaw('avatar_url LIKE ?', [`%${params.fileName}`])
    .first()

  if (!user?.avatarUrl) {
    return response.status(404).send({ error: { message: 'Avatar not found' } })
  }

  // Proxy the request to the real URL
  try {
    const upstream = await fetch(user.avatarUrl)
    if (!upstream.ok) {
      return response.status(404).send({ error: { message: 'Avatar not found' } })
    }
    const buffer = Buffer.from(await upstream.arrayBuffer())
    response.header('content-type', upstream.headers.get('content-type') ?? 'image/jpeg')
    response.header('cache-control', 'public, max-age=31536000, immutable')
    return response.send(buffer)
  } catch {
    return response.status(404).send({ error: { message: 'Avatar not found' } })
  }
})

// Dev-only: avatar upload proxy (frontend uploads directly to Supabase in production)
router.post('/api/v1/dev/avatar-upload', async ({ request, response }) => {
  const envImport = await import('#start/env')
  const env = envImport.default
  if (env.get('NODE_ENV') === 'production') {
    return response.status(404).send({ error: { message: 'Not found' } })
  }

  const avatar = request.file('avatar', {
    size: '5mb',
    extnames: ['jpg', 'jpeg', 'png', 'webp'],
  })

  if (!avatar || !avatar.isValid) {
    return response.status(422).send({ error: { message: 'Invalid file' } })
  }

  const { cuid } = await import('@adonisjs/core/helpers')
  const { join } = await import('node:path')
  const { existsSync } = await import('node:fs')
  const { mkdir } = await import('node:fs/promises')
  const appMod2 = await import('@adonisjs/core/services/app')
  const app = appMod2.default
  const dir = join(app.tmpPath(), 'uploads', 'avatars')
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const fileName = `${cuid()}.${avatar.extname ?? 'jpg'}`
  await avatar.move(dir, { name: fileName })

  return response.status(200).send({ url: `/api/v1/dev/avatars/${fileName}` })
})

// Dev-only: serve avatar files
router.get('/api/v1/dev/avatars/:fileName', async ({ params, response }) => {
  const envImport2 = await import('#start/env')
  const env = envImport2.default
  if (env.get('NODE_ENV') === 'production') {
    return response.status(404).send({ error: { message: 'Not found' } })
  }

  const { join } = await import('node:path')
  const { existsSync } = await import('node:fs')
  const { readFile } = await import('node:fs/promises')
  const appMod3 = await import('@adonisjs/core/services/app')
  const app = appMod3.default
  const filePath = join(app.tmpPath(), 'uploads', 'avatars', params.fileName)

  if (!existsSync(filePath)) {
    return response.status(404).send({ error: { message: 'File not found' } })
  }

  const buffer = await readFile(filePath)
  response.header('content-type', 'image/jpeg')
  response.header('cache-control', 'public, max-age=31536000')
  return response.send(buffer)
})
