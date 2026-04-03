import vine from '@vinejs/vine'

export const createFeedbackValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(10),
  })
)
