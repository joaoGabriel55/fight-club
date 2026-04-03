import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
    first_name: vine.string().trim().minLength(1).maxLength(100),
    last_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    profile_type: vine.enum(['teacher', 'student'] as const),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    first_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    last_name: vine.string().trim().minLength(1).maxLength(100).optional(),
    avatar_url: vine.string().url().optional().nullable(),
    birth_date: vine.string().optional().nullable(),
    // Student-only fields — ignored silently for teachers
    weight_kg: vine.string().optional().nullable(),
    height_cm: vine.string().optional().nullable(),
  })
)
