import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Reads the httpOnly `auth_token` cookie and injects it as an
 * `Authorization: Bearer <token>` header so the existing `auth`
 * named middleware can validate cookie-based sessions without changes.
 *
 * Only applied when no Authorization header is already present,
 * allowing direct API calls with a Bearer token to continue working.
 */
export default class CookieTokenMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    if (!request.header('Authorization')) {
      const token = request.cookie('auth_token')
      if (token) {
        request.request.headers['authorization'] = `Bearer ${token}`
      }
    }
    return next()
  }
}
