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

const isTestEnv = process.env.NODE_ENV === 'test'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(isTestEnv ? 10_000 : 10).every('1 minute')
})

export const aiRateLimit = limiter.define('ai', (ctx) => {
  return limiter
    .allowRequests(isTestEnv ? 10_000 : 10)
    .every('1 minute')
    .usingKey(`ai_${ctx.auth?.user?.id ?? ctx.request.ip()}`)
})

export const authRateLimit = limiter.define('auth', (ctx) => {
  // Skip rate limiting in test environment to prevent counter accumulation
  // across tests (the database store bypasses the global transaction used for
  // test isolation, so counts persist across the full test run).
  return limiter
    .allowRequests(isTestEnv ? 10_000 : 5)
    .every('1 minute')
    .usingKey(`auth_${ctx.request.ip()}`)
})
