import vine from '@vinejs/vine'

export const createInvitationValidator = vine.compile(
  vine.object({
    expires_at: vine.string().trim(),
    max_uses: vine.number().withoutDecimals().min(1).optional().nullable(),
  })
)

export const joinClassValidator = vine.compile(
  vine.object({
    consent: vine.literal(true),
  })
)
