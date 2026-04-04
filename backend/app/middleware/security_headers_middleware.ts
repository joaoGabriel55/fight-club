import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SecurityHeadersMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('X-Frame-Options', 'DENY')
    response.header('X-XSS-Protection', '1; mode=block')
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'production') {
      response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    // X-Request-ID
    const existing = request.header('X-Request-ID')
    const requestId = existing ?? crypto.randomUUID()
    response.header('X-Request-ID', requestId)

    return next()
  }
}
