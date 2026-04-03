/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const authRateLimit = limiter.define('auth', (ctx) => {
  // Skip rate limiting in test environment to prevent counter accumulation
  // across tests (the database store bypasses the global transaction used for
  // test isolation, so counts persist across the full test run).
  const limit = process.env.NODE_ENV === 'test' ? 10_000 : 5
  return limiter.allowRequests(limit).every('1 minute').usingKey(`auth_${ctx.request.ip()}`)
})
