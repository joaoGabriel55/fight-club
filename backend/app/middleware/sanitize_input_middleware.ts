import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') return stripHtml(value)
  if (Array.isArray(value)) return value.map(sanitize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
    )
  }
  return value
}

export default class SanitizeInputMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.request.hasBody()) {
      ctx.request.updateBody(sanitize(ctx.request.body()) as Record<string, unknown>)
    }
    return next()
  }
}
