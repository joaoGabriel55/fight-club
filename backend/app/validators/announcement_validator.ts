import vine from '@vinejs/vine'

export const createAnnouncementValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    content: vine.string().trim().minLength(10),
  })
)
