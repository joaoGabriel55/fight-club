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
  })
  .prefix('/api/v1/classes')
  .use(middleware.auth())
