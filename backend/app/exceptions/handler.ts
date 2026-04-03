import { HttpContext, ExceptionHandler, errors } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as authErrors } from '@adonisjs/auth'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = false

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response
        .status(422)
        .send({ error: { message: 'Validation failed', fields: error.messages } })
    }

    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.response.status(404).send({ error: { message: 'Not found' } })
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response.status(401).send({ error: { message: 'Unauthorized' } })
    }

    const status = (error as any)?.status ?? 500
    const message =
      status < 500 ? ((error as any)?.message ?? 'Request failed') : 'Internal server error'

    return ctx.response.status(status).send({ error: { message } })
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
