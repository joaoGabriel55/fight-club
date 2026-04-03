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
