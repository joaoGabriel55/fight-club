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
import { authRateLimit } from '#start/limiter'

const AuthController = () => import('#controllers/auth_controller')
const ClassesController = () => import('#controllers/classes_controller')
const SchedulesController = () => import('#controllers/schedules_controller')
const InvitationsController = () => import('#controllers/invitations_controller')
const EnrollmentController = () => import('#controllers/enrollment_controller')
const AnnouncementsController = () => import('#controllers/announcements_controller')
const FeedbackController = () => import('#controllers/feedback_controller')
const BeltProgressController = () => import('#controllers/belt_progress_controller')
const NotificationsController = () => import('#controllers/notifications_controller')

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
  })
  .prefix('/api/v1')
  .use(middleware.auth())
