import vine from '@vinejs/vine'
import { ALLOWED_FOCUS_AREAS } from './constants.js'

export const classTipsValidator = vine.compile(
  vine.object({
    class_id: vine.string().uuid(),
    focus_area: vine.enum(ALLOWED_FOCUS_AREAS).optional(),
  })
)
