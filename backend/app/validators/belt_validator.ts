import vine from '@vinejs/vine'

export const awardBeltValidator = vine.compile(
  vine.object({
    belt_name: vine.string().trim().minLength(1).maxLength(100),
    awarded_at: vine.date(),
  })
)
