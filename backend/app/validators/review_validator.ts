import vine from '@vinejs/vine'

export const createReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().withoutDecimals().min(0).max(5),
    comment: vine.string().trim().maxLength(1000).optional(),
    session_date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
)

export const updateReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().withoutDecimals().min(0).max(5),
    comment: vine.string().trim().maxLength(1000).optional(),
  })
)
